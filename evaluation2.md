# Sentinel-AI — Pipeline Evaluation

- **Date:** 2026-10-22 13:07
- **API:** `http://localhost:8754`
- **Mode:** live (single_upload=0)
- **Videos:** 8 (8 analyzed, 0 failed)
- **Language for descriptions:** server default (en,ur)
- **How this was measured:** every clip is uploaded to `POST /analyze-video` with a fresh `camera_id`; the backend returns a `video_analysis.metrics` block (processed frames/seconds, gate counters, LLM token usage from the providers' `usage_metadata`). Actual clip length is probed locally with OpenCV, so *processed* vs *actual* are independent measurements.

## Per-video results

### Detection

| # | Video | Incident detected | Incidents | Alert | Dispatch | Agent verdict (truncated) |
|---|---|---|---|---|---|---|
| 1 | accidents (5).mp4 | yes | 1 | yes | yes | The relevant authorities are being notified. |
| 2 | armed robbery in Pakistan.mp4 | yes | 1 | yes | no | The video analysis shows normal pedestrian and traffic activity (a person walkin |
| 3 | car2.mp4 | yes | 1 | yes | no | The video analysis shows a convoy of cars driving normally on a road. No emergen |
| 4 | carcrash.mp4 | yes | 1 | yes | yes | The relevant authorities are being notified. |
| 5 | fire (1).mp4 | no | 0 | no | no | No confirmed incident yet. The system is continuing to monitor this camera; an a |
| 6 | fire (2).mp4 | yes | 1 | no | no | No confirmed incident yet. The system is continuing to monitor this camera; an a |
| 7 | snatching (1).mp4 | yes | 1 | yes | no | The video analysis shows a parked car and routine traffic with no signs of an ac |
| 8 | snatching (4).mp4 | yes | 1 | yes | yes | The relevant authorities are being notified. |

> **Incident detected** = the vision model produced at least one incident description (`video_analysis.incidents` non-empty). **Alert** = the escalation state machine authorized the verification agent (in live mode this requires repeated gated detections (ESCALATION_CONFIRMING_HITS)). **Dispatch** = the agent actually called one or more emergency services. When the agent declines (verdict says no real emergency), dispatch is correctly skipped even though the frame was described.

### Footage: actual vs processed

| # | Video | Actual frames | Actual seconds | Processed frames | Processed seconds | Footage used % | Gated frames | Vision calls | Frames analyzed |
|---|---|---|---|---|---|---|---|---|---|
| 1 | accidents (5).mp4 | 312 | 10.4 | 211 | 7.03 | 67.6% | 3 | 1 | 1 |
| 2 | armed robbery in Pakistan.mp4 | 846 | 28.2 | 211 | 7.03 | 24.93% | 3 | 1 | 1 |
| 3 | car2.mp4 | 360 | 14.36 | 176 | 7.02 | 48.89% | 3 | 1 | 1 |
| 4 | carcrash.mp4 | 476 | 15.87 | 211 | 7.03 | 44.3% | 3 | 1 | 1 |
| 5 | fire (1).mp4 | 1500 | 50.0 | 1500 | 50.0 | 100.0% | 0 | 0 | 0 |
| 6 | fire (2).mp4 | 260 | 8.71 | 260 | 8.71 | 100.0% | 2 | 1 | 1 |
| 7 | snatching (1).mp4 | 1224 | 48.96 | 176 | 7.04 | 14.38% | 3 | 1 | 1 |
| 8 | snatching (4).mp4 | 1524 | 50.8 | 451 | 15.03 | 29.59% | 3 | 1 | 1 |

> **Footage used %** = processed seconds / actual seconds. In live mode (`single_upload=0`) the scan continues until the escalation state machine confirms an alert (ESCALATION_CONFIRMING_HITS gated detections) or the clip ends, so values are higher than in demo mode. A clip whose detections never reach confirmation — or that never passes the gates — processes 100% of the footage.

### Tokens per video

| # | Video | Vision in | Vision out | Agent in | Agent out | Total tokens | Agent calls | Request time (s) |
|---|---|---|---|---|---|---|---|---|
| 1 | accidents (5).mp4 | 1239 | 27 | 3383 | 122 | 4771 | 2 | 15.38 |
| 2 | armed robbery in Pakistan.mp4 | 1239 | 58 | 2030 | 35 | 3362 | 1 | 10.04 |
| 3 | car2.mp4 | 1219 | 22 | 1701 | 36 | 2978 | 1 | 8.21 |
| 4 | carcrash.mp4 | 1239 | 42 | 3522 | 48 | 4851 | 2 | 15.57 |
| 5 | fire (1).mp4 | 0 | 0 | 0 | 0 | 0 | 0 | 18.22 |
| 6 | fire (2).mp4 | 1239 | 28 | 0 | 0 | 1267 | 0 | 8.56 |
| 7 | snatching (1).mp4 | 1239 | 39 | 1982 | 33 | 3293 | 1 | 10.38 |
| 8 | snatching (4).mp4 | 1239 | 29 | 4268 | 61 | 5597 | 2 | 31.12 |

> Vision tokens = frame descriptions; agent tokens = the verification agent run (only when a dispatch was authorized). Providers that do not report usage appear as 0.

## Averages & totals (all successfully analyzed videos)

| Metric | Average | Total |
|---|---|---|
| Videos analyzed | — | 8 / 8 |
| Incidents detected | — | 7 / 8 |
| Alerts fired | — | 6 / 8 |
| Dispatches fired (agent called ≥1 service) | — | 3 / 8 |
| Actual length | 28.41 s (812.75 frames) | — |
| Processed length | 13.61 s (399.5 frames) | — |
| Footage used | 53.71% | — |
| Gated frames | 2.5 | — |
| Vision calls | 0.88 | — |
| Vision tokens (in / out) | 1081.62 / 30.62 | 8898 |
| Agent tokens (in / out) | 2110.75 / 41.88 | 17221 |
| **Total tokens per video** | **3264.88** | **26119** |
| Request time (API round-trip) | 14.69 s | — |

> Averages exclude failed uploads. `Request time` covers the whole multipart round-trip (upload + gating + LLM calls + dispatch attempt) but **excludes** the local video probing performed by this script.