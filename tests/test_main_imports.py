"""The FastAPI app must import cleanly at startup.

Catches regressions where a route or service module imports a name that
does not exist (e.g. api/routes.py importing a helper never defined in
core/config). The unit tests never import the API layer, so without this
smoke test a broken import would go unnoticed until deploy.
"""

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[1]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))


def test_main_app_imports() -> None:
    """import main must succeed and wire up the documented routes."""
    import main

    assert main.app.title == "Sentinel AI API"
    # FastAPI nests include_router() entries, so assert on the public
    # OpenAPI schema rather than on app.routes internals.
    paths = set(main.app.openapi()["paths"])
    for expected in (
        "/health",
        "/login",
        "/analyze-video",
        "/incidents/latest",
        "/incidents/{incident_id}/pass",
        "/audio/{filename}",
    ):
        assert expected in paths
