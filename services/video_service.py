import json

from langchain_core.messages import AIMessage, HumanMessage

from core.agent import get_incident_agent
from core.config import MAX_FRAMES_TO_ANALYZE, SYSTEM_PROMPT
from core.tools import pop_dispatch_info, set_dispatch_context
from services.process_video import process_video_for_incidents


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
) -> tuple[dict, str, list[dict] | None]:
    agent = get_incident_agent()

    # Hand the reverse-geocoded location to the dispatch tools (they embed it
    # in the voice message) and to the agent (it mentions it in its answer).
    set_dispatch_context(location)
    try:
        return _analyze(video_path, agent, max_frames_analyzed, languages, location)
    finally:
        set_dispatch_context(None)


def _analyze(video_path, agent, max_frames_analyzed, languages, location):
    video_analysis = process_video_for_incidents(
        video_path,
        max_frames_analyzed=max_frames_analyzed,
        languages=languages,
    )

    context = ""
    if location:
        context = (
            f"Location:\n{json.dumps(location, indent=2)}\n\n"
        )

    message = HumanMessage(
        content=(
            f"{SYSTEM_PROMPT}\n\n{context}"
            f"Video Analysis:\n{json.dumps(video_analysis, indent=2)}"
        )
    )

    response = agent.invoke({"messages": [message]})

    # Tool calls ran synchronously in this thread; collect their dispatch
    # results (SIP call outcomes + generated audio) for the API response.
    dispatch = pop_dispatch_info()

    return video_analysis, _extract_agent_answer(response["messages"]), dispatch
