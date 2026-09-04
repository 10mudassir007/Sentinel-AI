# Sentinel-AI

**Sentinel-AI** is an automated video incident-detection platform. It watches (live) video, finds moments worth escalating — motion → YOLO object detection → LLM analysis — and can **place real emergency calls** (ambulance / police / fire brigade) over a SIP trunk when a verified incident is found, all described in natural language (English and/or Urdu).

The repository contains **three deployable parts** that talk to each other:

| Part | Location | Stack | How to run |
|---|---|---|---|
| 🖥️ **Backend API** (this folder) | `main.py`, `api/`, `core/`, `services/` | Python 3.12 · FastAPI · OpenCV · YOLO · LangChain | Docker or `python main.py` |
| 🌐 **Website** | `website/` | React 18 · Vite · TypeScript · Tailwind · shadcn/ui | `npm run dev` → `:5173` (Vercel for prod) |
| 📱 **Mobile app** | `app/` | Expo (React Native) · TypeScript | Expo Go / `npx expo start` |

---

## 🖼 Architecture

The **website** and the **mobile app** are two separate clients that both point at the **same backend API** (`POST /analyze-video` + `/login`, `/incidents/*`, `/audio/*`). The API runs the whole detection pipeline: video ingestion → motion gate → YOLO gate → per-camera escalation state machine → vision-LLM description → verification agent → optional emergency dispatch.

- 📄 Full text diagram and component breakdown: [ARCHITECTURE.md](ARCHITECTURE.md)

---

## ⚡ Features

- 🧍 **Motion-aware processing** — irrelevant/static frames are skipped with an adaptive motion score before any expensive model runs.
- 🎯 **YOLO detection gate** — only frames containing an interest class (person, vehicles, knife) above a confidence threshold reach the LLM (stock COCO weights, no custom training).
- 🧠 **Per-camera escalation state machine** — `IDLE → SUSPICIOUS → CONFIRMING → ALERT → COOLDOWN`; the vision LLM runs only once per lifecycle and repeated confirmations are required before anything is dispatched, so a single camera can never flood the dispatcher.
- 🗣️ **LLM incident descriptions** — human-readable summaries of what happened, in English and/or Urdu (`language` field).
- ☎️ **Emergency dispatch** — on a confirmed incident the agent calls `call_ambulance` (1122), `call_police` (15) or `call_firebrigade` (16) over **Asterisk AMI / SIP trunk** with a generated voice message.
- 📍 **Location-aware** — optional GPS coordinates are reverse-geocoded into a readable place ("Gulberg III, Lahore") used in the analysis and the spoken alert.
- 🔐 **CNIC authentication** — log in with a Pakistani CNIC; CNICs are stored only as **Argon2id hashes**. Two roles: `user` (record/report) and `authoritative` (admin incident feed).
- 📋 **Incident log** — every detected incident is persisted and can be listed / marked handled via the API, the app's admin feed, or `curl`.
- ⏱️ **Per-source queue** — clips from the same `camera_id` (or client IP) are processed serially.
- 📊 **Structured output** — timestamps, object lists, descriptions, dispatch results.

---

## 📁 Repository Structure

```
Sentinel-AI/
├── api/                      # FastAPI routes (login, analyze-video, incidents, audio)
│   └── routes.py
├── app/                      # 📱 Mobile app — Expo / React Native (Expo Go)
│   ├── src/
│   │   ├── api/              #   axios client + endpoints (login, analyze, incidents, audio)
│   │   ├── components/       #   screens (Login, RecordVideo, UploadVideo, AdminHome, …)
│   │   ├── context/          #   auth + i18n (English/Urdu, RTL)
│   │   ├── navigation/       #   role-based navigators (user vs authoritative)
│   │   ├── store/            #   persisted settings (backend URL, camera id, polling, …)
│   │   ├── theme/  types/  translations.ts
│   │   └── App.tsx
│   └── package.json
├── core/                     # Shared intelligence
│   ├── agent.py              #   LangChain verification agent (tools: 1122 / 15 / 16)
│   ├── config.py             #   dotenv config + SYSTEM_PROMPT
│   ├── escalation.py         #   per-camera escalation state machine
│   ├── llm.py                #   Gemini 3.5 Flash Lite (primary) / Groq fallback
│   ├── security.py           #   Argon2id CNICs, sessions, rate-limit & size middleware
│   ├── tools.py              #   emergency-dispatch tools (Asterisk AMI + TTS)
│   └── yolo_helpers.py       #   YOLO detection wrapper
├── services/                 # Orchestration
│   ├── geocode.py            #   reverse geocoding (Nominatim by default)
│   ├── incident_store.py     #   incidents.json persistence
│   ├── process_video.py      #   frame loop: motion → YOLO → escalation → vision LLM
│   └── video_service.py      #   analyze_video(): pipeline + agent orchestration
├── website/                  # 🌐 Website — React + Vite + shadcn/ui (Vercel)
│   └── src/pages/            #   landing, how-it-works, demo, dashboard, tech-stack …
├── generated_audio/          # Voice alerts served by GET /audio/{file}
├── yolo11m.pt                # Stock COCO YOLO weights (no custom training)
├── ARCHITECTURE.md           # Architecture diagram (Mermaid + plain-text breakdown)
├── .env.example              # Backend environment template
├── DockerFile                # python:3.12-slim image
├── docker-compose.yml        # docker compose up --build  (:8754)
├── main.py                   # FastAPI app — the backend entry point
├── requirements.txt
└── README.md
```

---

## 🚀 Run it — API, Website or App

> ⚠️ **Demo uploads vs live video** — the website `/demo` page and the mobile app's **Upload Video** screen send a *pre-recorded clip* to `POST /analyze-video`. That exists **only to demonstrate** the detection pipeline. Sentinel-AI is designed for **live video**: the mobile app's **Record** mode already streams real footage in continuous 5-second chunks, and fixed cameras would feed the same pipeline from live streams. Treat the upload flows as a demo/test harness, not as the production ingestion path.

### Option 1 — Backend API

**Prerequisites:** Python 3.12+, Docker (recommended) or a local Python environment.

```bash
# 1. Configure environment (keys, CNIC hashes, limits — see table below)
cp .env.example .env
#    edit .env: set GROQ_API_KEY (required) and GOOGLE_API_KEY (recommended),
#    and put at least one Argon2id CNIC hash in AUTHORIZED_CNICS

# 2. Run — Docker (recommended):
docker compose up --build

#    …or Python directly:
pip install -r requirements.txt
python main.py
```

The API serves **http://localhost:8754** — `GET /health` returns `{"status": "ok"}`.

Verify with a CNIC login and an analysis (substitute your own clip — must be MP4/AVI/MOV and ≤ `MAX_VIDEO_SECONDS`):

```bash
TOKEN=$(curl -s -X POST http://localhost:8754/login \
  -H "Content-Type: application/json" \
  -d '{"cnic": "42101-2345678-9"}' | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

curl -X POST http://localhost:8754/analyze-video \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@path/to/clip.mp4" \
  -F "language=en,ur" \
  -F "latitude=31.5204" \
  -F "longitude=74.3587"
```

> 💡 The demo CNIC above only works when its **Argon2id hash** is present in `AUTHORIZED_CNICS` (see [CNIC auth](#cnic-authentication-argon2id)).

Full endpoint reference → [API section](#api) below.

### Option 2 — Website

```bash
cd website
npm install
cp .env.example .env      # set VITE_API_URL (backend) + VITE_DEMO_CNIC
npm run dev               # → http://localhost:5173
```

- Browse the marketing pages, then open **`/demo`** to upload a clip and watch the real pipeline run against your local backend (auto-login, live response, voice alert playback). If the API is offline the demo falls back to a sample response.
- `VITE_DEMO_CNIC` must be a CNIC authorized on the backend (dev default: `42101-2345678-9`).
- The Vite dev origin (`http://localhost:5173`) is already in the backend's `CORS_ORIGINS`.
- Production build is deployed to **Vercel** (SPA rewrites in `vercel.json`).

Full guide → [website/README.md](website/README.md)

### Option 3 — Mobile app (Expo Go)

```bash
cd app
npm install
cp .env.example .env      # set EXPO_PUBLIC_API_URL to http://<your-LAN-IP>:8754
npx expo start            # scan the QR code with Expo Go (Android) or the Camera app (iOS)
```

- Install **Expo Go** from the Play Store / App Store; your phone and the machine running the backend must be on the same network.
- The default in-app Settings screen lets you point the app at any backend URL at runtime.
- Log in with your CNIC: an `authoritative` CNIC opens the **admin incident feed** (live polling, alert popups, voice-alert playback, mark-handled), a `user` CNIC opens **Record / Upload**.
- **Record** captures live footage in 5-second chunks and streams each chunk to the API (GPS + camera ID attached) — this is the app behaving like a live camera. **Upload Video** is demo-only.

Full guide → [app/README.md](app/README.md)

> 💡 **Demo settings disclaimer** — the mobile app's Settings screen exposes backend URL,
> camera ID, polling interval, and other options so you can experiment with different
> configurations during development. In a production deployment these settings would be
> removed from the UI (fixed at build time or provisioned remotely) or automated
> entirely — the app configures itself rather than asking the user.

> 🔍 **Production logging** — in development the API uses Python's built-in `logging` module
> with stdout output. For a production deployment, integrate **Pydantic Logfire** (structured
> observability for the FastAPI pipeline, LLM calls, and YOLO gates) and **LangSmith** (tracing
> and evaluation of LangChain agent runs and tool calls) to monitor, debug, and audit the full
> detection-to-dispatch flow.

> 📍 **Responder GPS navigation** — the current app sends optional GPS coordinates with every
> upload, and the API reverse-geocodes them into a readable place used in the analysis and
> voice alert. In a production deployment, a full in-app navigation feature would be added so
> responders can see the exact incident location on a map and get turn-by-turn directions
> directly in the app, using the reported coordinates as the destination.

---

## ⚙️ Backend Configuration (`.env`)

Copy `.env.example` to `.env` and edit. Values shown below match the current development `.env`; adjust for production.

```bash
# LLM providers — GROQ_API_KEY is required (the app refuses to start without it).
# When GOOGLE_API_KEY is set, Gemini 3.5 Flash Lite is used as the primary model
# with Groq as an automatic fallback; when it is empty, Groq is used directly.
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_google_api_key

# A CNIC permitted to log in as an "authoritative" (admin) user, as an
# Argon2id hash — see "CNIC Authentication" below.
AUTHORIZED_CNICS='$argon2id$…'
```

| Variable | Purpose | Dev default (current `.env`) |
|---|---|---|
| `GROQ_API_KEY` | **Required.** Groq provider key (used directly when no Google key, fallback otherwise) | `gsk_…` |
| `GOOGLE_API_KEY` | Gemini provider key — makes Gemini 3.5 Flash Lite the primary model | `AIza…` |
| `PORT` | Port served by `python main.py` / the Docker container | `8754` |
| `TOKEN_TTL_HOURS` | Lifetime of bearer tokens issued by `POST /login` | `24` |
| `AUTHORIZED_CNICS` | Semicolon-separated **Argon2id hashes** of CNICs that log in as `authoritative`; empty = nobody can log in | `$argon2id$…` (demo CNIC `42101-2345678-9`) |
| `NORMAL_USER_CNIC` | Optional Argon2id hash of the "normal user" CNIC → logs in as `user` instead of `authoritative` | *(empty)* |
| `TRUSTED_PROXY` | `1` when the API runs behind a trusted reverse proxy (rate limiting + queue key on the real client IP) | `0` |
| `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API (add your Vercel domain in production) | `http://localhost:8754,http://localhost:5173,http://127.0.0.1:8754` |
| `MAX_UPLOAD_MB` | Maximum upload size | `200` |
| `MAX_VIDEO_SECONDS` | Max clip duration — longer uploads are rejected (422) before any analysis work | `60` |
| `MAX_FRAMES_TO_ANALYZE` | Cap on vision-model calls per request (bounds LLM cost) | `30` |
| `YOLO_MODEL_PATH` | Weights file for the stock YOLO model (base COCO; no custom training) | `yolo11m.pt` |
| `YOLO_CONF_THRESHOLD` | Minimum detection confidence for a class to pass the gate | `0.25` |
| `YOLO_INTEREST_CLASSES` | Comma-separated base-COCO classes that justify escalating a frame to the LLM | `person,bicycle,car,motorcycle,bus,truck,knife` |
| `ESCALATION_WINDOW_S` | Seconds SUSPICIOUS/CONFIRMING may idle before decaying back to IDLE | `120` |
| `ESCALATION_CONFIRMING_HITS` | Gated detections required while CONFIRMING to reach ALERT (min 2) | `2` |
| `ESCALATION_ALERT_TIMEOUT_S` | Seconds ALERT persists before decaying back to IDLE | `1000` |
| `ESCALATION_COOLDOWN_S` | Seconds after a dispatch attempt before the same camera may alert again (`0` disables) | `0` |
| `DESCRIPTION_LANGUAGES` | Server default languages for frame descriptions when no `language` field is sent | `en,ur` |
| `RATE_LIMIT_PER_MINUTE` | Per-IP request limit per minute (`0` disables) | `0` |
| `AMI_HOST` / `AMI_PORT` / `AMI_USERNAME` / `AMI_SECRET` | Asterisk Manager Interface credentials for placing emergency calls over the SIP trunk | `127.0.0.1` / `5038` / `sentinel_api` / *(set yours)* |
| `ELEVENLABS_API_KEY` | Voice synthesis for dispatch calls (edge-tts used when empty) | *(set yours)* |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice used for alert messages | `21m00Tcm4TlvDq8ikWAM` |
| `ASTERISK_SOUNDS_DIR` | Directory the API writes `alert-*.wav` into for Asterisk playback | `/var/lib/asterisk/sounds/sentinel/` |
| `AUDIO_OUTPUT_DIR` | Directory served by `GET /audio/{file}` | `generated_audio` |
| `INCIDENTS_FILE` | JSON file storing analyzed incidents (created on first write) | `incidents.json` (Docker: `/app/data/incidents.json`) |
| `REVERSE_GEOCODE_URL` | Reverse-geocoding endpoint turning client coordinates into a readable location (Nominatim — free, no key) | `https://nominatim.openstreetmap.org/reverse` |

> 🔒 Never commit real keys or hashes tied to a live CNIC. `.env` is git-ignored; `.env.example` holds placeholders only.

### 🔐 CNIC Authentication (Argon2id)

CNICs are **never stored in plaintext**. Add the hash of a CNIC to `AUTHORIZED_CNICS` (authoritative/admin) or `NORMAL_USER_CNIC` (regular user):

```bash
python -c "from core.security import hash_cnic; print(hash_cnic('42101-2345678-9'))"
```

Paste the printed `$argon2id$…` value into `.env` (semicolon-separate multiple hashes). Login re-hashes the submitted CNIC and verifies it — the original CNIC can never be recovered from `.env`. CNICs in `AUTHORIZED_CNICS` return `user_type: "authoritative"`; the optional `NORMAL_USER_CNIC` hash returns `user_type: "user"`.

> 💡 In development, CNIC hashes are stored in `.env` for simplicity. In a production
> deployment, `AUTHORIZED_CNICS` would be replaced with a database-backed user store
> (e.g. PostgreSQL) — CNICs are registered through a secure admin interface, hashed with
> Argon2id on write, and looked up on login just like the env-based flow.


---

## 🔬 Detection Pipeline (motion → YOLO → LLM → agent)

The vision LLM is only ever called after two cheap gates pass; everything else is discarded and logged locally, never escalated:

```
motion detected → YOLO runs on that frame → interest class ≥ YOLO_CONF_THRESHOLD
                → per-camera escalation state machine
                    IDLE → SUSPICIOUS → CONFIRMING (vision LLM once) → ALERT → COOLDOWN
                → agent (only on ALERT) → dispatch tools (1122 / 15 / 16)
```

- **Gate 1 — motion:** adaptive threshold over a 15-frame history; static footage never reaches YOLO.
- **Gate 2 — YOLO:** `YOLO_CONF_THRESHOLD` + `YOLO_INTEREST_CLASSES` filter detections before any LLM call (stock COCO model, no custom training).
- **State machine:** the SUSPICIOUS → CONFIRMING transition is the *only* point the vision LLM runs (capped by `MAX_FRAMES_TO_ANALYZE`); reaching ALERT requires `ESCALATION_CONFIRMING_HITS` gated detections; COOLDOWN throttles re-alerts per camera so a single camera can never flood the dispatcher.
- **Agent:** on ALERT the LangChain agent verifies the incident and must call at least one tool. Tool failures never surface to the LLM or end user — the real outcome is recorded in the API's `dispatch[]` array.

The default class list uses COCO's relevant labels: `person` (falls/fights/robberies), vehicles (crashes), `knife` (COCO's weapon class). Fire and falls have no COCO label, so scenes containing *only* fire cannot be gated by the base model — an inherent limit of stock COCO, not a configuration issue.

---

## 🌐 API

All endpoints require a bearer token except `POST /login` and `GET /health`.

**1. Get a token** — `POST /login` with a valid CNIC (`12345-1234567-1` or 13 plain digits):

```bash
curl -X POST http://localhost:8754/login \
  -H "Content-Type: application/json" \
  -d '{"cnic": "42101-2345678-9"}'
```

Invalid formats → `422`; CNICs not matching a stored Argon2id hash → `401`. Tokens live `TOKEN_TTL_HOURS` (24h) and are stored hashed (sha256) in memory.

**2. Analyze a video** — `POST /analyze-video` (multipart, Bearer token):

```bash
curl -X POST http://localhost:8754/analyze-video \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@path/to/clip.mp4" \
  -F "language=ur" \
  -F "latitude=31.5204" \
  -F "longitude=74.3587"
```

| Form field | Required | Meaning |
|---|---|---|
| `file` | ✅ | MP4 / AVI / MOV, ≤ `MAX_UPLOAD_MB`, ≤ `MAX_VIDEO_SECONDS` (magic bytes are checked, not just the extension) |
| `language` | — | `en`, `ur` or `en,ur` — drives the descriptions **and** the spoken alert (default: `DESCRIPTION_LANGUAGES`) |
| `latitude` / `longitude` | — | GPS of the incident; reverse-geocoded into a readable place used by the agent and the voice message (both-or-neither) |
| `camera_id` | — | Stable per-camera id → cross-upload escalation state + per-source queue (fallback: client IP) |
| `single_upload` | — | `1` = one-off demo clip (fresh tracker; the alert still needs `ESCALATION_CONFIRMING_HITS` gated detections to confirm); `0` = chunked/live feeding |

The response contains frame descriptions inside `video_analysis.incidents[].llm_description`, a `location` object (exact coordinates + reverse-geocoded `display_name` / `label`), the `agent_response`, and — when dispatch fired — a `dispatch[]` array plus `audio_file`. If geocoding fails, the response degrades to raw coordinates with a `geocode_error` field instead of failing. When no incident is detected, `dispatch`/`audio_file` are omitted entirely so the client can distinguish "no incident" from "incident but dispatch failed".

**3. Dispatch results** — example entry when the agent notifies an authority:

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

If the SIP call could not be placed, `status` is `"failed"` with an `error` field, and the generated audio URL is still returned so the caller can act on the alert. `GET /audio/{filename}` (Bearer token required) downloads the voice message.

**4. Incident log** — every `/analyze-video` response that detected incidents appends a compact record to `INCIDENTS_FILE` (`{id, created_at, status, display_name, llm_desc, agent_answer, audio_file}`; status starts as `"new"`).

> 🔐 The `/incidents/latest` and `/incidents/{id}/pass` endpoints require a token from an **authoritative** CNIC — `user`-role tokens get `403`.

List incidents still waiting for attention (newest first):

```bash
curl http://localhost:8754/incidents/latest \
  -H "Authorization: Bearer <access_token>"
```

Mark an incident as handled (status `new` → `false`, after which it no longer appears in `/incidents/latest`; no body needed):

```bash
curl -X POST http://localhost:8754/incidents/<id>/pass \
  -H "Authorization: Bearer <access_token>"
```

Unknown ids → `404`.

---

## ☎️ Emergency Dispatch over the SIP Trunk

The `call_ambulance` (1122), `call_police` (15) and `call_firebrigade` (16) tools place **real calls via SIP trunking**: they originate a call through the Asterisk Manager Interface on channel `PJSIP/<number>@sentinel-trunk` (context `sentinel-outbound`, exten `alert`) and pass the generated voice message via the `ALERT_FILE` channel variable.

Required Asterisk dialplan (adjust to your trunk):

```
[sentinel-outbound]
exten => alert,1,Wait(1)
 same => n,Playback(${ALERT_FILE})
 same => n,Hangup()
```

The voice message is generated from the LLM's incident description and the resolved location ("This incident has occurred at …"):
- **ElevenLabs** when `ELEVENLABS_API_KEY` is set (raw PCM — no conversion needed);
- otherwise **edge-tts** (fast, no key, native Urdu voice `ur-PK-UzmaNeural`), converted to WAV via ffmpeg (included in the Docker image).

The API writes the WAV into both `ASTERISK_SOUNDS_DIR` (for Asterisk playback) and `AUDIO_OUTPUT_DIR` (for `GET /audio`). The spoken alert follows the requested `language`: Urdu when `ur` is among them (and an Urdu description is available), English otherwise.

---

## 🧪 Trying the pipeline

1. Start the backend (Option 1 above).
2. Log in with an authorized CNIC and call `/analyze-video` with any short MP4 clip (e.g. a street/car/person scene) — see the API section for `curl` examples.
3. Use the website `/demo` page (Option 2) or the mobile app (Option 3) for the same pipeline through a UI.
4. Detected incidents appear in `GET /incidents/latest`; in the mobile app, log in with an `authoritative` CNIC to watch the admin feed live.

---

## 📜 License

This project is licensed under the **Apache-2.0 License**. See [LICENSE](LICENSE).
