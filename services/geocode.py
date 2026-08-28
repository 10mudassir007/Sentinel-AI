"""Reverse geocoding: exact coordinates -> human-readable location.

Uses Nominatim (OpenStreetMap) by default — free, no API key. Override the
endpoint with REVERSE_GEOCODE_URL if you prefer another provider.
"""

import logging
import threading

import httpx

from core.config import REVERSE_GEOCODE_URL

logger = logging.getLogger(__name__)

# Nominatim policy: identify the app and keep request volume low. Results are
# cached per rounded coordinate to avoid repeated calls for the same spot.
_HEADERS = {"User-Agent": "Sentinel-AI/1.0 (automated incident alerting)"}
_TIMEOUT_S = 10.0
_CACHE_LIMIT = 1_000

_cache: dict[tuple[float, float], dict] = {}
_cache_lock = threading.Lock()


def _compact_label(data: dict) -> str:
    """Shortest useful label: road + city, falling back to the full name."""
    address = data.get("address") or {}
    city = (
        address.get("city")
        or address.get("town")
        or address.get("village")
        or address.get("municipality")
        or ""
    )
    road = address.get("road") or address.get("pedestrian") or ""
    label = ", ".join(part for part in (road, city) if part)
    if label:
        return label
    return (data.get("display_name") or "")[:80]


def reverse_geocode(latitude: float, longitude: float) -> dict:
    """Resolve coordinates to a readable location.

    Returns latitude/longitude, the full display name, a compact label for
    voice scripts, and the address parts. Raises on geocoder failure so
    callers can decide how to degrade.
    """
    key = (round(latitude, 4), round(longitude, 4))
    with _cache_lock:
        cached = _cache.get(key)
        if cached is not None:
            return dict(cached)

    response = httpx.get(
        REVERSE_GEOCODE_URL,
        params={
            "lat": latitude,
            "lon": longitude,
            "format": "jsonv2",
            "zoom": 16,  # street level
            "addressdetails": 1,
            "accept-language": "en",
        },
        headers=_HEADERS,
        timeout=_TIMEOUT_S,
    )
    response.raise_for_status()
    data = response.json()
    if not data.get("display_name"):
        raise ValueError(f"Reverse geocoding returned no result: {data.get('error', 'empty')}")

    result = {
        "latitude": latitude,
        "longitude": longitude,
        "display_name": data["display_name"],
        "label": _compact_label(data),
        "road": (data.get("address") or {}).get("road", ""),
        "city": (
            (data.get("address") or {}).get("city")
            or (data.get("address") or {}).get("town")
            or (data.get("address") or {}).get("village")
            or ""
        ),
        "postcode": (data.get("address") or {}).get("postcode", ""),
    }

    with _cache_lock:
        if len(_cache) >= _CACHE_LIMIT:
            _cache.clear()
        _cache[key] = result
    return dict(result)
