"""Per-camera escalation state machine.

Tracks one incident lifecycle per camera instead of re-evaluating from
scratch on every frame:

    IDLE -> SUSPICIOUS -> CONFIRMING -> ALERT -> COOLDOWN -> IDLE

- Cheap gates (motion + YOLO class/confidence) move IDLE -> SUSPICIOUS
  with no LLM involvement.
- The SUSPICIOUS -> CONFIRMING transition is the ONLY point the vision LLM
  runs; the description produced there is the incident evidence.
- Repeated gated detections while CONFIRMING count toward ALERT; reaching
  ALERT authorizes the agent to dispatch (e.g. call 1122 over the SIP trunk).
- COOLDOWN throttles re-alerting for the same camera, so flooding is
  impossible: a single incident lifecycle ends before the next can start.

States decay lazily: a state not refreshed within its window falls back to
IDLE when the next detection arrives - no background timers needed.
"""

import logging
import threading
import time

from core.config import (
    ESCALATION_ALERT_TIMEOUT_S,
    ESCALATION_CONFIRMING_HITS,
    ESCALATION_COOLDOWN_S,
    ESCALATION_WINDOW_S,
)

logger = logging.getLogger(__name__)

IDLE = "IDLE"
SUSPICIOUS = "SUSPICIOUS"
CONFIRMING = "CONFIRMING"
ALERT = "ALERT"
COOLDOWN = "COOLDOWN"

# Actions returned by on_gated_detection().
IGNORE = "ignore"   # state updated but nothing expensive runs
ANALYZE = "analyze"  # run the vision LLM (only on SUSPICIOUS -> CONFIRMING)
ALERT_ACTION = "alert"  # run the agent / dispatch now


class CameraEscalation:
    """State machine for a single camera (thread-safe)."""

    def __init__(self, camera_id: str):
        self.camera_id = camera_id
        self._lock = threading.Lock()
        self.state = IDLE
        self.hits = 0
        self.entered_at = 0.0
        self.last_hit_at = 0.0
        self.cooldown_until = 0.0

    def _reset(self, now: float) -> None:
        previous = self.state
        self.state = IDLE
        self.hits = 0
        self.entered_at = now
        self.last_hit_at = now
        self.cooldown_until = 0.0
        if previous != IDLE:
            logger.info("Camera %s: %s -> IDLE (decay)", self.camera_id, previous)

    def _decay(self, now: float) -> None:
        if self.state == COOLDOWN and now >= self.cooldown_until:
            self._reset(now)
        elif self.state in (SUSPICIOUS, CONFIRMING) and now - self.last_hit_at > ESCALATION_WINDOW_S:
            self._reset(now)
        elif self.state == ALERT and now - self.entered_at > ESCALATION_ALERT_TIMEOUT_S:
            self._reset(now)

    def on_gated_detection(self, now: float | None = None) -> str:
        """Feed a gated frame (motion + relevant YOLO class above threshold).

        Returns one of IGNORE / ANALYZE / ALERT_ACTION so the caller knows
        what to run: nothing (state only), the vision LLM, or the agent.
        """
        now = time.time() if now is None else now
        with self._lock:
            self._decay(now)

            if self.state == COOLDOWN:
                logger.debug(
                    "Camera %s: gated detection ignored (cooldown until %.0f)",
                    self.camera_id, self.cooldown_until,
                )
                return IGNORE

            if self.state == IDLE:
                self.state = SUSPICIOUS
                self.entered_at = now
                self.last_hit_at = now
                logger.info(
                    "Camera %s: IDLE -> SUSPICIOUS (gated detection, no LLM)",
                    self.camera_id,
                )
                return IGNORE

            if self.state == ALERT:
                # A dispatch is already in flight for this lifecycle; further
                # gated detections must not re-trigger it.
                logger.debug(
                    "Camera %s: gated detection ignored (already alerting)",
                    self.camera_id,
                )
                return IGNORE

            if self.state == SUSPICIOUS:
                self.state = CONFIRMING
                self.hits = 1
                self.entered_at = now
                self.last_hit_at = now
                logger.info(
                    "Camera %s: SUSPICIOUS -> CONFIRMING (vision LLM runs once)",
                    self.camera_id,
                )
                return ANALYZE

            # CONFIRMING: repeated detections count toward the alert.
            self.hits += 1
            self.last_hit_at = now
            if self.hits >= ESCALATION_CONFIRMING_HITS:
                self.state = ALERT
                self.entered_at = now
                logger.warning(
                    "Camera %s: CONFIRMING -> ALERT (%d gated detections)",
                    self.camera_id, self.hits,
                )
                return ALERT_ACTION
            logger.debug(
                "Camera %s: CONFIRMING hit %d/%d (no LLM)",
                self.camera_id, self.hits, ESCALATION_CONFIRMING_HITS,
            )
            return IGNORE

    def mark_alert_done(self, now: float | None = None) -> None:
        """Move ALERT -> COOLDOWN after the agent finished the dispatch attempt."""
        now = time.time() if now is None else now
        with self._lock:
            if self.state != ALERT:
                return
            self.state = COOLDOWN
            self.cooldown_until = now + ESCALATION_COOLDOWN_S
            self.entered_at = now
            logger.info(
                "Camera %s: ALERT -> COOLDOWN (%.0fs)",
                self.camera_id, ESCALATION_COOLDOWN_S,
            )

    def snapshot(self) -> dict:
        with self._lock:
            return {
                "camera_id": self.camera_id,
                "state": self.state,
                "hits": self.hits,
                "entered_at": round(self.entered_at, 2),
                "last_hit_at": round(self.last_hit_at, 2),
                "cooldown_until": round(self.cooldown_until, 2),
                "confirming_hits_required": ESCALATION_CONFIRMING_HITS,
                "cooldown_s": ESCALATION_COOLDOWN_S,
            }


_registry: dict[str, CameraEscalation] = {}
_registry_lock = threading.Lock()
_MAX_CAMERAS = 1024


def tracker_for(camera_id: str) -> CameraEscalation:
    """Get (or create) the state machine for a camera."""
    with _registry_lock:
        tracker = _registry.get(camera_id)
        if tracker is None:
            if len(_registry) >= _MAX_CAMERAS:
                # Evict stale idle entries so the registry stays bounded.
                now = time.time()
                stale = [
                    cid for cid, item in _registry.items()
                    if item.state == IDLE and now - item.last_hit_at > 600
                ]
                for cid in stale:
                    del _registry[cid]
                if len(_registry) >= _MAX_CAMERAS:
                    _registry.clear()
            tracker = CameraEscalation(camera_id)
            _registry[camera_id] = tracker
        return tracker


def reset(camera_id: str) -> None:
    """Force a camera back to IDLE (admin/testing)."""
    with _registry_lock:
        tracker = _registry.get(camera_id)
    if tracker is not None:
        tracker._reset(time.time())
