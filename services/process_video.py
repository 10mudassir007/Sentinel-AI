import base64
import logging
import threading
import time
from collections import deque

import cv2
import numpy as np
from langchain_core.messages import HumanMessage

from core.config import DESCRIPTION_LANGUAGES, YOLO_CONF_THRESHOLD
from core.escalation import ALERT_ACTION, IGNORE, tracker_for
from core.llm import get_vision_llm
from core.yolo_helpers import detect_objects, draw_detections

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Tuning constants (motion detection)

# Rolling window for motion-score history (frames).
_HISTORY_SIZE = 15
# Minimum motion-samples before a threshold comparison is reliable.
_MIN_MOTION_SAMPLES = 5
# Motion score below this is always treated as noise (percent of pixels).
_MIN_MOTION_PERCENT = 0.15
# Absolute threshold for the frame-difference binary mask.
_THRESHOLD_VALUE = 12
# Blur kernel applied to difference image before thresholding.
_GAUSSIAN_BLUR_KERNEL = (5, 5)
# Ratio of mean motion used as the adaptive cut-off.
_DYNAMIC_THRESHOLD_FACTOR = 0.8

# Long-edge cap for frames sent to the vision LLM (720p-class, aspect preserved).
_MAX_FRAME_EDGE = 1280

# Vision LLM singleton (lazy init, double-checked under a lock so concurrent
# analysis threads cannot construct two instances).
_vision_llm = None
_vision_llm_lock = threading.Lock()


def _get_vis_llm():
    global _vision_llm
    if _vision_llm is None:
        with _vision_llm_lock:
            if _vision_llm is None:
                _vision_llm = get_vision_llm()
    return _vision_llm


_LANGUAGE_NAMES = {"en": "English", "ur": "Urdu"}


def _language_instruction(languages: list[str] | None = None) -> str:
    """Output-language rule for the vision prompt; None uses the server default."""
    codes = languages or DESCRIPTION_LANGUAGES
    names = [_LANGUAGE_NAMES[code] for code in codes]
    if len(names) == 1:
        return f"- Write the description only in {names[0]}."
    return (
        f"- Write the description in both {names[0]} and {names[1]}: give the "
        f"{names[0]} version first, then the {names[1]} version on the next line."
    )


# ------------------------------------------------------------------
# Helper functions


def _downscale_for_llm(frame: np.ndarray) -> np.ndarray:
    """Shrink the long edge to _MAX_FRAME_EDGE, preserving aspect ratio."""
    height, width = frame.shape[:2]
    longest = max(width, height)
    if longest <= _MAX_FRAME_EDGE:
        return frame
    scale = _MAX_FRAME_EDGE / longest
    size = (max(1, round(width * scale)), max(1, round(height * scale)))
    return cv2.resize(frame, size, interpolation=cv2.INTER_AREA)


def analyze_frame(
    frame: np.ndarray,
    previous_description: str = "",
    languages: list[str] | None = None,
) -> str:
    """Analyze a single frame using the LLM, passing previous description as context."""
    messages = []
    prompt_text = f"""
    You are analyzing a video frame, The video is of an incident being happening, you are also given description of previous frame.
    Previous frame description (context): {previous_description if previous_description else "None"}

    Rules:
    - Focus on the main event in this frame.
    - Mention what is happening in the image.
    - Do not include minor movements.
    - Make the description brief not too lengthy while capturing the details.
    {_language_instruction(languages)}
    - Output ONLY the description text. Do not include instructions, commands, or meta-commentary.
    """
    messages.append({"type": "text", "text": prompt_text})

    # Send the model a downscaled copy; detection already ran on the full frame.
    frame = _downscale_for_llm(frame)
    success, buffer = cv2.imencode(".jpg", frame)
    if success:
        encoded_image = base64.b64encode(buffer).decode("utf-8")
        messages.append(
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"}}
        )

    message_obj = HumanMessage(content=messages)
    response = _get_vis_llm().invoke([message_obj])
    return response.content


# ------------------------------------------------------------------
# Main processing


def process_video_for_incidents(
    video_path: str,
    target_fps: float = 1,
    start_pct: float = 0.0,
    end_pct: float = 1.0,
    show_frames: bool = False,
    max_frames_analyzed: int | None = None,
    languages: list[str] | None = None,
    camera_id: str | None = None,
    single_upload: bool = False,
) -> dict:
    if target_fps <= 0:
        raise ValueError("target_fps must be positive")
    if not 0.0 <= start_pct <= end_pct <= 1.0:
        raise ValueError("start_pct and end_pct must satisfy 0 <= start_pct <= end_pct <= 1")
    if max_frames_analyzed is not None and max_frames_analyzed < 1:
        raise ValueError("max_frames_analyzed must be a positive integer")

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
    motion_history = deque()
    incidents = []

    # Gating counters: every discarded frame is logged locally (never escalates).
    motion_discards = 0
    detection_discards = 0
    throttled_frames = 0

    # Gate 3 - per-camera escalation state machine. The key defaults to the
    # video path so one-off uploads never share a lifecycle; clients that
    # send a camera_id get true cross-upload throttling for that camera.
    #
    # When single_upload=True, a fresh tracker key is always used so every
    # upload starts from IDLE regardless of camera_id. Confirmation still
    # follows the natural escalation path: the alert fires only after
    # ESCALATION_CONFIRMING_HITS gated detections (minimum 2, default 3),
    # so a clip with too few gated frames is throttled, not dispatched.
    tracker_key = camera_id or video_path
    if single_upload:
        tracker_key = f"__single__{video_path}"
    tracker = tracker_for(tracker_key)
    alert_triggered = False

    frame_skip = max(int(fps / target_fps), 1)

    logger.info("Processing video for incidents: %s", video_path)

    try:
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
            if frame_index % frame_skip != 0:
                frame_index += 1
                continue

            # Compute motion
            motion_score = 0
            if previous_frame is not None:
                diff = cv2.absdiff(previous_frame, frame)
                gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
                gray = cv2.GaussianBlur(gray, _GAUSSIAN_BLUR_KERNEL, 0)
                _, thresh = cv2.threshold(gray, _THRESHOLD_VALUE, 255, cv2.THRESH_BINARY)
                motion_score = (np.count_nonzero(thresh) / thresh.size) * 100
                motion_history.append(motion_score)
                if len(motion_history) > _HISTORY_SIZE:
                    motion_history.popleft()

            previous_frame = frame.copy()
            if len(motion_history) < _MIN_MOTION_SAMPLES:
                frame_index += 1
                continue

            mean_motion = np.mean(motion_history)
            dynamic_threshold = max(mean_motion * _DYNAMIC_THRESHOLD_FACTOR, _MIN_MOTION_PERCENT)

            if motion_score < dynamic_threshold:
                motion_discards += 1
                logger.debug(
                    "Discarding frame at %.2fs: motion %.2f%% below threshold %.2f%%",
                    timestamp,
                    motion_score,
                    dynamic_threshold,
                )
                frame_index += 1
                continue

            # Gate 2 - YOLO: only frames with an interest class above the
            # confidence threshold pass to the escalation state machine.
            detections = detect_objects(frame)
            if not detections:
                detection_discards += 1
                logger.debug(
                    "Discarding frame at %.2fs: no interest class above %.2f confidence",
                    timestamp,
                    YOLO_CONF_THRESHOLD,
                )
                frame_index += 1
                continue

            # Gate 3 - escalation state machine: track one incident lifecycle
            # per camera instead of re-evaluating from scratch on every frame.
            # Only the SUSPICIOUS -> CONFIRMING transition runs the vision
            # LLM; repeated gated detections while CONFIRMING are what
            # authorize the dispatch, and COOLDOWN blocks flood re-alerts.
            action = tracker.on_gated_detection()
            if action == ALERT_ACTION:
                # Confirming hits reached: the agent/dispatch runs after the
                # scan (it needs the collected evidence). Stop feeding the
                # tracker - the incident is confirmed.
                alert_triggered = True
                logger.info(
                    "Camera %s: incident confirmed at %.2fs - dispatch authorized",
                    tracker_key,
                    timestamp,
                )
                break

            if action == IGNORE:
                throttled_frames += 1
                logger.debug(
                    "Frame at %.2fs throttled by escalation state machine (camera %s, state %s)",
                    timestamp,
                    tracker_key,
                    tracker.state,
                )
                frame_index += 1
                continue

            # action == ANALYZE: the vision LLM runs once per incident
            # lifecycle; this description is the incident evidence.
            try:
                description = analyze_frame(frame, last_description, languages=languages)
            except Exception as exc:
                logger.warning("Vision analysis failed at %.2fs: %s", timestamp, exc)
                frame_index += 1
                continue
            last_description = description

            incidents.append(
                {
                    "timestamp": round(timestamp, 2),
                    "objects": detections,
                    "llm_description": description,
                }
            )

            # In single_upload mode this follow-up detection closes the
            # confirming gap when ESCALATION_CONFIRMING_HITS=2, so a demo
            # clip alerts right after its first vision-LLM analysis; with
            # higher thresholds, later gated frames in the same clip
            # provide the remaining confirming hits.
            if single_upload:
                action2 = tracker.on_gated_detection(now=time.time())
                if action2 == ALERT_ACTION:
                    alert_triggered = True
                    logger.info(
                        "Single upload mode: incident confirmed at %.2fs "
                        "(camera %s) — dispatching now",
                        timestamp,
                        tracker_key,
                    )
                    break
                logger.debug(
                    "Single upload mode: awaiting additional gated frames (camera %s, action=%s)",
                    tracker_key,
                    action2,
                )

            if max_frames_analyzed is not None and len(incidents) >= max_frames_analyzed:
                logger.info("Reached analysis cap of %d frames", max_frames_analyzed)
                break

            if show_frames:
                annotated = draw_detections(frame, detections)
                cv2.imshow("Main Event Frame", annotated)
                cv2.waitKey(50)

            frame_index += 1
    finally:
        cap.release()
        if show_frames:
            cv2.destroyAllWindows()

    logger.info(
        "Gating summary for %s (camera %s): %d frames below motion threshold, "
        "%d frames with no relevant detection, %d frames throttled by the "
        "escalation state machine, %d frames escalated to the LLM, alert=%s",
        video_path,
        tracker_key,
        motion_discards,
        detection_discards,
        throttled_frames,
        len(incidents),
        alert_triggered,
    )

    return {
        "total_frames": total_frames,
        "camera_id": tracker_key,
        "incidents": incidents,
        "alert": alert_triggered,
        "escalation": tracker.snapshot(),
    }


# ------------------------------------------------------------------
if __name__ == "__main__":
    import json

    result = process_video_for_incidents("test/armed robbery in Pakistan.mp4", show_frames=True)
    print(json.dumps(result, indent=2))
