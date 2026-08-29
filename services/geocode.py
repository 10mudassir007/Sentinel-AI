"""Reverse geocoding: exact coordinates -> human-readable location.

Uses geopy's Nominatim geocoder (OpenStreetMap) by default - free, no API
key. Override REVERSE_GEOCODE_URL with any Nominatim-compatible host.
"""

import logging
import threading
from urllib.parse import urlparse

from geopy.geocoders import Nominatim

from core.config import REVERSE_GEOCODE_URL

logger = logging.getLogger(__name__)

_TIMEOUT_S = 10.0
_CACHE_LIMIT = 1_000


def _make_geolocator() -> Nominatim:
    """Nominatim geocoder for the configured host (official geopy library)."""
    parts = urlparse(REVERSE_GEOCODE_URL)
    return Nominatim(
        user_agent="Sentinel-AI/1.0 (automated incident alerting)",
        domain=parts.netloc or "nominatim.openstreetmap.org",
        scheme=parts.scheme or "https",
        timeout=_TIMEOUT_S,
    )


_geolocator = _make_geolocator()

# Results are cached per rounded coordinate to avoid repeated calls for the
# same spot (Nominatim policy: identify the app, keep request volume low).
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

    location = _geolocator.reverse(
        (latitude, longitude), language="en", zoom=16, addressdetails=True
    )
    if location is None:
        raise ValueError(
            f"Reverse geocoding returned no result for {latitude}, {longitude}"
        )
    data = location.raw
    if not data.get("display_name"):
        raise ValueError(
            f"Reverse geocoding returned no result: {data.get('error', 'empty')}"
        )

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
