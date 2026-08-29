# Sentinel-AI

Sentinel‑AI is a scalable Python project for automated incident detection in video. It combines motion analysis, object detection, and large language model (LLM) summarization to identify meaningful events in surveillance footage and describe them in natural language.

This project is ideal for applications like:
- Autonomous surveillance analytics
- Smart monitoring systems
- Video summarization pipelines
- Safety and security automation

---

## 🚀 Features

- 🧍 **Motion‑aware processing:** Skips irrelevant frames using adaptive motion scoring.
- 🎯 **Object detection:** Identifies scene objects at points of interest.
- 🧠 **LLM annotation:** Uses LLMs to generate human‑readable descriptions of incidents.
- 🧪 **Configurable evaluation range:** Process subranges of video using start/end percentages.
- 📊 **Structured output:** Returns timestamps, object lists, and text descriptions.

---

## 📁 Repository Structure

```

Sentinel-AI/
├── api/
├───── routes.py
├── core/
├───── agent.py
├───── config.py
├───── llm.py
├───── security.py
├───── tools.py
├───── yolo_helpers.py
├── services/
├───── process_video.py
├───── video_service.py
├── test/ # Contains Test Videos
├── .dockerignore
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── main.py
├── requirements.txt
└── README.md

````

---

## 🛠️ Getting Started

### 🧾 Requirements

- Python 3.11+
- OpenCV (`opencv-python`)
- NumPy
- Yolo
- LangChain


Install dependencies:

```bash
pip install -r requirements.txt
````

---

## 🧠 Configure LLM

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set your LLM keys:

```
GROQ_API_KEY=your_groq_api_key
```

### 🔒 Optional security settings

| Variable | Purpose | Default |
|---|---|---|
| `TOKEN_TTL_HOURS` | Lifetime of bearer tokens issued by `POST /login` (CNIC-based auth) | `24` |
| `PORT` | Port served by `python main.py` and the Docker container | `8754` |
| `AUTHORIZED_CNICS` | Semicolon-separated **Argon2id hashes** of CNICs allowed to log in (never plaintext); generate with `python tools/hash_cnic.py <cnic>`; empty = nobody can log in | *(empty)* |
| `TRUSTED_PROXY` | Set to `1` when the API runs behind a trusted reverse proxy, so rate limiting keys on the real client IP | `0` |
| `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API (add your Vercel domain in production) | `http://localhost:8754` |
| `MAX_UPLOAD_MB` | Maximum upload size | `200` |
| `MAX_FRAMES_TO_ANALYZE` | Cap on vision-model calls per request (bounds LLM cost) | `30` |
| `YOLO_MODEL_PATH` | Weights file for the stock YOLO model (base COCO; no custom training used) | `yolo26n.pt` |
| `YOLO_CONF_THRESHOLD` | Minimum detection confidence for a class to pass the gate | `0.45` |
| `YOLO_INTEREST_CLASSES` | Comma-separated base-COCO class names that justify escalating a frame to the LLM (person, vehicles, knife) | `person,bicycle,car,motorcycle,bus,truck,knife` |
| `DESCRIPTION_LANGUAGES` | Server default language(s) for frame descriptions; each request can override it via the `language` form field | `en,ur` |
| `RATE_LIMIT_PER_MINUTE` | Per-IP request limit (0 disables) | `30` |
| `AMI_HOST` / `AMI_PORT` / `AMI_USERNAME` / `AMI_SECRET` | Asterisk Manager Interface credentials for placing emergency calls over the SIP trunk | `127.0.0.1:5038` / `sentinel_api` / *(empty)* |
| `ELEVENLABS_API_KEY` | Voice message synthesis for dispatch calls (edge-tts used when empty) | *(empty)* |
| `ASTERISK_SOUNDS_DIR` | Directory the API writes `alert-*.wav` into for Asterisk to play | `/var/lib/asterisk/sounds/sentinel/` |
| `AUDIO_OUTPUT_DIR` | Directory served by `GET /audio/{file}` | `generated_audio` |
| `REVERSE_GEOCODE_URL` | Reverse-geocoding endpoint that turns client coordinates into a readable location (Nominatim by default; free, no key) | `https://nominatim.openstreetmap.org/reverse` |

---

## 🔬 Detection gating (motion → YOLO → LLM)

The vision LLM is only ever called after two cheap gates pass; everything else is discarded and logged locally, never escalated:

```
motion detected → YOLO runs on that frame → interest class ≥ YOLO_CONF_THRESHOLD → vision LLM → agent
                               ↓ else
                    discard + log (debug per frame, info summary per video)
```

- **Gate 1 — motion:** adaptive threshold (mean × 0.8, minimum 0.15% of pixels) over a 15-frame history.
- **Gate 2 — YOLO confidence + class:** `YOLO_CONF_THRESHOLD` and `YOLO_INTEREST_CLASSES` filter detections before any LLM call.
- **Local logs:** each discarded frame is logged at debug level with its timestamp and reason; an info-level summary per video reports motion-discards, detection-discards, and escalated frames.

All gating runs on the **stock COCO model** — no custom training. The default class list uses COCO's relevant labels: `person` (falls, fights, robberies), vehicles (crashes), and `knife` (COCO's weapon class). Fire and falls have no COCO label; those scenes almost always also contain people or vehicles, which the base model catches and escalates. A scene with *only* fire and nothing else cannot be gated by the base model — that is an inherent limit of COCO, not a configuration issue.

---

## 🌐 API

All endpoints require a bearer token except `POST /login` and the `GET /health` probe.

**1. Get a token** — `POST /login` with a valid CNIC (`12345-1234567-1` or 13 plain digits):

```bash
curl -X POST http://localhost:8754/login \
  -H "Content-Type: application/json" \
  -d '{"cnic": "42101-2345678-9"}'
```

Invalid CNIC formats are rejected with `422`; CNICs that do not match a stored Argon2id hash get `401`.

**Generating a CNIC hash** — CNICs must never be stored in plaintext. Run:

```bash
python tools/hash_cnic.py 42101-2345678-9
```

and paste the printed `$argon2id$...` value into `AUTHORIZED_CNICS` (semicolon-separate multiple hashes). The hash is one-way: login verifies by re-hashing the submitted CNIC, so the original CNIC can never be recovered from `.env`.

**2. Call the API** with the returned token:

```bash
curl -X POST http://localhost:8754/analyze-video \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@test/car2.mp4" \
  -F "language=ur" \
  -F "latitude=31.5204" \
  -F "longitude=74.3587"
```

Missing/invalid/expired tokens get `401`. Tokens live `TOKEN_TTL_HOURS` (default 24h) and are stored hashed (sha256) in memory.

Response contains the frame descriptions in the requested language(s) inside `video_analysis.incidents[].llm_description`, plus a `location` object when coordinates were sent: the exact `latitude`/`longitude` you provided and the reverse-geocoded `display_name` / `label` (e.g. `"Gulberg III, Lahore"`) resolved via the external geocoder. The agent uses that location in its answer, and the tools embed it in the voice message ("This incident has occurred at …"). If geocoding fails, the response degrades to raw coordinates with a `geocode_error` field instead of failing the analysis.

**3. Dispatch results** — when the agent decides to notify an authority, the response includes a `dispatch` array (one entry per tool call), e.g.:

```json
{
  "service": "ambulance",
  "destination": "1122",
  "transport": "Asterisk AMI over SIP trunk",
  "status": "placed",
  "location": "Gulberg III, Lahore",
  "audio": { "name": "alert-ab12cd34-1720000000.wav", "url": "/audio/alert-ab12cd34-1720000000.wav" }
}
```

If the SIP call could not be placed, `status` is `"failed"` with an `error` field, and the generated audio URL is still returned so the caller can act on the alert. `GET /audio/{file}` (bearer token required) downloads the voice message.

Tool failures are **never shown to the LLM or the end user**: tools return a neutral confirmation to the agent (so its answer stays clean and never mentions failures), while the real outcome is recorded in the `dispatch` array above.

## ☎️ Emergency dispatch over the SIP trunk

The `call_ambulance` (1122), `call_police` (15) and `call_firebrigade` (16) tools place **real calls via SIP trunking**: they originate a call through the Asterisk Manager Interface on channel `PJSIP/<number>@sentinel-trunk` (context `sentinel-outbound`, exten `alert`) and pass the generated voice message via the `ALERT_FILE` channel variable.

Required Asterisk dialplan (adjust to your trunk):

```
[sentinel-outbound]
exten => alert,1,Wait(1)
 same => n,Playback(${ALERT_FILE})
 same => n,Hangup()
```

The voice message is generated from the LLM's incident description and the resolved location ("This incident has occurred at {location}"):
- **ElevenLabs** when `ELEVENLABS_API_KEY` is set (raw PCM request — no conversion needed);
- otherwise **edge-tts** (fast, no key, native Urdu voice `ur-PK-UzmaNeural`), converted to WAV via ffmpeg (included in the Docker image).

The API writes the WAV into both `ASTERISK_SOUNDS_DIR` (for Asterisk playback) and `AUDIO_OUTPUT_DIR` (for `GET /audio`). The spoken alert prefers the Urdu description when the analysis included one.

> ⚠ Calls are placed automatically the moment the agent decides to. A human-in-loop approval gate is strongly recommended before live deployment.

## ▶️ Run the server

Two equivalent ways to run the API, both serving port **8754** (`GET http://localhost:8754/health` returns `{"status": "ok"}`):

**Option A — Docker (recommended):**

```bash
cp .env.example .env   # first time only, then fill it in
docker compose up --build
```

The image uses `python:3.11-slim`, pre-downloads the YOLO weights at build time, and runs the exact same command as the manual mode (`python main.py`). Your `.env` is mounted read-only into the container — the API reads it itself, exactly like manual mode — so Argon2 hashes (`$argon2id$...`) pass through untouched (a compose `env_file` would mangle them). Generated alert audio is kept in a named Docker volume so it survives container rebuilds. Docker may print harmless `$`-interpolation warnings if your `.env` contains hashes; they do not affect the container.

**Option B — Python directly:**

```bash
pip install -r requirements.txt
python main.py
```

The server binds `0.0.0.0` and reads the port from the `PORT` environment variable (default `8754`):

```bash
PORT=9000 python main.py
```

If you change `PORT`, also update the `ports:` mapping in `docker-compose.yml` for the Docker mode.

## 🧪 Test Videos

Put your test MP4s in the `test/` folder (example: `test/car2.mp4`).

Ensure correct file paths when calling functions — either run from project root or use absolute paths.

---

## 📜 License

This project is licensed under the **Apache‑2.0 License**.

---

