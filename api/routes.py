import asyncio
import logging
import os
import threading
from pathlib import Path
from tempfile import NamedTemporaryFile

import cv2
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from core.config import (
    AUDIO_OUTPUT_DIR,
    DESCRIPTION_LANGUAGES,
    MAX_UPLOAD_SIZE,
    MAX_VIDEO_SECONDS,
    SUPPORTED_DESCRIPTION_LANGUAGES,
)
from core.security import client_ip, create_session, require_auth
from services.geocode import reverse_geocode
from services.video_service import analyze_video

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_EXTENSIONS = (".mp4", ".avi", ".mov")
_CHUNK_SIZE = 1024 * 1024


class LoginRequest(BaseModel):
    cnic: str


@router.post("/login")
async def login_endpoint(request: LoginRequest) -> dict:
    """Exchange a valid CNIC for a bearer token used on every other endpoint."""
    return create_session(request.cnic)


def _parse_language_param(raw: str) -> list[str]:
    """Parse the client-supplied language list; empty falls back to the server default."""
    codes = [code.strip().lower() for code in raw.split(",") if code.strip()]
    if codes and any(code not in SUPPORTED_DESCRIPTION_LANGUAGES for code in codes):
        raise HTTPException(
            status_code=422,
            detail="language must be one of: "
            + ", ".join(SUPPORTED_DESCRIPTION_LANGUAGES),
        )
    return codes or list(DESCRIPTION_LANGUAGES)


def _has_supported_extension(filename: str | None) -> bool:
    return bool(filename and filename.lower().endswith(ALLOWED_EXTENSIONS))


def _has_video_magic_bytes(file: UploadFile) -> bool:
    """Reject files whose content is not actually MP4/MOV or AVI."""
    try:
        file.file.seek(0)
        header = file.file.read(16)
        file.file.seek(0)
    except (OSError, ValueError):
        return False

    if len(header) < 12:
        return False
    if header[4:8] == b"ftyp":  # MP4 / MOV (ISO Base Media)
        return True
    if header[0:4] == b"RIFF" and header[8:12] == b"AVI ":  # AVI
        return True
    return False


def _parse_coordinates(latitude: str, longitude: str) -> tuple[float, float] | None:
    """Parse and validate optional client coordinates; both-or-neither."""
    if not latitude and not longitude:
        return None
    if not latitude or not longitude:
        raise HTTPException(
            status_code=422, detail="Both latitude and longitude are required"
        )
    try:
        lat, lon = float(latitude), float(longitude)
    except ValueError:
        raise HTTPException(
            status_code=422, detail="latitude and longitude must be numbers"
        )
    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
        raise HTTPException(
            status_code=422,
            detail="latitude must be within [-90, 90] and longitude within [-180, 180]",
        )
    return lat, lon


def _resolve_location(latitude: str, longitude: str) -> dict | None:
    """Reverse-geocode client coordinates; degrade to raw coordinates on failure."""
    coords = _parse_coordinates(latitude, longitude)
    if coords is None:
        return None
    lat, lon = coords
    try:
        return reverse_geocode(lat, lon)
    except Exception:
        # An emergency analysis must not fail because the geocoder is down.
        logger.warning("Reverse geocoding failed for %s, %s", lat, lon, exc_info=True)
        return {
            "latitude": lat,
            "longitude": lon,
            "display_name": f"{lat}, {lon}",
            "label": f"{lat}, {lon}",
            "geocode_error": "reverse geocoding failed",
        }


# --- Per-source processing queue --------------------------------------
# Requests from the same source (camera_id, or the client IP when no
# camera_id is sent) are serialized: a new clip waits until the previous
# analysis finishes and its response has been sent, then starts.
_source_locks: dict[str, asyncio.Lock] = {}
_source_locks_guard = threading.Lock()
_MAX_QUEUED_SOURCES = 1024
_MAX_SOURCE_KEY_LEN = 256


def _source_key(camera_id: str, request: Request) -> str:
    """Queue key: camera_id wins, else the proxy-aware client IP.

    The camera_id is attacker-supplied, so it is capped before use as a
    registry key; the IP follows the same X-Forwarded-For rules as the rate
    limiter so a reverse proxy does not collapse all clients into one slot.
    """
    if camera_id:
        return camera_id[:_MAX_SOURCE_KEY_LEN]
    return client_ip(request.scope)


def _source_lock(source: str) -> asyncio.Lock:
    """Get (or create) the queue lock for one source."""
    with _source_locks_guard:
        lock = _source_locks.get(source)
        if lock is None:
            if len(_source_locks) >= _MAX_QUEUED_SOURCES:
                _source_locks.clear()
            lock = asyncio.Lock()
            _source_locks[source] = lock
        return lock


def _probe_duration(path: str) -> float | None:
    """Return the video duration in seconds, or None when it cannot be read.

    A probe that fails never blocks the request: unknown duration passes.
    """
    cap = cv2.VideoCapture(path)
    try:
        if not cap.isOpened():
            return None
        # Seek to the end (O(1) for most containers) and read the position.
        if cap.set(cv2.CAP_PROP_POS_AVI_RATIO, 1.0):
            msec = cap.get(cv2.CAP_PROP_POS_MSEC)
            if msec and msec > 0:
                return msec / 1000.0
        fps = cap.get(cv2.CAP_PROP_FPS) or 1.0
        frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if frames > 0:
            return frames / fps
        return None
    finally:
        cap.release()


@router.post("/analyze-video")
async def analyze_video_endpoint(
    request: Request,
    file: UploadFile = File(...),
    language: str = Form(""),
    latitude: str = Form(""),
    longitude: str = Form(""),
    camera_id: str = Form(""),
    single_upload: str = Form(""),
    _: None = Depends(require_auth),
):
    if not _has_supported_extension(file.filename):
        raise HTTPException(status_code=400, detail="Unsupported video format")

    if not _has_video_magic_bytes(file):
        raise HTTPException(
            status_code=400,
            detail="File content does not match a supported video format",
        )

    languages = _parse_language_param(language)
    location = _resolve_location(latitude, longitude)

    # Queue key: an explicit camera_id wins; otherwise the client IP defines
    # the source so one-off uploads from the same client also serialize.
    source = _source_key(camera_id, request)

    tmp_path = None
    try:
        with NamedTemporaryFile(
            delete=False, suffix=os.path.splitext(file.filename or "")[1] or ".mp4"
        ) as tmp:
            tmp_path = tmp.name
            copied = 0
            while chunk := file.file.read(_CHUNK_SIZE):
                copied += len(chunk)
                if copied > MAX_UPLOAD_SIZE:
                    raise HTTPException(status_code=413, detail="File exceeds size limit")
                tmp.write(chunk)

        # Duration gate: reject clips longer than MAX_VIDEO_SECONDS before any
        # analysis work starts (an unreadable probe passes - never blocks).
        duration = _probe_duration(tmp_path)
        if duration is not None and duration > MAX_VIDEO_SECONDS:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Video exceeds the maximum allowed duration of "
                    f"{MAX_VIDEO_SECONDS:g} seconds"
                ),
            )

        # Per-source queue: the next clip from this source starts processing
        # only after this one finished and its response was sent back.
        lock = _source_lock(source)
        await lock.acquire()
        try:
            video_analysis, agent_answer, dispatch = await run_in_threadpool(
                analyze_video, tmp_path, languages=languages, location=location,
                camera_id=camera_id or None,
                single_upload=single_upload.lower() in ("1", "true", "yes"),
            )
        finally:
            lock.release()
    except HTTPException:
        raise
    except Exception:
        logger.exception("Video analysis failed")
        raise HTTPException(status_code=500, detail="Internal server error during analysis")
    finally:
        if tmp_path:
            try:
                os.remove(tmp_path)
            except OSError:
                logger.warning("Could not remove temporary file %s", tmp_path)

    # Extract the generated audio filename from the first dispatch result
    # that produced one, so the caller can fetch it via GET /audio/{filename}
    # without parsing the dispatch list themselves.
    audio_file = None
    if dispatch:
        for entry in dispatch:
            audio = entry.get("audio")
            if audio and audio.get("name"):
                audio_file = audio["name"]
                break

    # Conditionally include dispatch/audio only when dispatch fired.
    # When no incident was detected these fields are omitted entirely
    # (not even null) so the client can distinguish "no incident" from
    # "incident but dispatch failed".
    result = {
        "filename": file.filename,
        "camera_id": video_analysis.get("camera_id"),
        "location": location,
        "escalation": video_analysis.get("escalation"),
        "incidents_detected": len(video_analysis.get("incidents", [])),
        "video_analysis": video_analysis,
        "agent_response": agent_answer,
    }
    if dispatch is not None:
        result["dispatch"] = dispatch
        result["audio_file"] = audio_file
    return result


@router.get("/audio/{filename}")
async def get_generated_audio(
    filename: str, _: None = Depends(require_auth)
):
    """Serve a generated voice message referenced by a dispatch result."""
    audio_dir = Path(AUDIO_OUTPUT_DIR).resolve()
    file_path = (audio_dir / filename).resolve()
    if file_path.parent != audio_dir or file_path.suffix.lower() != ".wav":
        raise HTTPException(status_code=404, detail="Audio not found")
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(file_path, media_type="audio/wav")
