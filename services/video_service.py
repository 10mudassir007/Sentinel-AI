import json
import logging

from langchain_core.messages import AIMessage, HumanMessage

from core.agent import get_incident_agent
from core.config import MAX_FRAMES_TO_ANALYZE
from core.escalation import tracker_for
from core.tools import pop_dispatch_info, set_dispatch_context
from services.process_video import process_video_for_incidents

logger = logging.getLogger(__name__)


# Answer used when the escalation state machine has not confirmed an incident
# yet: no agent run, no dispatch - the flood is throttled instead of being
# re-evaluated from scratch on every upload.
_MONITORING_ANSWER = (
    "No confirmed incident yet. The system is continuing to monitor this "
    "camera; an alert will be dispatched if the incident is confirmed."
)


def _extract_agent_answer(messages: list) -> str:
    """Return the text of the last AI message, tolerating structured content."""
    for message in reversed(messages):
        if not isinstance(message, AIMessage) or not message.content:
            continue
        content = message.content
        if isinstance(content, str):
            return content
        parts = [block.get("text", "") for block in content if isinstance(block, dict)]
        text = " ".join(part for part in parts if part).strip()
        if text:
            return text
    return ""


def analyze_video(
    video_path: str,
    max_frames_analyzed: int | None = MAX_FRAMES_TO_ANALYZE,
    languages: list[str] | None = None,
    location: dict | None = None,
    camera_id: str | None = None,
    single_upload: bool = False,
) -> tuple[dict, str, list[dict] | None]:
    agent = get_incident_agent()

    # Hand the reverse-geocoded location and the requested languages to the
    # dispatch tools (location is embedded in the voice message, and the
    # languages decide whether that message is spoken in Urdu or English).
    set_dispatch_context(location, languages)
    try:
        return _analyze(
            video_path,
            agent,
            max_frames_analyzed,
            languages,
            location,
            camera_id,
            single_upload,
        )
    finally:
        set_dispatch_context(None)


def _analyze(
    video_path,
    agent,
    max_frames_analyzed,
    languages,
    location,
    camera_id,
    single_upload=False,
):
    video_analysis = process_video_for_incidents(
        video_path,
        max_frames_analyzed=max_frames_analyzed,
        languages=languages,
        camera_id=camera_id,
        single_upload=single_upload,
    )

    # The agent - and with it the 1122 dispatch tools - runs only when the
    # per-camera escalation state machine reached ALERT. Repeated gated
    # detections while CONFIRMING are what authorize it; anything else is
    # throttled without an LLM call.
    if not video_analysis.get("alert"):
        return video_analysis, _MONITORING_ANSWER, None

    context = ""
    if location:
        context = f"Location:\n{json.dumps(location, indent=2)}\n\n"

    message = HumanMessage(
        content=(f"{context}Video Analysis:\n{json.dumps(video_analysis, indent=2)}")
    )

    tracker = tracker_for(video_analysis["camera_id"])
    try:
        response = agent.invoke({"messages": [message]})

        # Collect dispatch results (SIP call outcomes + generated audio).
        # Tools run in LangGraph worker threads; the results are stored via
        # contextvars.ContextVar which is propagated across threads.
        dispatch = pop_dispatch_info()
    except Exception:
        logger.exception(
            "Agent dispatch failed for camera %s - incident recorded without dispatch",
            video_analysis.get("camera_id", "?"),
        )
        # Return a degraded response so the incident is still persisted by
        # the caller. The answer text signals the operator that dispatch
        # did not proceed.
        return (
            video_analysis,
            (
                "The system detected an incident but the dispatch agent could not "
                "be reached. The operator feed has been updated for manual review."
            ),
            None,
        )
    finally:
        # ALERT -> COOLDOWN: one dispatch attempt per incident lifecycle,
        # whether or not the tools succeeded.
        tracker.mark_alert_done()

    return video_analysis, _extract_agent_answer(response["messages"]), dispatch
