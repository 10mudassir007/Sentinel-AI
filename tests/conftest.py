"""Shared fixtures for Sentinel-AI tests."""

import os

# Set env vars at module level BEFORE any app modules are imported.
# conftest.py is loaded before test files, so these are visible when
# core.config calls load_dotenv() (which won't override already-set vars).
_TEST_ENV = {
    "GROQ_API_KEY": "test-key",
    "GOOGLE_API_KEY": "",
    "PORT": "8754",
    "TOKEN_TTL_HOURS": "1",
    "AUTHORIZED_CNICS": "",
    "NORMAL_USER_CNIC": "",
    "TRUSTED_PROXY": "0",
    "CORS_ORIGINS": "http://localhost:5173",
    "MAX_UPLOAD_MB": "10",
    "MAX_VIDEO_SECONDS": "15",
    "MAX_FRAMES_TO_ANALYZE": "5",
    "YOLO_MODEL_PATH": "yolo11m.pt",
    "YOLO_CONF_THRESHOLD": "0.25",
    "YOLO_INTEREST_CLASSES": "person,bicycle,car,motorcycle,bus,truck,knife",
    "ESCALATION_WINDOW_S": "60",
    "ESCALATION_CONFIRMING_HITS": "3",
    "ESCALATION_ALERT_TIMEOUT_S": "30",
    "ESCALATION_COOLDOWN_S": "300",
    "DESCRIPTION_LANGUAGES": "en,ur",
    "RATE_LIMIT_PER_MINUTE": "0",
    "AMI_HOST": "127.0.0.1",
    "AMI_PORT": "5038",
    "AMI_USERNAME": "test_user",
    "AMI_SECRET": "",
    "ASTERISK_SOUNDS_DIR": "/tmp/sentinel_test_audio",
    "AUDIO_OUTPUT_DIR": "generated_audio",
    "INCIDENTS_FILE": "incidents_test.json",
    "REVERSE_GEOCODE_URL": "https://nominatim.openstreetmap.org/reverse",
}

for _k, _v in _TEST_ENV.items():
    os.environ[_k] = _v
