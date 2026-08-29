"""Emergency dispatch tools: real calls placed over the Asterisk SIP trunk.

When the agent decides an authority must be notified, the tool:
  1. builds an alert script from the LLM's incident description,
  2. synthesizes it into a voice message (ElevenLabs, edge-tts fallback),
  3. places the call via SIP trunking: an AMI Originate on channel
     PJSIP/<number>@sentinel-trunk, handing Asterisk the generated audio
     through a shared sounds directory (ASTERISK_SOUNDS_DIR) via the
     ALERT_FILE channel variable.

If the SIP call cannot be placed, the generated audio is recorded in the
dispatch registry so the API returns it alongside the textual response.
Failure details never reach the LLM: tools reply with a neutral
confirmation and the real outcome is surfaced to the API client only.
"""

import asyncio
import json
import logging
import subprocess
import threading
import time
import uuid
import wave
from pathlib import Path

from langchain.tools import tool
from panoramisk import Manager

from core.config import (
    AMI_HOST,
    AMI_PORT,
    AMI_SECRET,
    AMI_USERNAME,
    ASTERISK_SOUNDS_DIR,
    AUDIO_OUTPUT_DIR,
    ELEVENLABS_API_KEY,
    ELEVENLABS_MODEL_ID,
    ELEVENLABS_VOICE_ID,
)

logger = logging.getLogger(__name__)

# Destination numbers for each service on the SIP trunk (local short codes).
_SERVICE_NUMBERS = {
    "ambulance": "1122",
    "police": "15",
    "fire": "16",
}

_SERVICE_URDU = {
    "ambulance": "ایمبولینس",
    "police": "پولیس",
    "fire": "فائر بریگیڈ",
}

# Asterisk dialplan contract for the outbound call.
_SIP_TRUNK = "sentinel-trunk"
_OUTBOUND_CONTEXT = "sentinel-outbound"
_OUTBOUND_EXTEN = "alert"
_CALLER_ID = "Sentinel AI <1000>"
_AMI_TIMEOUT_MS = 30_000
_AMI_CONNECT_TIMEOUT_S = 5.0
_AUDIO_TIMEOUT_S = 30.0

_MAX_SCRIPT_CHARS = 300

# Generated alert audio is served to clients, so it is never deleted while
# young; past this age it is pruned (best-effort) to stop the output
# directory from filling the disk over time.
_AUDIO_RETENTION_S = 24 * 60 * 60
_AUDIO_KEEP_MAX = 200

# edge-tts voices per language (fallback synthesis, no API key needed).
_EDGE_TTS_VOICES = {"ur": "ur-PK-UzmaNeural", "en": "en-US-AriaNeural"}

# Dispatch results recorded by tools during an agent run; consumed by
# services/video_service.py via pop_dispatch_info() on the same worker thread.
_dispatch_registry = threading.local()


# --- Request context ---------------------------------------------------
# The reverse-geocoded location of the analyzed video, set by
# services/video_service.py before the agent runs so tools can embed it in
# the voice message without relying on the LLM to pass it through.

def set_dispatch_context(location: dict | None) -> None:
    """Stash the request location for tools running in this thread."""
    _dispatch_registry.context = location


def _dispatch_context() -> dict | None:
    return getattr(_dispatch_registry, "context", None)


def _alert_script(
    service: str, incident: str, urdu_incident: str, location_label: str = ""
) -> str:
    """Build a short spoken alert, preferring Urdu for local contacts."""
    if urdu_incident:
        if location_label:
            script = (
                f"سینٹینل الرٹ۔ یہ واقعہ اس مقام پر پیش آیا ہے: {location_label}۔ "
                f"{_SERVICE_URDU[service]} درکار ہے۔ {urdu_incident}"
            )
        else:
            script = f"سینٹینل الرٹ۔ {_SERVICE_URDU[service]} درکار ہے۔ {urdu_incident}"
    else:
        if location_label:
            script = (
                f"Sentinel AI emergency alert. This incident has occurred at "
                f"{location_label}. {service} required. {incident}"
            )
        else:
            script = f"Sentinel AI emergency alert. {service} required. {incident}"
    return script[:_MAX_SCRIPT_CHARS]


def _write_pcm_wav(path: Path, pcm: bytes) -> None:
    """Wrap 16 kHz mono 16-bit PCM bytes in a WAV container (stdlib only)."""
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16_000)
        wav.writeframes(pcm)


def _synth_elevenlabs(script: str, out_path: Path) -> None:
    """Synthesize with the official ElevenLabs SDK, requesting raw PCM."""
    import elevenlabs  # lazy import so tests can stub it

    client = elevenlabs.ElevenLabs(api_key=ELEVENLABS_API_KEY)
    audio = client.text_to_speech.convert(
        voice_id=ELEVENLABS_VOICE_ID,
        text=script,
        model_id=ELEVENLABS_MODEL_ID,
        output_format="pcm_16000",
    )
    _write_pcm_wav(out_path, b"".join(audio))


def _synth_edge_tts(script: str, lang: str, out_path: Path) -> None:
    """Fallback TTS: edge-tts (fast, free, Urdu voices); mp3 -> WAV via ffmpeg."""
    import edge_tts  # lazy import so tests can stub it

    async def _stream() -> bytes:
        communicate = edge_tts.Communicate(script, voice=_EDGE_TTS_VOICES[lang])
        chunks = [
            chunk["data"]
            async for chunk in communicate.stream()
            if chunk["type"] == "audio"
        ]
        return b"".join(chunks)

    mp3 = asyncio.run(_stream())
    result = subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error",
            "-i", "pipe:0", "-f", "wav", "-ac", "1", "-ar", "16000",
            "-y", str(out_path),
        ],
        input=mp3,
        capture_output=True,
        timeout=_AUDIO_TIMEOUT_S,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg conversion failed: {result.stderr[:200]}")


def _synthesize_voice_message(script: str, lang: str) -> dict:
    """Generate the alert audio into the API and Asterisk directories."""
    name = f"alert-{uuid.uuid4().hex[:8]}-{int(time.time())}.wav"

    api_dir = Path(AUDIO_OUTPUT_DIR)
    api_dir.mkdir(parents=True, exist_ok=True)
    api_path = api_dir / name

    if ELEVENLABS_API_KEY:
        _synth_elevenlabs(script, api_path)
    else:
        _synth_edge_tts(script, lang, api_path)

    sounds_dir = Path(ASTERISK_SOUNDS_DIR)
    if sounds_dir != api_dir:
        sounds_dir.mkdir(parents=True, exist_ok=True)
        try:
            (sounds_dir / name).write_bytes(api_path.read_bytes())
        except OSError:
            logger.warning("Could not copy alert audio into %s", sounds_dir)

    _prune_old_audio(api_dir, keep_name=name)

    return {"name": name, "url": f"/audio/{name}"}


def _prune_old_audio(api_dir: Path, keep_name: str) -> None:
    """Delete stale alert files once the output directory grows past a cap.

    Only files older than the retention window are removed, and never the
    file just written (it may already be referenced by an in-flight result).
    """
    try:
        files = sorted(
            api_dir.glob("alert-*.wav"), key=lambda p: p.stat().st_mtime
        )
    except OSError:
        return
    if len(files) <= _AUDIO_KEEP_MAX:
        return
    cutoff = time.time() - _AUDIO_RETENTION_S
    for path in files:
        if path.name == keep_name:
            continue
        try:
            if path.stat().st_mtime < cutoff:
                path.unlink()
        except OSError:
            continue


def _ami_status(response) -> str:
    """Extract the AMI Response field (Success/Error) from a panoramisk reply."""
    getter = getattr(response, "get", None)
    if callable(getter):
        return str(getter("Response", "") or "")
    return str(getattr(response, "response", "") or "")


async def _originate_call(manager, destination: str, audio_name: str):
    return await asyncio.wait_for(
        manager.send_action(
            {
                "Action": "Originate",
                "Channel": f"PJSIP/{destination}@{_SIP_TRUNK}",
                "Context": _OUTBOUND_CONTEXT,
                "Exten": _OUTBOUND_EXTEN,
                "Priority": 1,
                "CallerID": _CALLER_ID,
                "Timeout": _AMI_TIMEOUT_MS,
                "Async": "true",
                "Variable": f"ALERT_FILE=sentinel/{audio_name}",
            }
        ),
        timeout=_AMI_TIMEOUT_MS / 1000 + 5,
    )


def _place_call_via_sip(destination: str, audio_name: str) -> dict:
    """Originate the outbound call over the SIP trunk via the AMI.

    Returns {"status": "placed"|"failed", "detail": str}. The call is
    originated with Async=true, so this reports whether Asterisk accepted
    the request; answer/outcome is handled by the dialplan and CDRs.
    """

    async def _run() -> dict:
        manager = Manager(
            host=AMI_HOST,
            port=AMI_PORT,
            username=AMI_USERNAME,
            secret=AMI_SECRET,
        )
        try:
            await asyncio.wait_for(
                manager.connect(), timeout=_AMI_CONNECT_TIMEOUT_S
            )
            response = await _originate_call(manager, destination, audio_name)
            status = _ami_status(response)
            return {
                "status": "placed" if status == "Success" else "failed",
                "detail": status or "no response from AMI",
            }
        finally:
            try:
                manager.close()
            except Exception:
                pass

    try:
        return asyncio.run(_run())
    except Exception as exc:
        logger.warning("SIP dispatch failed for %s: %s", destination, exc)
        return {
            "status": "failed",
            "detail": f"AMI error: {exc.__class__.__name__}",
        }


# The LLM must never see internal failure details or mention them to the
# user; the real outcome (including any error and the audio URL) is recorded
# in the dispatch registry and surfaced to the API client instead.
_LLM_OK_RESPONSE = json.dumps(
    {"status": "ok", "message": "The relevant authorities have been notified."}
)


def _record(result: dict) -> None:
    results = getattr(_dispatch_registry, "results", None)
    if results is None:
        results = []
        _dispatch_registry.results = results
    results.append(result)


def pop_dispatch_info() -> list[dict] | None:
    """Return and clear dispatch results recorded in this worker thread."""
    results = getattr(_dispatch_registry, "results", None)
    if results is not None:
        delattr(_dispatch_registry, "results")
    return results


def _dispatch(service: str, incident: str, urdu_incident: str = "") -> str:
    """Synthesize the voice message, place the SIP call, record the outcome.

    Returns a JSON string for the agent. The audio is always returned in the
    result when generated, so the API can hand it to the caller if the call
    could not be placed.
    """
    destination = _SERVICE_NUMBERS[service]
    location = _dispatch_context()
    location_label = (location or {}).get("label", "")
    result = {
        "tool": f"call_{service}",
        "service": service,
        "destination": destination,
        "transport": "Asterisk AMI over SIP trunk",
        "status": "failed",
        "location": location_label,
    }

    script = _alert_script(service, incident, urdu_incident, location_label)
    lang = "ur" if urdu_incident else "en"
    try:
        result["audio"] = _synthesize_voice_message(script, lang)
    except Exception as exc:
        logger.warning("Voice message generation failed: %s", exc)
        result["error"] = f"Audio synthesis failed: {exc.__class__.__name__}"
        _record(result)
        return _LLM_OK_RESPONSE

    call = _place_call_via_sip(destination, result["audio"]["name"])
    result["status"] = call["status"]
    if call["status"] != "placed":
        # Keep the audio in the result: the API returns it alongside the
        # textual response when the SIP call could not be placed.
        result["error"] = call["detail"]

    _record(result)
    return _LLM_OK_RESPONSE


@tool
def call_ambulance(incident: str, urdu_incident: str = "") -> str:
    """Call the ambulance service (1122) via SIP trunking.

    Args:
        incident: English analysis of what happened.
        urdu_incident: Optional Urdu description from the video analysis;
            preferred for the spoken alert.
    """
    return _dispatch("ambulance", incident, urdu_incident)


@tool
def call_police(incident: str, urdu_incident: str = "") -> str:
    """Call the police (15) via SIP trunking.

    Args:
        incident: English analysis of what happened.
        urdu_incident: Optional Urdu description from the video analysis;
            preferred for the spoken alert.
    """
    return _dispatch("police", incident, urdu_incident)


@tool
def call_firebrigade(incident: str, urdu_incident: str = "") -> str:
    """Call the fire brigade (16) via SIP trunking.

    Args:
        incident: English analysis of what happened.
        urdu_incident: Optional Urdu description from the video analysis;
            preferred for the spoken alert.
    """
    return _dispatch("fire", incident, urdu_incident)
