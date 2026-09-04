import type { AnalyzeVideoResponse } from "@/lib/api";

/**
 * Sample backend response matching the REAL /analyze-video response shape.
 * Used as a fallback when the backend is unreachable.
 */
export const sampleResponse: AnalyzeVideoResponse = {
  filename: "sample_footage.mp4",
  camera_id: "web-demo",
  location: { display_name: "Kallar Kahar, Pakistan" },
  escalation: { state: "ALERT" },
  incidents_detected: 1,
  video_analysis: {
    total_frames: 240,
    camera_id: "web-demo",
    alert: true,
    incidents: [
      {
        timestamp: 12.4,
        objects: [
          { label: "car", confidence: 0.91, bbox: [180, 240, 480, 420] },
          { label: "person", confidence: 0.86, bbox: [320, 180, 420, 520] },
        ],
        llm_description:
          "Two vehicles have collided at the intersection. Airbags are deployed and occupants appear motionless. Smoke is rising from the front of the first vehicle.",
      },
    ],
  },
  agent_response: `## Incident Analysis Report

**Classification:** Vehicle Collision
**Confidence:** 91%
**Severity:** High

**Detection Details:**
The YOLO11m model identified two damaged vehicles (car, 91%) with deployed airbags at the scene. Motion analysis suggests impact occurred within the last 60 seconds.

**Reasoning Assessment:**
Severity indicators (airbag deployment, occupant immobility) suggest serious injuries.

**Escalation Decision:** ESCALATE
- Notify: Police + Ambulance
- Priority: High
- Evidence: Video clip attached (12.4s)`,
  dispatch: [
    {
      tool: "call_police",
      service: "police",
      destination: "15",
      transport: "Asterisk AMI over SIP trunk",
      status: "placed",
      location: "Kallar Kahar, Pakistan",
      audio: { name: "sample_police_alert.wav" },
    },
    {
      tool: "call_ambulance",
      service: "ambulance",
      destination: "1122",
      transport: "Asterisk AMI over SIP trunk",
      status: "placed",
      location: "Kallar Kahar, Pakistan",
      audio: { name: "sample_ambulance_alert.wav" },
    },
  ],
  audio_file: "sample_ambulance_alert.wav",
};