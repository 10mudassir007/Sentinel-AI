"""JSON-file-backed store of analyzed incidents for the /incidents endpoints.

After /analyze-video detects incidents, a compact record is appended here
with status "new". Operators pull pending records from GET /incidents/latest
and mark them processed/notified via POST /incidents/{id}/pass.

Reads and writes are guarded by a lock and saved atomically (temp file +
rename), so concurrent requests - the analysis itself runs in worker
threads - never corrupt the file.
"""

import json
import logging
import os
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

from core.config import INCIDENTS_FILE

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_path = Path(INCIDENTS_FILE)

# Retention cap: at most this many records are kept; the oldest are pruned on
# write so the store cannot grow without bound (a warning is logged whenever
# pruning happens). Incidents beyond this cap are intentionally dropped.
_MAX_RECORDS = 5000


def _load() -> list[dict]:
    """Read all records; a missing or corrupt file starts empty (never crashes)."""
    try:
        records = json.loads(_path.read_text(encoding="utf-8"))
        if isinstance(records, list):
            return records
        logger.warning("Incident store %s is not a list, starting empty", _path)
    except FileNotFoundError:
        pass
    except (OSError, ValueError) as exc:
        logger.warning("Could not read incident store %s: %s", _path, exc)
    return []


def _save(records: list[dict]) -> None:
    """Write atomically so a crash never leaves a half-written JSON file."""
    if len(records) > _MAX_RECORDS:
        pruned = len(records) - _MAX_RECORDS
        records = records[-_MAX_RECORDS:]
        logger.warning(
            "Incident store exceeded %d records; pruned the %d oldest",
            _MAX_RECORDS,
            pruned,
        )
    _path.parent.mkdir(parents=True, exist_ok=True)
    tmp = _path.with_name(_path.name + ".tmp")
    try:
        tmp.write_text(json.dumps(records, indent=2), encoding="utf-8")
        os.replace(tmp, _path)
    finally:
        try:
            tmp.unlink(missing_ok=True)
        except OSError:
            pass


def add_incident(record: dict) -> dict:
    """Append one incident record, stamped with an id and status 'new'."""
    incident = {
        **record,
        "id": uuid.uuid4().hex,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "new",
    }
    with _lock:
        _save(_load() + [incident])
    return incident


def list_incidents(status: str | None = None, max_results: int = 0) -> list[dict]:
    """Return stored incidents (newest first), filtered by status when given.

    max_results caps the returned list (0 = no cap).
    """
    with _lock:
        records = _load()
    if status is not None:
        records = [r for r in records if r.get("status") == status]
    records.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    if max_results > 0:
        records = records[:max_results]
    return records


def set_status(incident_id: str, status: str) -> dict | None:
    """Change one incident's status; returns the updated record or None."""
    with _lock:
        records = _load()
        for record in records:
            if record.get("id") == incident_id:
                record["status"] = status
                _save(records)
                return record
    return None
