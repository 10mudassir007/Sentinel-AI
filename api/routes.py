import os
import shutil
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, UploadFile, File, HTTPException

from services.video_service import analyze_video

router = APIRouter()

@router.post("/analyze-video")
async def analyze_video_endpoint(file: UploadFile = File(...)):
    if not file.filename.endswith((".mp4", ".avi", ".mov")):
        raise HTTPException(status_code=400, detail="Unsupported video format")

    with NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        shutil.copyfileobj(file.file, tmp)
        path = tmp.name

    try:
        video_analysis, agent_response = analyze_video(path)
        llm_response = agent_response
    finally:
        os.remove(path)
        

    return {
        "filename": file.filename,
        "incidents_detected": len(video_analysis.get("incidents", [])),
        "video_analysis": video_analysis,
        "agent_response":agent_response['messages'][-1].content
        #"final_response": llm_response
    }
