# Sentinel-AI — Pipeline Evaluation

- **Date:** 2026-10-22 13:07
- **API:** `http://localhost:8754`
- **Mode:** demo (single_upload=1)
- **Videos:** 8 (8 analyzed, 0 failed)
- **Language for descriptions:** server default (en,ur)
- **How this was measured:** every clip is uploaded to `POST /analyze-video` with a fresh `camera_id`; the backend returns a `video_analysis.metrics` block (processed frames/seconds, gate counters, LLM token usage from the providers' `usage_metadata`). Actual clip length is probed locally with OpenCV, so *processed* vs *actual* are independent measurements.

## Per-video results

### Detection

| # | Video | Incident detected | Incidents | Alert | Dispatch | Agent verdict (truncated) |
|---|---|---|---|---|---|---|
| 1 | accidents (5).mp4 | yes | 1 | yes | yes | The relevant authorities are being notified. |
| 2 | armed robbery in Pakistan.mp4 | yes | 1 | yes | yes | The relevant authorities are being notified. |
| 3 | car2.mp4 | yes | 1 | yes | yes | The relevant authorities are being notified. |
| 4 | carcrash.mp4 | yes | 1 | yes | no | The video analysis shows a normal traffic scenario where a car is driving down a |
| 5 | fire (1).mp4 | no | 0 | no | no | No confirmed incident yet. The system is continuing to monitor this camera; an a |
| 6 | fire (2).mp4 | yes | 1 | yes | yes | The relevant authorities are being notified. |
| 7 | snatching (1).mp4 | yes | 1 | yes | no | The video analysis shows a normal residential scene with a parked car and a pass |
| 8 | snatching (4).mp4 | yes | 1 | yes | yes | The relevant authorities are being notified. |

> **Incident detected** = the vision model produced at least one incident description (`video_analysis.incidents` non-empty). **Alert** = the escalation state machine authorized the verification agent (in demo mode this fires on the first analysed frame). **Dispatch** = the agent actually called one or more emergency services. When the agent declines (verdict says no real emergency), dispatch is correctly skipped even though the frame was described.

### Footage: actual vs processed

| # | Video | Actual frames | Actual seconds | Processed frames | Processed seconds | Footage used % | Gated frames | Vision calls | Frames analyzed |
|---|---|---|---|---|---|---|---|---|---|
| 1 | accidents (5).mp4 | 312 | 10.4 | 181 | 6.03 | 57.98% | 2 | 1 | 1 |
| 2 | armed robbery in Pakistan.mp4 | 846 | 28.2 | 181 | 6.03 | 21.38% | 2 | 1 | 1 |
| 3 | car2.mp4 | 360 | 14.36 | 151 | 6.02 | 41.92% | 2 | 1 | 1 |
| 4 | carcrash.mp4 | 476 | 15.87 | 181 | 6.03 | 38.0% | 2 | 1 | 1 |
| 5 | fire (1).mp4 | 1500 | 50.0 | 1500 | 50.0 | 100.0% | 0 | 0 | 0 |
| 6 | fire (2).mp4 | 260 | 8.71 | 175 | 5.86 | 67.28% | 2 | 1 | 1 |
| 7 | snatching (1).mp4 | 1224 | 48.96 | 151 | 6.04 | 12.34% | 2 | 1 | 1 |
| 8 | snatching (4).mp4 | 1524 | 50.8 | 421 | 14.03 | 27.62% | 2 | 1 | 1 |

> **Footage used %** = processed seconds / actual seconds. In demo mode (`single_upload=1`) the pipeline stops at the first analysed frame, so low values are expected: they show how little footage was needed before the incident was confirmed. A clip that never passes the gates processes 100% and detects nothing.

### Tokens per video

| # | Video | Vision in | Vision out | Agent in | Agent out | Total tokens | Agent calls | Request time (s) |
|---|---|---|---|---|---|---|---|---|
| 1 | accidents (5).mp4 | 1239 | 68 | 4235 | 148 | 5690 | 2 | 16.8 |
| 2 | armed robbery in Pakistan.mp4 | 1239 | 48 | 4106 | 95 | 5488 | 2 | 22.93 |
| 3 | car2.mp4 | 1219 | 22 | 3515 | 51 | 4807 | 2 | 13.23 |
| 4 | carcrash.mp4 | 1239 | 36 | 1701 | 40 | 3016 | 1 | 12.08 |
| 5 | fire (1).mp4 | 0 | 0 | 0 | 0 | 0 | 0 | 19.6 |
| 6 | fire (2).mp4 | 1239 | 50 | 3768 | 201 | 5258 | 2 | 20.73 |
| 7 | snatching (1).mp4 | 1239 | 41 | 2024 | 27 | 3331 | 1 | 11.57 |
| 8 | snatching (4).mp4 | 1239 | 30 | 4315 | 58 | 5642 | 2 | 15.78 |

> Vision tokens = frame descriptions; agent tokens = the verification agent run (only when a dispatch was authorized). Providers that do not report usage appear as 0.

## Averages & totals (all successfully analyzed videos)

| Metric | Average | Total |
|---|---|---|
| Videos analyzed | — | 8 / 8 |
| Incidents detected | — | 7 / 8 |
| Alerts fired | — | 7 / 8 |
| Dispatches fired (agent called ≥1 service) | — | 5 / 8 |
| Actual length | 28.41 s (812.75 frames) | — |
| Processed length | 12.51 s (367.62 frames) | — |
| Footage used | 45.81% | — |
| Gated frames | 1.75 | — |
| Vision calls | 0.88 | — |
| Vision tokens (in / out) | 1081.62 / 36.88 | 8948 |
| Agent tokens (in / out) | 2958.0 / 77.5 | 24284 |
| **Total tokens per video** | **4154.0** | **33232** |
| Request time (API round-trip) | 16.59 s | — |

> Averages exclude failed uploads. `Request time` covers the whole multipart round-trip (upload + gating + LLM calls + dispatch attempt) but **excludes** the local video probing performed by this script.