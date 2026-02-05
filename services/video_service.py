from langchain_core.messages import HumanMessage
from services.process_video import process_video_for_incidents
from core.agent import get_incident_agent
from core.config import SYSTEM_PROMPT

def analyze_video(video_path: str):
    agent = get_incident_agent()

    video_analysis = process_video_for_incidents(video_path)

    message = HumanMessage(
        content=f"{SYSTEM_PROMPT}\n\nVideo Analysis:\n{video_analysis}"
    )

    response = agent.invoke({"messages": [message]})

    return video_analysis, response
