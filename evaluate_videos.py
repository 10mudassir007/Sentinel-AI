"""Evaluate the Sentinel-AI detection pipeline against a folder of videos.

Runs every clip in the videos directory through POST /analyze-video (the same
endpoint the website and mobile app use), then reports per-video metrics:

- actual clip length (frames + seconds, probed locally with OpenCV)
- processed length (frames + seconds actually read by the pipeline)
- footage used percentage (processed / actual)
- LLM tokens used per video (vision model + verification agent)

Results are written to evaluation_results.json and EVALUATION.md.

Usage:
    python evaluate_videos.py --videos "C:\\path\\to\\videos"
    python evaluate_videos.py --md-only        # regenerate the .md from the .json
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import uuid
from datetime import datetime
from pathlib import Path

import cv2
import requests

REPO = Path(__file__).resolve().parent
SUPPORTED_EXTENSIONS = (".mp4", ".avi", ".mov")
DEFAULT_VIDEOS_DIR = r"C:\Users\hp\Desktop\Sentinel-AI-Docs\test_videos"
DEFAULT_API_URL = "http://localhost:8754"
DEFAULT_RESULTS_JSON = REPO / "evaluation_results.json"
DEFAULT_REPORT_MD = REPO / "EVALUATION.md"


# ----------------------------------------------------------------------
# Helpers


def load_cnic(explicit: str | None) -> str:
    """CNIC for POST /login: --cnic, EVAL_CNIC, or website/.env's demo CNIC."""
    if explicit:
        return explicit
    if os.getenv("EVAL_CNIC"):
        return os.environ["EVAL_CNIC"]
    website_env = REPO / "website" / ".env"
    if website_env.is_file():
        text = website_env.read_text(encoding="utf-8", errors="replace")
        match = re.search(r"^VITE_DEMO_CNIC=(.+)$", text, flags=re.MULTILINE)
        if match:
            return match.group(1).strip().strip('"').strip("'")
    sys.exit("No CNIC available: pass --cnic, set EVAL_CNIC, or configure website/.env")


def login(api_url: str, cnic: str) -> str:
    """Exchange the CNIC for a bearer token (never printed)."""
    response = requests.post(f"{api_url}/login", json={"cnic": cnic}, timeout=30)
    if response.status_code != 200:
        sys.exit(f"Login failed ({response.status_code}): {response.text[:300]}")
    return response.json()["access_token"]


def probe_video(path: Path) -> dict:
    """Measure the real clip: frame count, fps and duration (OpenCV)."""
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        raise RuntimeError(f"OpenCV cannot open {path}")
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 0.0)
    frames = 0
    while cap.grab():
        frames += 1
    cap.release()
    duration = frames / fps if fps > 0 else 0.0
    return {
        "actual_frames": frames,
        "actual_fps": round(fps, 3),
        "actual_seconds": round(duration, 2),
    }


def analyze(
    api_url: str, token: str, video: Path, single_upload: bool, language: str, timeout: int
) -> dict:
    """Upload one clip and return the raw API response."""
    data = {
        "single_upload": "1" if single_upload else "0",
        "camera_id": f"eval-{uuid.uuid4().hex[:8]}",
    }
    if language:
        data["language"] = language
    with video.open("rb") as fh:
        response = requests.post(
            f"{api_url}/analyze-video",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": (video.name, fh, "video/mp4")},
            data=data,
            timeout=timeout,
        )
    response.raise_for_status()
    return response.json()


def extract_row(video: Path, probe: dict, elapsed: float, response: dict) -> dict:
    """Flatten one API response into an evaluation row."""
    va = response.get("video_analysis") or {}
    metrics = va.get("metrics") or {}
    dispatch = response.get("dispatch")

    actual_seconds = probe["actual_seconds"]
    processed_seconds = float(metrics.get("processed_seconds") or 0.0)
    footage_pct = round(processed_seconds / actual_seconds * 100, 2) if actual_seconds else 0.0

    vision_in = int(metrics.get("vision_input_tokens") or 0)
    vision_out = int(metrics.get("vision_output_tokens") or 0)
    agent_in = int(metrics.get("agent_input_tokens") or 0)
    agent_out = int(metrics.get("agent_output_tokens") or 0)

    dispatch_entries = dispatch if isinstance(dispatch, list) else []
    dispatch_status = ", ".join(
        f"{entry.get('tool', '?')}: {entry.get('status', '?')}" for entry in dispatch_entries
    )
    dispatch_details = [
        {
            "tool": entry.get("tool"),
            "status": entry.get("status"),
            "error": entry.get("error"),
            "audio": (entry.get("audio") or {}).get("name"),
            "engine": (entry.get("audio") or {}).get("engine"),
        }
        for entry in dispatch_entries
    ]

    return {
        "video": video.name,
        "status": "ok",
        "incident_detected": int(response.get("incidents_detected") or 0) > 0,
        "incidents_detected": int(response.get("incidents_detected") or 0),
        "alert": bool(va.get("alert")),
        "escalation_state": (va.get("escalation") or {}).get("state"),
        "dispatch_fired": len(dispatch_entries) > 0,
        "dispatch_status": dispatch_status or "-",
        "dispatch_details": dispatch_details,
        "audio_file": response.get("audio_file") or "-",
        **probe,
        "auto_total_frames": va.get("total_frames"),
        "processed_frames": int(metrics.get("processed_frames") or 0),
        "processed_seconds": processed_seconds,
        "footage_used_pct": footage_pct,
        "gated_frames": int(metrics.get("gated_frames") or 0),
        "frames_analyzed": int(metrics.get("frames_analyzed") or 0),
        "vision_calls": int(metrics.get("vision_calls") or 0),
        "agent_calls": int(metrics.get("agent_calls") or 0),
        "vision_input_tokens": vision_in,
        "vision_output_tokens": vision_out,
        "agent_input_tokens": agent_in,
        "agent_output_tokens": agent_out,
        "total_tokens": vision_in + vision_out + agent_in + agent_out,
        "request_seconds": round(elapsed, 2),
        "agent_response": (response.get("agent_response") or "")[:300],
    }


def failed_row(video: Path, probe: dict | None, elapsed: float, error: str) -> dict:
    probe = probe or {"actual_frames": 0, "actual_fps": 0.0, "actual_seconds": 0.0}
    return {
        "video": video.name,
        "status": "failed",
        "error": error[:300],
        "incident_detected": False,
        "incidents_detected": 0,
        "alert": False,
        "escalation_state": None,
        "dispatch_fired": False,
        "dispatch_status": "-",
        "dispatch_details": [],
        "audio_file": "-",
        **probe,
        "auto_total_frames": None,
        "processed_frames": 0,
        "processed_seconds": 0.0,
        "footage_used_pct": 0.0,
        "gated_frames": 0,
        "frames_analyzed": 0,
        "vision_calls": 0,
        "agent_calls": 0,
        "vision_input_tokens": 0,
        "vision_output_tokens": 0,
        "agent_input_tokens": 0,
        "agent_output_tokens": 0,
        "total_tokens": 0,
        "request_seconds": round(elapsed, 2),
        "agent_response": "",
    }


# ----------------------------------------------------------------------
# Aggregation


def _avg(rows: list[dict], key: str) -> float:
    values = [row[key] for row in rows if isinstance(row.get(key), (int, float))]
    return round(sum(values) / len(values), 2) if values else 0.0


def _sum(rows: list[dict], key: str) -> float:
    return round(sum(row[key] for row in rows if isinstance(row.get(key), (int, float))), 2)


def aggregate(rows: list[dict]) -> dict:
    ok = [row for row in rows if row["status"] == "ok"]
    return {
        "total_videos": len(rows),
        "successful": len(ok),
        "failed": len(rows) - len(ok),
        "incidents_detected": sum(1 for row in ok if row["incident_detected"]),
        "alerts_fired": sum(1 for row in ok if row["alert"]),
        "dispatches_fired": sum(1 for row in ok if row["dispatch_fired"]),
        "avg_actual_frames": _avg(ok, "actual_frames"),
        "avg_actual_seconds": _avg(ok, "actual_seconds"),
        "avg_processed_frames": _avg(ok, "processed_frames"),
        "avg_processed_seconds": _avg(ok, "processed_seconds"),
        "avg_footage_used_pct": _avg(ok, "footage_used_pct"),
        "avg_gated_frames": _avg(ok, "gated_frames"),
        "avg_vision_calls": _avg(ok, "vision_calls"),
        "avg_vision_input_tokens": _avg(ok, "vision_input_tokens"),
        "avg_vision_output_tokens": _avg(ok, "vision_output_tokens"),
        "avg_agent_input_tokens": _avg(ok, "agent_input_tokens"),
        "avg_agent_output_tokens": _avg(ok, "agent_output_tokens"),
        "avg_total_tokens": _avg(ok, "total_tokens"),
        "total_tokens_all_videos": _sum(ok, "total_tokens"),
        "total_vision_tokens": _sum(ok, "vision_input_tokens") + _sum(ok, "vision_output_tokens"),
        "total_agent_tokens": _sum(ok, "agent_input_tokens") + _sum(ok, "agent_output_tokens"),
        "avg_request_seconds": _avg(ok, "request_seconds"),
    }


# ----------------------------------------------------------------------
# Markdown report


def build_markdown(rows: list[dict], summary: dict, config: dict) -> str:
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    mode = "demo (single_upload=1)" if config["single_upload"] else "live (single_upload=0)"
    lines: list[str] = []
    add = lines.append

    add("# Sentinel-AI — Pipeline Evaluation")
    add("")
    add(f"- **Date:** {now}")
    add(f"- **API:** `{config['api_url']}`")
    add(f"- **Mode:** {mode}")
    add(
        f"- **Videos:** {summary['total_videos']} "
        f"({summary['successful']} analyzed, {summary['failed']} failed)"
    )
    add(f"- **Language for descriptions:** {config['language'] or 'server default (en,ur)'}")
    add(
        "- **How this was measured:** every clip is uploaded to `POST /analyze-video` "
        "with a fresh `camera_id`; the backend returns a `video_analysis.metrics` "
        "block (processed frames/seconds, gate counters, LLM token usage from the "
        "providers' `usage_metadata`). Actual clip length is probed locally with "
        "OpenCV, so *processed* vs *actual* are independent measurements."
    )
    add("")

    add("## Per-video results")
    add("")
    add("### Detection")
    add("")
    add(
        "| # | Video | Incident detected | Incidents | Alert | Dispatch "
        "| Agent verdict (truncated) |"
    )
    add("|---|---|---|---|---|---|---|")
    for i, row in enumerate(rows, 1):
        if row["status"] != "ok":
            add(f"| {i} | {row['video']} | FAILED | - | - | - | {row.get('error', '')[:80]} |")
            continue
        verdict = row["agent_response"].replace("|", "\\|").replace("\n", " ")[:80]
        add(
            f"| {i} | {row['video']} | {'yes' if row['incident_detected'] else 'no'} "
            f"| {row['incidents_detected']} | {'yes' if row['alert'] else 'no'} "
            f"| {'yes' if row['dispatch_fired'] else 'no'} "
            f"| {verdict} |"
        )
    add("")
    if config["single_upload"]:
        alert_note = "in demo mode this fires on the first analysed frame"
    else:
        alert_note = (
            "in live mode this requires repeated gated detections (ESCALATION_CONFIRMING_HITS)"
        )
    add(
        "> **Incident detected** = the vision model produced at least one incident "
        "description (`video_analysis.incidents` non-empty). **Alert** = the escalation "
        f"state machine authorized the verification agent ({alert_note}). "
        "**Dispatch** = the agent actually called one or "
        "more emergency services. When the agent declines (verdict says no real "
        "emergency), dispatch is correctly skipped even though the frame was described."
    )
    add("")

    add("### Footage: actual vs processed")
    add("")
    add(
        "| # | Video | Actual frames | Actual seconds | Processed frames | Processed seconds "
        "| Footage used % | Gated frames | Vision calls | Frames analyzed |"
    )
    add("|---|---|---|---|---|---|---|---|---|---|")
    for i, row in enumerate(rows, 1):
        if row["status"] != "ok":
            add(f"| {i} | {row['video']} | - | - | - | - | - | - | - | - |")
            continue
        add(
            f"| {i} | {row['video']} | {row['actual_frames']} | {row['actual_seconds']} "
            f"| {row['processed_frames']} | {row['processed_seconds']} "
            f"| {row['footage_used_pct']}% | {row['gated_frames']} | {row['vision_calls']} "
            f"| {row['frames_analyzed']} |"
        )
    add("")
    if config["single_upload"]:
        add(
            "> **Footage used %** = processed seconds / actual seconds. In demo mode "
            "(`single_upload=1`) the pipeline stops at the first analysed frame, so low "
            "values are expected: they show how little footage was needed before the "
            "incident was confirmed. A clip that never passes the gates processes 100% "
            "and detects nothing."
        )
    else:
        add(
            "> **Footage used %** = processed seconds / actual seconds. In live mode "
            "(`single_upload=0`) the scan continues until the escalation state machine "
            "confirms an alert (ESCALATION_CONFIRMING_HITS gated detections) or the clip "
            "ends, so values are higher than in demo mode. A clip whose detections never "
            "reach confirmation — or that never passes the gates — processes 100% of "
            "the footage."
        )
    add("")

    add("### Tokens per video")
    add("")
    add(
        "| # | Video | Vision in | Vision out | Agent in | Agent out | Total tokens "
        "| Agent calls | Request time (s) |"
    )
    add("|---|---|---|---|---|---|---|---|---|")
    for i, row in enumerate(rows, 1):
        if row["status"] != "ok":
            add(f"| {i} | {row['video']} | - | - | - | - | - | - | - |")
            continue
        add(
            f"| {i} | {row['video']} | {row['vision_input_tokens']} "
            f"| {row['vision_output_tokens']} | {row['agent_input_tokens']} "
            f"| {row['agent_output_tokens']} | {row['total_tokens']} "
            f"| {row['agent_calls']} | {row['request_seconds']} |"
        )
    add("")
    add(
        "> Vision tokens = frame descriptions; agent tokens = the verification "
        "agent run (only when a dispatch was authorized). Providers that do not "
        "report usage appear as 0."
    )
    add("")

    add("## Averages & totals (all successfully analyzed videos)")
    add("")
    add("| Metric | Average | Total |")
    add("|---|---|---|")
    add(f"| Videos analyzed | — | {summary['successful']} / {summary['total_videos']} |")
    add(f"| Incidents detected | — | {summary['incidents_detected']} / {summary['successful']} |")
    add(f"| Alerts fired | — | {summary['alerts_fired']} / {summary['successful']} |")
    add(
        f"| Dispatches fired (agent called ≥1 service) | — | "
        f"{summary['dispatches_fired']} / {summary['successful']} |"
    )
    add(
        f"| Actual length | {summary['avg_actual_seconds']} s "
        f"({summary['avg_actual_frames']} frames) | — |"
    )
    add(
        f"| Processed length | {summary['avg_processed_seconds']} s "
        f"({summary['avg_processed_frames']} frames) | — |"
    )
    add(f"| Footage used | {summary['avg_footage_used_pct']}% | — |")
    add(f"| Gated frames | {summary['avg_gated_frames']} | — |")
    add(f"| Vision calls | {summary['avg_vision_calls']} | — |")
    add(
        f"| Vision tokens (in / out) | "
        f"{summary['avg_vision_input_tokens']} / {summary['avg_vision_output_tokens']} "
        f"| {summary['total_vision_tokens']} |"
    )
    add(
        f"| Agent tokens (in / out) | "
        f"{summary['avg_agent_input_tokens']} / {summary['avg_agent_output_tokens']} "
        f"| {summary['total_agent_tokens']} |"
    )
    add(
        f"| **Total tokens per video** | **{summary['avg_total_tokens']}** | "
        f"**{summary['total_tokens_all_videos']}** |"
    )
    add(f"| Request time (API round-trip) | {summary['avg_request_seconds']} s | — |")
    add("")
    add(
        "> Averages exclude failed uploads. `Request time` covers the whole "
        "multipart round-trip (upload + gating + LLM calls + dispatch attempt) but "
        "**excludes** the local video probing performed by this script."
    )

    if summary["failed"]:
        add("")
        add("## Failures")
        add("")
        for row in rows:
            if row["status"] != "ok":
                add(f"- **{row['video']}** — {row.get('error', 'unknown error')}")
    return "\n".join(lines)


# ----------------------------------------------------------------------
# Main


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--videos", default=DEFAULT_VIDEOS_DIR, help="directory containing clips (mp4/avi/mov)"
    )
    parser.add_argument("--api-url", default=DEFAULT_API_URL)
    parser.add_argument(
        "--cnic", default=None, help="defaults to EVAL_CNIC or website/.env VITE_DEMO_CNIC"
    )
    parser.add_argument("--language", default="", help='e.g. "en", "ur", "en,ur"')
    parser.add_argument(
        "--single-upload",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="demo mode (default) vs live mode",
    )
    parser.add_argument("--timeout", type=int, default=600, help="per-video timeout (s)")
    parser.add_argument("--out-json", default=str(DEFAULT_RESULTS_JSON))
    parser.add_argument("--out-md", default=str(DEFAULT_REPORT_MD))
    parser.add_argument(
        "--md-only", action="store_true", help="regenerate the .md from an existing results .json"
    )
    args = parser.parse_args()

    config = {
        "api_url": args.api_url,
        "single_upload": args.single_upload,
        "language": args.language,
        "videos_dir": args.videos,
    }

    if args.md_only:
        payload = json.loads(Path(args.out_json).read_text(encoding="utf-8"))
        rows, summary = payload["results"], payload["summary"]
        config = payload.get("config") or config
    else:
        videos_dir = Path(args.videos)
        if not videos_dir.is_dir():
            sys.exit(f"Videos directory not found: {videos_dir}")
        videos = sorted(
            path
            for path in videos_dir.iterdir()
            if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
        )
        if not videos:
            sys.exit(f"No {', '.join(SUPPORTED_EXTENSIONS)} files in {videos_dir}")

        token = login(args.api_url, load_cnic(args.cnic))
        rows = []
        for index, video in enumerate(videos, 1):
            print(f"[{index}/{len(videos)}] {video.name} ...", flush=True)
            probe = None
            started = time.perf_counter()
            try:
                probe = probe_video(video)
                response = analyze(
                    args.api_url, token, video, args.single_upload, args.language, args.timeout
                )
                row = extract_row(video, probe, time.perf_counter() - started, response)
            except Exception as exc:  # noqa: BLE001 - one bad clip must not stop the run
                row = failed_row(
                    video, probe, time.perf_counter() - started, f"{exc.__class__.__name__}: {exc}"
                )
            rows.append(row)
            print(
                f"    -> {row['status']}, incident_detected={row['incident_detected']}, "
                f"alert={row['alert']}, footage_used={row['footage_used_pct']}%, "
                f"tokens={row['total_tokens']}, {row['request_seconds']}s",
                flush=True,
            )

        summary = aggregate(rows)
        payload = {
            "generated_at": datetime.now().isoformat(timespec="seconds"),
            "config": config,
            "summary": summary,
            "results": rows,
        }
        Path(args.out_json).write_text(
            json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        print(f"\nRaw results written to {args.out_json}")

    report = build_markdown(rows, summary, config)
    Path(args.out_md).write_text(report, encoding="utf-8")
    print(f"Report written to {args.out_md}")


if __name__ == "__main__":
    main()
