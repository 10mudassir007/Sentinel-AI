import os
import cv2
import base64
import numpy as np
from dotenv import load_dotenv
from core.llm import get_vision_llm
from core.yolo_helpers import detect_objects, draw_detections
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage


# ------------------------------------------------------------------
load_dotenv()

vision_llm = get_vision_llm()

# ------------------------------------------------------------------
# Helper functions

def analyze_frame(frame: np.ndarray, previous_description: str = "") -> str:
    """Analyze a single frame using the LLM, passing previous description as context."""
    messages = []
    prompt_text = f"""
    You are analyzing a video frame, The video is of an incident being happening, you are also given description of previous frame.
    Previous frame description (context): {previous_description if previous_description else 'None'}

    Rules:
    - Focus on the main event in this frame.
    - Mention what is happening in the image.
    - Do not include minor movements.
    - Make the description brief not too lengthy while capturing the details.
    """
    messages.append({"type": "text", "text": prompt_text})
    
    success, buffer = cv2.imencode(".jpg", frame)
    if success:
        encoded_image = base64.b64encode(buffer).decode("utf-8")
        messages.append({"type": "image_url",
                         "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"}})

    message_obj = HumanMessage(content=messages)
    try:
        response = vision_llm.invoke([message_obj])
        return response.content
    except Exception as exc:
        return f"Vision model error: {exc}"

# ------------------------------------------------------------------
# Main processing

def process_video_for_incidents(video_path: str, target_fps: float = 1,
                                start_pct: float = 0.0, end_pct: float = 1.0,
                                show_frames: bool = False) -> dict:
    last_description = ""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise FileNotFoundError(f"Unable to open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 1.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    total_duration = total_frames / fps

    start_time = total_duration * start_pct
    end_time = total_duration * end_pct

    frame_index = 0
    previous_frame = None
    motion_history = []
    incidents = []

    HISTORY_SIZE = 15
    MOTION_STD_MULTIPLIER = 0.5
    MIN_MOTION_PERCENT = 0.15
    FRAME_SKIP = max(int(fps / target_fps), 1)

    print("Processing Video for Main Incident...")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        timestamp = frame_index / fps
        if timestamp < start_time:
            frame_index += 1
            continue
        if timestamp > end_time:
            break
        if frame_index % FRAME_SKIP != 0:
            frame_index += 1
            continue

        # Compute motion
        motion_score = 0
        if previous_frame is not None:
            diff = cv2.absdiff(previous_frame, frame)
            gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (5, 5), 0)
            _, thresh = cv2.threshold(gray, 12, 255, cv2.THRESH_BINARY)
            motion_score = (np.count_nonzero(thresh) / thresh.size) * 100
            motion_history.append(motion_score)
            if len(motion_history) > HISTORY_SIZE:
                motion_history.pop(0)

        previous_frame = frame.copy()
        if len(motion_history) < 5:
            frame_index += 1
            continue

        mean_motion = np.mean(motion_history)
        std_motion = np.std(motion_history)
        #dynamic_threshold = max(mean_motion + MOTION_STD_MULTIPLIER * std_motion,
#                                MIN_MOTION_PERCENT)
        dynamic_threshold = max(mean_motion * 0.8, MIN_MOTION_PERCENT)

        if motion_score < dynamic_threshold:
            frame_index += 1
            continue


        # Detect objects
        detections = detect_objects(frame)
        if not detections:
            frame_index += 1
            continue

        # Analyze frame immediately with previous context
        description = analyze_frame(frame, last_description)
        last_description = description

        incidents.append({
            "timestamp": round(timestamp, 2),
            "objects": detections,
            "llm_description": description
        })

        if show_frames:
            annotated = draw_detections(frame, detections)
            cv2.imshow("Main Event Frame", annotated)
            cv2.waitKey(50)

        frame_index += 1

    cap.release()
    if show_frames:
        cv2.destroyAllWindows()

    return {
        "video_path": video_path,
        "total_frames": total_frames,
        "incidents": incidents
    }

# ------------------------------------------------------------------
if __name__ == "__main__":
    import json
    result = process_video_for_incidents("services/armed robbery in Pakistan.mp4", show_frames=True)
    print(json.dumps(result, indent=2))

