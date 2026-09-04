"""Tests for services.incident_store: atomic JSON-file incident persistence."""

import json
from pathlib import Path
from unittest.mock import patch

import pytest


@pytest.fixture()
def store(tmp_path):
    """Return an incident_store bound to a temp file (fresh per test)."""
    db_path = tmp_path / "incidents.json"
    with patch("services.incident_store.INCIDENTS_FILE", str(db_path)):
        import services.incident_store as mod

        mod._path = Path(str(db_path))
        yield mod


class TestAddIncident:
    """add_incident must append records with auto-generated id, timestamp, status."""

    def test_add_returns_id_and_new_status(self, store):
        record = {"display_name": "Test Place", "llm_desc": "Something happened"}
        incident = store.add_incident(record)
        assert "id" in incident
        assert incident["status"] == "new"
        assert incident["display_name"] == "Test Place"
        assert "created_at" in incident

    def test_add_multiple_records(self, store):
        store.add_incident({"display_name": "A"})
        store.add_incident({"display_name": "B"})
        records = store.list_incidents()
        assert len(records) == 2

    def test_add_does_not_corrupt_file(self, store):
        store.add_incident({"display_name": "X"})
        raw = json.loads(store._path.read_text())
        assert isinstance(raw, list)
        assert len(raw) == 1


class TestListIncidents:
    """list_incidents must return newest first, with optional status filter."""

    def test_empty_store_returns_empty_list(self, store):
        assert store.list_incidents() == []

    def test_newest_first_ordering(self, store):
        store.add_incident({"display_name": "A"})
        store.add_incident({"display_name": "B"})
        records = store.list_incidents()
        assert records[0]["display_name"] == "B"
        assert records[1]["display_name"] == "A"

    def test_filter_by_status(self, store):
        store.add_incident({"display_name": "A"})
        b = store.add_incident({"display_name": "B"})
        store.set_status(b["id"], "false")
        new_records = store.list_incidents(status="new")
        assert len(new_records) == 1
        assert new_records[0]["display_name"] == "A"


class TestSetStatus:
    """set_status must update an existing record or return None."""

    def test_change_status(self, store):
        incident = store.add_incident({"display_name": "X"})
        updated = store.set_status(incident["id"], "false")
        assert updated is not None
        assert updated["status"] == "false"

    def test_unknown_id_returns_none(self, store):
        result = store.set_status("nonexistent-id", "false")
        assert result is None

    def test_set_status_persists_to_file(self, store):
        incident = store.add_incident({"display_name": "X"})
        store.set_status(incident["id"], "handled")
        records = store.list_incidents()
        assert records[0]["status"] == "handled"


class TestCorruptFileHandling:
    """A corrupted incidents file must start empty, never crash."""

    def test_garbage_file_starts_empty(self, store):
        store._path.write_text("not valid json!!!")
        records = store.list_incidents()
        assert records == []

    def test_non_list_file_starts_empty(self, store):
        store._path.write_text('{"not": "a list"}')
        records = store.list_incidents()
        assert records == []
