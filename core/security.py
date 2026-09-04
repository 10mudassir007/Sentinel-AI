"""Security helpers: CNIC-based session tokens, request-size guard, and rate limiting."""

import asyncio
import hashlib
import ipaddress
import logging
import re
import secrets
import threading
import time
from collections import deque
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from fastapi import Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import AUTHORIZED_CNICS, NORMAL_USER_CNIC, TOKEN_TTL_HOURS, TRUSTED_PROXY

logger = logging.getLogger(__name__)

_bearer_scheme = HTTPBearer(auto_error=False)

# Max unique client IPs tracked before pruning idle entries.
_MAX_TRACKED_IPS = 10_000

# Max active sessions before new logins are refused.
_MAX_ACTIVE_TOKENS = 10_000

# --- CNIC validation -------------------------------------------------

_CNIC_DASHED_RE = re.compile(r"^\d{5}-\d{7}-\d{1}$")
_CNIC_DIGITS_RE = re.compile(r"^\d{13}$")


def normalize_cnic(raw: str) -> str | None:
    """Return the CNIC as 13 plain digits, or None if the format is invalid."""
    value = raw.strip()
    if _CNIC_DASHED_RE.match(value):
        return value.replace("-", "")
    if _CNIC_DIGITS_RE.match(value):
        return value
    return None


# --- CNIC authorization (Argon2id) ------------------------------------

# Argon2id parameters. tools/hash_cnic.py reuses these, so hashes generated
# by the script always verify against the running app.
_ARGON2_TIME_COST = 4
_ARGON2_MEMORY_COST = 64 * 1024  # KiB == 64 MiB
_ARGON2_PARALLELISM = 4

_hasher = PasswordHasher(
    time_cost=_ARGON2_TIME_COST,
    memory_cost=_ARGON2_MEMORY_COST,
    parallelism=_ARGON2_PARALLELISM,
)


def hash_cnic(cnic: str) -> str:
    """Return an Argon2id PHC hash of a CNIC (format-validated)."""
    normalized = normalize_cnic(cnic)
    if normalized is None:
        raise ValueError("Invalid CNIC, expected format 12345-1234567-1 (13 digits)")
    return _hasher.hash(normalized)


def _load_authorized_hashes() -> tuple[str, ...]:
    """Collect AUTHORIZED_CNICS entries; warn and drop non-Argon2 values.

    Each entry must be an Argon2id PHC string (see tools/hash_cnic.py).
    """
    hashes = []
    for raw in AUTHORIZED_CNICS:
        if not raw.startswith("$argon2"):
            logging.warning("Ignoring a non-Argon2 AUTHORIZED_CNICS entry (value redacted)")
        else:
            hashes.append(raw)
    return tuple(hashes)


# Argon2id hashes of CNICs permitted to log in (never plaintext CNICs).
_AUTHORIZED_HASHES = _load_authorized_hashes()

# Optional Argon2id hash of the normal-user CNIC; empty disables the "user" role.
_NORMAL_USER_HASH = ""
if NORMAL_USER_CNIC:
    if NORMAL_USER_CNIC.startswith("$argon2"):
        _NORMAL_USER_HASH = NORMAL_USER_CNIC
    else:
        logging.warning("Ignoring a non-Argon2 NORMAL_USER_CNIC value (redacted)")


def _hash_matches(stored: str, cnic: str) -> bool:
    """True if the Argon2 hash verifies for this (normalized) CNIC."""
    try:
        return _hasher.verify(stored, cnic)
    except (VerifyMismatchError, InvalidHashError, VerificationError):
        return False


def _cnic_role(cnic: str) -> str | None:
    """Role of a CNIC: "authoritative" for AUTHORIZED_CNICS entries, "user"
    for NORMAL_USER_CNIC, or None if not permitted to log in.

    AUTHORIZED_CNICS wins when the same CNIC is listed in both.
    """
    for stored in _AUTHORIZED_HASHES:
        if _hash_matches(stored, cnic):
            return "authoritative"
    if _NORMAL_USER_HASH and _hash_matches(_NORMAL_USER_HASH, cnic):
        return "user"
    return None


# --- Session tokens ---------------------------------------------------

# digest (sha256 of token) -> (cnic, role, monotonic expiry)
_TOKENS: dict[str, tuple[str, str, float]] = {}
_TOKENS_LOCK = threading.Lock()


def _prune_expired(now: float) -> None:
    for digest in [d for d, (_, _, expires) in _TOKENS.items() if now > expires]:
        del _TOKENS[digest]


def create_session(raw_cnic: str) -> dict:
    """Validate a CNIC and mint a session token for it."""
    cnic = normalize_cnic(raw_cnic)
    if cnic is None:
        raise HTTPException(
            status_code=422,
            detail="Invalid CNIC, expected format 12345-1234567-1 (13 digits)",
        )
    role = _cnic_role(cnic)
    if role is None:
        raise HTTPException(status_code=401, detail="CNIC is not authorized")

    token = secrets.token_urlsafe(32)
    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
    ttl = timedelta(hours=TOKEN_TTL_HOURS)
    now = time.monotonic()

    with _TOKENS_LOCK:
        _prune_expired(now)
        if len(_TOKENS) >= _MAX_ACTIVE_TOKENS:
            raise HTTPException(status_code=503, detail="Too many active sessions, try again later")
        _TOKENS[digest] = (cnic, role, now + ttl.total_seconds())

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_at": (datetime.now(timezone.utc) + ttl).isoformat(),
        "cnic": cnic,
        "user_type": role,
    }


def _valid_token(token: str) -> tuple[str, str] | None:
    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
    with _TOKENS_LOCK:
        entry = _TOKENS.get(digest)
        if entry is None:
            return None
        cnic, role, expires = entry
        if time.monotonic() > expires:
            del _TOKENS[digest]
            return None
        return (cnic, role)


def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> tuple[str, str]:
    """Require a valid Bearer token; returns (cnic, role)."""
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    result = _valid_token(credentials.credentials)
    if result is None:
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    return result


def require_role(required_role: str):
    """Dependency factory: require a valid token AND a specific role.

    Usage:
        _: None = Depends(require_role("authoritative"))
    """

    def _check(auth: tuple[str, str] = Depends(require_auth)) -> None:
        _, role = auth
        if role != required_role:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

    return _check


def client_ip(scope: dict) -> str:
    """Best-effort client IP; X-Forwarded-For is only trusted behind a proxy.

    Used by the rate limiter and by the per-source processing queue so both
    agree on who the client is, including when deployed behind a proxy.
    """
    client = scope.get("client")
    ip = client[0] if client else "unknown"

    if TRUSTED_PROXY:
        headers = {
            key.decode("latin-1").lower(): value.decode("latin-1")
            for key, value in scope.get("headers") or []
        }
        forwarded = headers.get("x-forwarded-for", "")
        first = forwarded.split(",")[0].strip() if forwarded else ""
        if first:
            try:
                ipaddress.ip_address(first)
            except ValueError:
                # A malformed header is ignored rather than trusted; otherwise
                # a misconfigured proxy could be abused to forge client IPs.
                logger.warning("Ignoring invalid X-Forwarded-For value (malformed IP)")
                first = ""
        if first:
            ip = first

    try:
        addr = ipaddress.ip_address(ip)
        # Normalize IPv4-mapped IPv6 (::ffff:127.0.0.1 -> 127.0.0.1).
        if isinstance(addr, ipaddress.IPv6Address) and addr.ipv4_mapped:
            addr = addr.ipv4_mapped
        return str(addr)
    except ValueError:
        return ip


class RateLimitMiddleware:
    """Sliding-window rate limiter keyed by client IP."""

    def __init__(self, app, max_requests: int = 30, window_seconds: int = 60):
        self.app = app
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = {}
        self._lock = asyncio.Lock()

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Do not count preflight checks or health probes against the quota.
        if scope.get("method") == "OPTIONS" or scope.get("path") == "/health":
            await self.app(scope, receive, send)
            return

        ip = client_ip(scope)
        now = time.monotonic()

        async with self._lock:
            hits = self._hits.get(ip)
            if hits is None:
                hits = deque()
                self._hits[ip] = hits

            while hits and now - hits[0] > self.window_seconds:
                hits.popleft()

            limited = len(hits) >= self.max_requests
            if not limited:
                hits.append(now)

            # Prune entries idle beyond a grace period to keep memory bounded.
            if len(self._hits) > _MAX_TRACKED_IPS:
                grace = self.window_seconds * 2
                self._hits = {
                    key: value
                    for key, value in self._hits.items()
                    if value and now - value[-1] <= grace
                }

        if limited:
            response = JSONResponse(
                {"detail": "Rate limit exceeded, try again later"}, status_code=429
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)


class SecurityHeadersMiddleware:
    """Add standard security headers to every HTTP response."""

    _HEADERS = (
        (b"x-content-type-options", b"nosniff"),
        (b"x-frame-options", b"DENY"),
        (b"referrer-policy", b"no-referrer"),
        (b"cache-control", b"no-store"),
    )

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.extend(self._HEADERS)
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_with_headers)


class MaxUploadSizeMiddleware:
    """Reject oversized bodies before FastAPI parses them into temp files.

    Content-Length covers the whole multipart body, so allow a small overhead
    on top of the raw file limit enforced by the endpoint.
    """

    def __init__(self, app, max_size: int, overhead: int = 1024 * 1024):
        self.app = app
        self.max_size = max_size
        self.overhead = overhead

    async def __call__(self, scope, receive, send):
        # Only the upload endpoint carries a body; OPTIONS preflights must pass.
        if (
            scope["type"] == "http"
            and scope.get("method") == "POST"
            and scope.get("path") == "/analyze-video"
        ):
            headers = {
                key.decode("latin-1").lower(): value.decode("latin-1")
                for key, value in scope.get("headers") or []
            }
            content_length = headers.get("content-length")
            if content_length is None:
                response = JSONResponse(
                    {"detail": "Content-Length header required"}, status_code=411
                )
                await response(scope, receive, send)
                return
            try:
                size = int(content_length)
            except ValueError:
                size = -1
            if size > self.max_size + self.overhead:
                response = JSONResponse({"detail": "File exceeds size limit"}, status_code=413)
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)
