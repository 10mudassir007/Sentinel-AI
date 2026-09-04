"""Tests for services.geocode: reverse geocoding with mocked Nominatim."""

from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture()
def geocode():
    """Import geocode module with a fresh cache for each test."""
    import services.geocode as mod

    mod._cache.clear()
    return mod


class TestCompactLabel:
    """_compact_label must produce the shortest useful location string."""

    def test_road_and_city(self, geocode):
        data = {"address": {"road": "Main Street", "city": "Lahore"}}
        assert geocode._compact_label(data) == "Main Street, Lahore"

    def test_road_only(self, geocode):
        data = {"address": {"road": "GT Road"}}
        assert geocode._compact_label(data) == "GT Road"

    def test_city_only(self, geocode):
        data = {"address": {"city": "Karachi"}}
        assert geocode._compact_label(data) == "Karachi"

    def test_town_fallback(self, geocode):
        data = {"address": {"town": "Muridke"}}
        assert geocode._compact_label(data) == "Muridke"

    def test_empty_address_uses_display_name(self, geocode):
        data = {"address": {}, "display_name": "Somewhere, Pakistan"}
        assert geocode._compact_label(data) == "Somewhere, Pakistan"

    def test_display_name_truncated(self, geocode):
        long_name = "A" * 200
        data = {"address": {}, "display_name": long_name}
        assert len(geocode._compact_label(data)) == 80

    def test_no_address_no_display_name(self, geocode):
        data = {}
        assert geocode._compact_label(data) == ""


class TestReverseGeocode:
    """reverse_geocode must resolve coordinates via the mocked Nominatim."""

    def _mock_location(self, display_name, address=None):
        """Build a mock geopy Location with the expected .raw dict."""
        loc = MagicMock()
        loc.raw = {
            "display_name": display_name,
            "address": address or {},
        }
        return loc

    def test_successful_geocode(self, geocode):
        loc = self._mock_location(
            "Gulberg III, Lahore, Punjab, Pakistan",
            {"road": "MM Alam Road", "city": "Lahore"},
        )
        with patch.object(geocode._geolocator, "reverse", return_value=loc):
            result = geocode.reverse_geocode(31.5204, 74.3587)
        assert result["latitude"] == 31.5204
        assert result["longitude"] == 74.3587
        assert "Gulberg" in result["display_name"]
        assert result["label"] == "MM Alam Road, Lahore"
        assert result["road"] == "MM Alam Road"
        assert result["city"] == "Lahore"

    def test_none_result_raises(self, geocode):
        with patch.object(geocode._geolocator, "reverse", return_value=None):
            with pytest.raises(ValueError, match="no result"):
                geocode.reverse_geocode(0.0, 0.0)

    def test_empty_display_name_raises(self, geocode):
        loc = self._mock_location("", {})
        with patch.object(geocode._geolocator, "reverse", return_value=loc):
            with pytest.raises(ValueError, match="no result"):
                geocode.reverse_geocode(0.0, 0.0)

    def test_results_are_cached(self, geocode):
        loc = self._mock_location("Cached Place", {"city": "Islamabad"})
        with patch.object(geocode._geolocator, "reverse", return_value=loc) as mock_rev:
            first = geocode.reverse_geocode(33.6844, 73.0479)
            second = geocode.reverse_geocode(33.6844, 73.0479)
        assert mock_rev.call_count == 1
        assert first == second

    def test_different_coordinates_separate_calls(self, geocode):
        loc_a = self._mock_location("Place A", {"city": "Lahore"})
        loc_b = self._mock_location("Place B", {"city": "Karachi"})
        with patch.object(geocode._geolocator, "reverse", side_effect=[loc_a, loc_b]):
            a = geocode.reverse_geocode(31.5, 74.3)
            b = geocode.reverse_geocode(24.8, 67.0)
        assert a["city"] == "Lahore"
        assert b["city"] == "Karachi"
