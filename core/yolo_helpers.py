from ultralytics import YOLO
import numpy as np
import cv2

yolo_model = YOLO("yolo26n.pt")
INTEREST_CLASSES = {"person", "car", "bus", "truck", "motorcycle", "bicycle"}

def detect_objects(frame: np.ndarray, conf_threshold: float = 0.45):
    results = yolo_model(frame, verbose=False)[0]
    detections = []

    for box in results.boxes:
        cls_id = int(box.cls[0])
        label = yolo_model.names[cls_id]
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