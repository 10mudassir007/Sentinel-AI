# Sentinel AI — Website

Marketing site and live demo for **Sentinel‑AI**, the automated video incident‑detection platform (the FastAPI backend lives in the repository root — see the root `README.md`).

Built with **Vite 5 + React 18 + TypeScript + Tailwind CSS 3 + shadcn/ui**, deployed on **Vercel**.

## Pages

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | Landing page with hero + demo CTA |
| `/how-it-works` | How It Works | Full flow: CNIC login → detection pipeline → authority dispatch |
| `/use-cases` | Use Cases | Application scenarios |
| `/demo` | Demo | **Upload a video to the live backend** and see the real pipeline output |
| `/detection-capabilities` | Detection Capabilities | Incident taxonomy + model notes (base YOLO11m COCO, not custom‑trained) |
| `/dashboard` | Dashboard | Sample incident analytics (demo data, recharts) |
| `/tech-stack` | Tech Stack | Technologies used across the platform |
| `/privacy-policy` | Privacy Policy | Data handling terms |
| `*` | 404 | Not found |

## Demo page (`/demo`)

Talks to the real Sentinel‑AI API (FastAPI, default `http://localhost:8754`):

- `POST /login` with the CNIC from `VITE_DEMO_CNIC` to obtain a bearer token
- `POST /analyze-video` — multipart video upload (`language=en`, camera id, `single_upload`)
- `GET /audio/{filename}` — plays the generated voice alert (bearer auth)
- Expired token (401) → automatic re‑login and one retry
- API unreachable → the page falls back to a realistic sample response

### Environment variables

Create a `.env` file in this folder (or set them in the Vercel project settings):

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Backend base URL | `http://localhost:8754` |
| `VITE_DEMO_CNIC` | CNIC used to log in to the demo — must match an `AUTHORIZED_CNICS` Argon2id hash in the backend `.env` | *(empty → demo shows the sample response)* |

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

Deployed to **Vercel**; `vercel.json` rewrites all routes to `/` so client‑side routing works. Set `VITE_API_URL` and `VITE_DEMO_CNIC` in the Vercel project settings before going live.
