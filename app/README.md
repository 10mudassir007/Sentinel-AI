# Sentinel AI — Mobile App (Expo)

The **Sentinel‑AI** field app. Built with **Expo SDK 54 (React Native 0.81 + React 19) + TypeScript**, it runs on Android and iOS through **Expo Go** (no native build needed for development). The app talks to the FastAPI backend at the repository root (see the root [README](../README.md) and [ARCHITECTURE.md](../ARCHITECTURE.md)).

## What the app does

| Screen | Role | Purpose |
|---|---|---|
| Language select | — | First-launch English / Urdu picker (Urdu UI renders RTL) |
| Login | — | CNIC login via `POST /login` against the backend; the returned `user_type` decides which home screen opens |
| Home (user) | `user` | Two actions: **Record** (live footage) and **Upload Video** (demo) |
| Record video | `user` | Records the camera in **5-second chunks** and uploads each chunk to `POST /analyze-video` as it is captured (`single_upload=0`, stable `camera_id`, GPS + language from settings) — i.e. it streams footage the way a live camera would |
| Upload video | `user` | Picks a pre-recorded clip from the gallery and analyzes it in one shot (`single_upload=1`) — **demo only** |
| Analysis result | `user` | Aggregated chunk results: incidents detected, agent response, play the generated voice alert (`GET /audio/{file}` via the authenticated client) |
| Home (admin) | `authoritative` | Live incident feed: polls `GET /incidents/latest` (default every 4 s), shows heartbeat alert cards/modal for new incidents, plays voice alerts, marks incidents processed (`POST /incidents/{id}/pass`) |
| Settings | both | Override backend URL at runtime, language, polling interval, camera id, share-location toggle, logout |

- CNICs hashed in `AUTHORIZED_CNICS` log in as **authoritative** (admin feed); a CNIC hashed in `NORMAL_USER_CNIC` logs in as **user**. See the root README → *CNIC Authentication*.
- The bearer token is kept in `expo-secure-store` and attached to every request by the axios client.

**Admin alerts — polling in the demo, push in production.** In the demo the admin home polls `GET /incidents/latest` every *n* seconds (default 4 s, adjustable in Settings) to fetch the latest incidents. A production build would instead receive push notifications via **Firebase Cloud Messaging (FCM)**, so new incidents arrive without polling.

> ⚠️ **Upload Video is a demonstration only.** It sends a pre-recorded clip purely to exercise the detection pipeline. Real deployments are live: the **Record** mode streams continuous 5-second chunks (like a live camera), which is what the backend's per-camera escalation state machine is designed for.

## Run with Expo Go

### Prerequisites

- Node.js 18+ and npm
- The **Expo Go** app on your phone (Android: Play Store · iOS: App Store)
- The backend running on your machine (see root [README](../README.md) → *Option 1 — Backend API*) — the app is useless without it

### Steps

```bash
cd app
npm install
cp .env.example .env
# 1. Edit .env — point the app at your backend:
#    EXPO_PUBLIC_API_URL=http://<LAN-IP-of-your-machine>:8754
npx expo start
```

- **Android:** scan the QR code in the terminal with Expo Go.
- **iOS:** scan the QR code with the Camera app — it opens in Expo Go.
- After changing `.env`, restart with a clean cache: `npx expo start -c`. Only variables prefixed `EXPO_PUBLIC_` reach the app bundle.

A physical phone **cannot use `localhost`** — that address points at the phone itself. Use the LAN IP of the machine running `python main.py` (e.g. `http://192.168.1.10:8754`) and make sure the phone can reach it:

- the phone and the computer are on the same Wi-Fi network;
- Windows Firewall allows inbound connections on the backend port (8754) for Python;
- the backend binds `0.0.0.0` (it does by default).

Not on the same network? Start Expo with a tunnel so the QR code works anywhere: `npx expo start --tunnel` (you still need a reachable backend URL for the API itself).

## Environment variables

Create `.env` in this folder (copy `.env.example`):

| Variable | Purpose | Default when unset |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Backend base URL (no trailing path) used by the axios client | `http://localhost:8754` — fine for the Android emulator (`http://10.0.2.2:8754`), wrong for a physical phone |

The **Settings** screen overrides this value at runtime (persisted per install), so the bundled default only matters on first launch.

## Talking to the backend

The app uses these endpoints (all Bearer-authenticated except `/health`):

| Endpoint | Used for |
|---|---|
| `POST /login` | CNIC → bearer token + `user_type` |
| `POST /analyze-video` | Upload a 5-second chunk (Record) or a single clip (Upload) |
| `GET /incidents/latest` | Admin feed polling |
| `POST /incidents/{id}/pass` | Mark an incident handled |
| `GET /audio/{filename}` | Download the generated voice alert (played from a local cache — the native player cannot send the Bearer token) |
| `GET /health` | Settings/connection checks |

## Troubleshooting

- **`Network request failed` / no connection** — wrong `EXPO_PUBLIC_API_URL` or firewall. Confirm `http://<LAN-IP>:8754/health` opens in the phone's browser.
- **`401` on login** — the CNIC is not among the hashes in `AUTHORIZED_CNICS` (generate a hash with the command in the root README).
- **`422 Video exceeds the maximum allowed duration`** — the backend rejects clips longer than `MAX_VIDEO_SECONDS` (60 s in the dev `.env`); recorded 5-second chunks are always fine.
- **Demo shows errors** — `Upload Video` expects a video file; uploads are capped at `MAX_UPLOAD_MB`.

## Scripts

```bash
npm start          # expo start
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
npm run lint       # eslint
```
