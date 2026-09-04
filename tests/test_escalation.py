"""Tests for core.escalation: per-camera state machine lifecycle."""

from core.escalation import (
    ALERT,
    ALERT_ACTION,
    ANALYZE,
    CONFIRMING,
    COOLDOWN,
    IDLE,
    IGNORE,
    SUSPICIOUS,
    CameraEscalation,
    tracker_for,
)

# --- Full lifecycle (default config: 3 confirming hits) ---------------


class TestEscalationLifecycle:
    """IDLE -> SUSPICIOUS -> CONFIRMING -> ALERT -> COOLDOWN -> IDLE."""

    def _new(self, cid: str = "cam-lifecycle"):
        return CameraEscalation(cid)

    def test_idle_to_suspicious(self):
        t = self._new()
        assert t.on_gated_detection(now=100.0) == IGNORE
        assert t.state == SUSPICIOUS

    def test_suspicious_to_confirming_triggers_analyze(self):
        t = self._new()
        t.on_gated_detection(now=100.0)  # IDLE -> SUSPICIOUS
        action = t.on_gated_detection(now=101.0)
        assert action == ANALYZE
        assert t.state == CONFIRMING
        assert t.hits == 1

    def test_confirming_to_alert(self):
        t = self._new()
        t.on_gated_detection(now=100.0)  # -> SUSPICIOUS
        t.on_gated_detection(now=101.0)  # -> CONFIRMING (hit 1)
        # Hit 2 and 3 while CONFIRMING
        t.on_gated_detection(now=102.0)  # hit 2
        action = t.on_gated_detection(now=103.0)  # hit 3 -> ALERT
        assert action == ALERT_ACTION
        assert t.state == ALERT

    def test_alert_subsequent_detections_ignored(self):
        t = self._new()
        t.on_gated_detection(now=100.0)  # -> SUSPICIOUS
        t.on_gated_detection(now=101.0)  # -> CONFIRMING
        t.on_gated_detection(now=102.0)  # hit 2
        t.on_gated_detection(now=103.0)  # hit 3 -> ALERT
        # Further detections while ALERT are ignored (dispatch in flight).
        action = t.on_gated_detection(now=104.0)
        assert action == IGNORE
        assert t.state == ALERT

    def test_alert_to_cooldown(self):
        t = self._new()
        t.on_gated_detection(now=100.0)
        t.on_gated_detection(now=101.0)
        t.on_gated_detection(now=102.0)
        t.on_gated_detection(now=103.0)  # -> ALERT
        t.mark_alert_done(now=103.0)
        assert t.state == COOLDOWN

    def test_cooldown_ignores_detections(self):
        t = self._new()
        t.on_gated_detection(now=100.0)
        t.on_gated_detection(now=101.0)
        t.on_gated_detection(now=102.0)
        t.on_gated_detection(now=103.0)  # -> ALERT
        t.mark_alert_done(now=103.0)  # -> COOLDOWN (300s)
        # Detection during cooldown is ignored.
        action = t.on_gated_detection(now=104.0)
        assert action == IGNORE
        assert t.state == COOLDOWN

    def test_cooldown_decays_back_to_idle(self):
        t = self._new()
        t.on_gated_detection(now=100.0)
        t.on_gated_detection(now=101.0)
        t.on_gated_detection(now=102.0)
        t.on_gated_detection(now=103.0)  # -> ALERT
        t.mark_alert_done(now=103.0)  # -> COOLDOWN until 403.0
        # After cooldown expires, next detection starts a new lifecycle.
        action = t.on_gated_detection(now=500.0)
        assert action == IGNORE
        assert t.state == SUSPICIOUS


# --- Decay behavior ---------------------------------------------------


class TestEscalationDecay:
    """States that aren't refreshed within their window must decay to IDLE."""

    def test_suspicious_decays_to_idle_after_window(self):
        t = CameraEscalation("cam-decay-sus")
        t.on_gated_detection(now=100.0)  # -> SUSPICIOUS
        assert t.state == SUSPICIOUS
        # 61s later (>60s window), the next detection decays to IDLE first.
        action = t.on_gated_detection(now=161.0)
        # After decay -> IDLE, the detection transitions IDLE -> SUSPICIOUS.
        assert action == IGNORE
        assert t.state == SUSPICIOUS

    def test_confirming_decays_to_idle_after_window(self):
        t = CameraEscalation("cam-decay-conf")
        t.on_gated_detection(now=100.0)  # -> SUSPICIOUS
        t.on_gated_detection(now=101.0)  # -> CONFIRMING
        # 61s later (>60s window).
        t.on_gated_detection(now=162.0)
        assert t.state == SUSPICIOUS  # decayed to IDLE, then IDLE -> SUSPICIOUS

    def test_alert_decays_after_timeout(self):
        t = CameraEscalation("cam-decay-alert")
        t.on_gated_detection(now=100.0)
        t.on_gated_detection(now=101.0)
        t.on_gated_detection(now=102.0)
        t.on_gated_detection(now=103.0)  # -> ALERT
        # 31s later (>30s alert timeout), decay resets.
        action = t.on_gated_detection(now=134.0)
        assert action == IGNORE
        assert t.state == SUSPICIOUS


# --- Snapshot ---------------------------------------------------------


class TestSnapshot:
    """snapshot() returns a dict representation of the tracker state."""

    def test_idle_snapshot(self):
        t = CameraEscalation("cam-snap")
        snap = t.snapshot()
        assert snap["state"] == IDLE
        assert snap["camera_id"] == "cam-snap"
        assert "confirming_hits_required" in snap

    def test_alert_snapshot(self):
        t = CameraEscalation("cam-snap2")
        t.on_gated_detection(now=100.0)
        t.on_gated_detection(now=101.0)
        t.on_gated_detection(now=102.0)
        t.on_gated_detection(now=103.0)  # -> ALERT
        snap = t.snapshot()
        assert snap["state"] == ALERT
        assert snap["hits"] == 3


# --- tracker_for registry ---------------------------------------------


class TestTrackerFor:
    """tracker_for() returns consistent trackers and isolates cameras."""

    def test_same_id_returns_same_tracker(self):
        a = tracker_for("cam-registry-1")
        b = tracker_for("cam-registry-1")
        assert a is b

    def test_different_id_returns_different_tracker(self):
        a = tracker_for("cam-reg-a")
        b = tracker_for("cam-reg-b")
        assert a is not b
