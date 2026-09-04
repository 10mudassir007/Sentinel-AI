"""Tests for core.security: CNIC normalization, Argon2 hashing, sessions, client IP."""

from unittest.mock import patch

import pytest

from core.security import (
    _hash_matches,
    client_ip,
    create_session,
    hash_cnic,
    normalize_cnic,
)

# --- normalize_cnic ---------------------------------------------------


class TestNormalizeCnic:
    """CNIC input must be normalized to 13 plain digits or rejected."""

    def test_dashed_format(self):
        assert normalize_cnic("42101-2345678-9") == "4210123456789"

    def test_plain_digits(self):
        assert normalize_cnic("4210123456789") == "4210123456789"

    def test_whitespace_stripped(self):
        assert normalize_cnic("  42101-2345678-9  ") == "4210123456789"

    def test_too_short(self):
        assert normalize_cnic("42101-234567-9") is None

    def test_too_long(self):
        assert normalize_cnic("42101-23456789-9") is None

    def test_letters_rejected(self):
        assert normalize_cnic("4210A-2345678-9") is None

    def test_empty_string(self):
        assert normalize_cnic("") is None

    def test_wrong_dash_count(self):
        assert normalize_cnic("42101-23456789") is None


# --- hash_cnic --------------------------------------------------------


class TestHashCnic:
    """hash_cnic must produce a valid Argon2id PHC string."""

    def test_hash_starts_with_argon2id(self):
        h = hash_cnic("42101-2345678-9")
        assert h.startswith("$argon2id$")

    def test_hash_verifies_against_original(self):
        cnic = "4210123456789"
        h = hash_cnic(cnic)
        assert _hash_matches(h, cnic)

    def test_hash_does_not_verify_wrong_cnic(self):
        h = hash_cnic("42101-2345678-9")
        assert not _hash_matches(h, "4210199999999")

    def test_invalid_cnic_raises(self):
        with pytest.raises(ValueError, match="Invalid CNIC"):
            hash_cnic("not-a-cnic")


# --- _hash_matches ----------------------------------------------------


class TestHashMatches:
    """Argon2 verification must handle bad hashes gracefully."""

    def test_garbage_hash_returns_false(self):
        assert not _hash_matches("not-a-hash", "4210123456789")

    def test_empty_hash_returns_false(self):
        assert not _hash_matches("", "4210123456789")


# --- create_session ---------------------------------------------------


class TestCreateSession:
    """Session creation must validate CNIC and mint a bearer token."""

    def _setup_authorized_cnic(self, cnic_digits: str = "4210123456789"):
        """Return a patched _AUTHORIZED_HASHES containing one known CNIC."""
        h = hash_cnic(cnic_digits)
        return h

    def test_valid_cnic_returns_token(self):
        cnic = "4210123456789"
        h = self._setup_authorized_cnic(cnic)
        with patch("core.security._AUTHORIZED_HASHES", (h,)):
            session = create_session(cnic)
        assert "access_token" in session
        assert session["token_type"] == "bearer"
        assert session["cnic"] == cnic

    def test_invalid_cnic_raises_422(self):
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc:
            create_session("not-valid")
        assert exc.value.status_code == 422

    def test_unauthorized_cnic_raises_401(self):
        from fastapi import HTTPException

        with patch("core.security._AUTHORIZED_HASHES", ()):
            with patch("core.security._NORMAL_USER_HASH", ""):
                with pytest.raises(HTTPException) as exc:
                    create_session("4210123456789")
        assert exc.value.status_code == 401


# --- client_ip --------------------------------------------------------


class TestClientIp:
    """Extract the best-effort client IP from an ASGI scope dict."""

    def _scope(self, client_ip="127.0.0.1", headers=None):
        return {
            "client": (client_ip, 8000),
            "headers": headers or [],
        }

    def test_direct_ip(self):
        assert client_ip(self._scope("192.168.1.5")) == "192.168.1.5"

    def test_ipv4_mapped_ipv6_normalized(self):
        assert client_ip(self._scope("::ffff:127.0.0.1")) == "127.0.0.1"

    def test_no_client_returns_unknown(self):
        assert client_ip({"headers": []}) == "unknown"

    def test_proxy_ignored_when_not_trusted(self):
        headers = [(b"x-forwarded-for", b"10.0.0.1")]
        # TRUSTED_PROXY is False in test env, so the header must be ignored.
        assert client_ip(self._scope("127.0.0.1", headers)) == "127.0.0.1"

    def test_proxy_trusted_when_enabled(self):
        headers = [(b"x-forwarded-for", b"10.0.0.1")]
        with patch("core.security.TRUSTED_PROXY", True):
            assert client_ip(self._scope("127.0.0.1", headers)) == "10.0.0.1"

    def test_proxy_multiple_forwarded_uses_first(self):
        headers = [(b"x-forwarded-for", b"10.0.0.1, 192.168.1.2")]
        with patch("core.security.TRUSTED_PROXY", True):
            assert client_ip(self._scope("127.0.0.1", headers)) == "10.0.0.1"

    def test_proxy_malformed_forwarded_ignored(self):
        headers = [(b"x-forwarded-for", b"not-an-ip")]
        with patch("core.security.TRUSTED_PROXY", True):
            # Malformed header value is ignored, falls back to socket IP.
            assert client_ip(self._scope("127.0.0.1", headers)) == "127.0.0.1"
