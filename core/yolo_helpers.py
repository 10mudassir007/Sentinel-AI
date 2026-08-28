import threading

import cv2
import numpy as np
from ultralytics import YOLO

INTEREST_CLASSES = {"person", "car", "bus", "truck", "motorcycle", "bicycle"}

# Default confidence threshold for YOLO detections.
_CONF_THRESHOLD = 0.45

_model_lock = threading.Lock()
_model_local = threading.local()


def _get_model() -> YOLO:
    """Return a per-thread YOLO instance, downloading weights on first use.

    Thread-local instances avoid concurrent inference on a shared model, and the
    lock prevents duplicate downloads racing on the very first request.
    """
    model = getattr(_model_local, "model", None)
    if model is None:
        with _model_lock:
            model = getattr(_model_local, "model", None)
            if model is None:
                model = YOLO("yolo26n.pt")
                _model_local.model = model
    return model


def detect_objects(frame: np.ndarray, conf_threshold: float = _CONF_THRESHOLD):
    model = _get_model()
    results = model(frame, verbose=False)[0]
    detections = []

    for box in results.boxes:
        cls_id = int(box.cls[0])
        label = model.names[cls_id]
        conf = float(box.conf[0])

        if conf < conf_threshold or label not in INTEREST_CLASSES:
            continue

        x1, y1, x2, y2 = map(int, box.xyxy[0])
        detections.append({
            "label": label,
            "confidence": round(conf, 2),
            "bbox": [x1, y1, x2, y2]
        })
    return detections

def draw_detections(frame: np.ndarray, detections: list) -> np.ndarray:
    annotated = frame.copy()
    for obj in detections:
        x1, y1, x2, y2 = obj["bbox"]
        label = f'{obj["label"]} ({obj["confidence"]})'
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(annotated, label, (x1, y1 - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    return annotated
