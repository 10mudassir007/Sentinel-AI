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
├── DockerFile
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
| `AUTHORIZED_CNICS` | Comma-separated CNICs allowed to log in (`12345-1234567-1` or 13 digits); empty = nobody can log in | *(empty)* |
| `TRUSTED_PROXY` | Set to `1` when the API runs behind a trusted reverse proxy, so rate limiting keys on the real client IP | `0` |
| `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API (add your Vercel domain in production) | `http://localhost:8080` |
| `MAX_UPLOAD_MB` | Maximum upload size | `200` |
| `MAX_FRAMES_TO_ANALYZE` | Cap on vision-model calls per request (bounds LLM cost) | `30` |
| `DESCRIPTION_LANGUAGES` | Server default language(s) for frame descriptions; each request can override it via the `language` form field | `en,ur` |
| `RATE_LIMIT_PER_MINUTE` | Per-IP request limit (0 disables) | `30` |

---

## 🌐 API

All endpoints require a bearer token except `POST /login` and the `GET /health` probe.

**1. Get a token** — `POST /login` with a valid CNIC (`12345-1234567-1` or 13 plain digits):

```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"cnic": "42101-2345678-9"}'
```

Invalid CNIC formats are rejected with `422`; CNICs not in `AUTHORIZED_CNICS` get `401`.

**2. Call the API** with the returned token:

```bash
curl -X POST http://localhost:8080/analyze-video \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@test/car2.mp4" \
  -F "language=ur"
```

Missing/invalid/expired tokens get `401`. Tokens live `TOKEN_TTL_HOURS` (default 24h) and are stored hashed (sha256) in memory.

Response contains the frame descriptions in the requested language(s) inside `video_analysis.incidents[].llm_description`.

## ▶️ Start the server

```bash
uvicorn main:app --host 0.0.0.0 --port 8080
```

When running from Docker (the default `CMD`) the service is already on port **8080**. For local development without Docker, either use port 8080 (matching the examples below) or the uvicorn default `8000`.

## 🧪 Test Videos

Put your test MP4s in the `test/` folder (example: `test/car2.mp4`).

Ensure correct file paths when calling functions — either run from project root or use absolute paths.

---

## 📜 License

This project is licensed under the **Apache‑2.0 License**.

---

