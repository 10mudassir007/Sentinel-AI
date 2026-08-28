import json

from langchain_core.messages import AIMessage, HumanMessage

from core.agent import get_incident_agent
from core.config import MAX_FRAMES_TO_ANALYZE, SYSTEM_PROMPT
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
) -> tuple[dict, str]:
    agent = get_incident_agent()

    video_analysis = process_video_for_incidents(
        video_path,
        max_frames_analyzed=max_frames_analyzed,
        languages=languages,
    )

    message = HumanMessage(
        content=f"{SYSTEM_PROMPT}\n\nVideo Analysis:\n{json.dumps(video_analysis, indent=2)}"
    )

    response = agent.invoke({"messages": [message]})

    return video_analysis, _extract_agent_answer(response["messages"])
