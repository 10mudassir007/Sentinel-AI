# Sentinel AI — Website

Marketing site and live demo for **Sentinel‑AI**, the automated video incident‑detection platform. This is one of two clients of the platform (the other is the [mobile app](../app/README.md)); both talk to the FastAPI backend in the repository root — see the root [README](../README.md) and [ARCHITECTURE.md](../ARCHITECTURE.md).

Built with **Vite 5 + React 18 + TypeScript + Tailwind CSS 3 + shadcn/ui**, deployed on **Vercel**.

## Pages

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | Landing page with hero + demo CTA |
| `/how-it-works` | How It Works | Full flow: CNIC login → detection pipeline → authority dispatch |
| `/use-cases` | Use Cases | Application scenarios |
| `/demo` | Demo | **Exercise the real backend pipeline** with an uploaded clip |
| `/detection-capabilities` | Detection Capabilities | Incident taxonomy + model notes (stock YOLO11m COCO, not custom‑trained) |
| `/dashboard` | Dashboard | Sample incident analytics (demo data, recharts) |
| `/tech-stack` | Tech Stack | Technologies used across the platform |
| `/privacy-policy` | Privacy Policy | Data handling terms |
| `*` | 404 | Not found |

## Demo page (`/demo`)

The demo talks to the real Sentinel‑AI API (FastAPI, default `http://localhost:8754`):

- `POST /analyze-video` — multipart upload of a pre-recorded clip (`language=en`, fixed demo coordinates, `camera_id=web-demo`, `single_upload=1`)
- `GET /audio/{filename}` — plays the generated voice alert (bearer auth)
- API unreachable or request rejected → the page falls back to a realistic sample response (clearly labelled `SAMPLE_DATA`)

> ⚠️ **Demo-only uploads.** The `/demo` page uploads a pre-recorded clip purely to demonstrate the detection pipeline. In production the same backend is fed by **live video** (stationary cameras pushing clips/streams with a stable `camera_id`, or the mobile app streaming recorded chunks) — uploading a file is not the production ingestion path.

To see live output on `/demo` you need the backend running locally (root [README](../README.md) → *Option 1 — Backend API*). The Vite dev origin (`http://localhost:5173`) is already allowed by the backend's `CORS_ORIGINS`.

## Environment variables

Create a `.env` file in this folder (or set them in the Vercel project settings):

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Backend base URL | `http://localhost:8754` |
| `VITE_DEMO_CNIC` | CNIC used to log in to the demo — must match an Argon2id hash in the backend's `AUTHORIZED_CNICS` | `42101-2345678-9` |

If `VITE_DEMO_CNIC` is not configured, the demo shows the sample response instead of calling the API.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # eslint
npm test         # vitest
```

## Deployment

Deployed to **Vercel**; `vercel.json` rewrites all routes to `/` so client‑side routing works. Set `VITE_API_URL` (production backend URL) and `VITE_DEMO_CNIC` in the Vercel project settings before going live, and add the deployed origin to the backend's `CORS_ORIGINS`.
