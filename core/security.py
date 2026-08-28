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

from fastapi import Header, HTTPException
from fastapi.responses import JSONResponse

from core.config import AUTHORIZED_CNICS, TOKEN_TTL_HOURS, TRUSTED_PROXY

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


def _load_authorized_cnics() -> frozenset[str]:
    """Normalize the AUTHORIZED_CNICS env list; drop malformed entries."""
    authorized = set()
    for raw in AUTHORIZED_CNICS:
        cnic = normalize_cnic(raw)
        if cnic is None:
            logging.warning("Ignoring invalid CNIC in AUTHORIZED_CNICS: %r", raw)
        else:
            authorized.add(cnic)
    return frozenset(authorized)


# CNICs permitted to log in, normalized to 13 digits.
_AUTHORIZED_CNICS = _load_authorized_cnics()


# --- Session tokens ---------------------------------------------------

# digest (sha256 of token) -> (cnic, monotonic expiry)
_TOKENS: dict[str, tuple[str, float]] = {}
_TOKENS_LOCK = threading.Lock()


def _prune_expired(now: float) -> None:
    for digest in [d for d, (_, expires) in _TOKENS.items() if now > expires]:
        del _TOKENS[digest]


def create_session(raw_cnic: str) -> dict:
    """Validate a CNIC and mint a session token for it."""
    cnic = normalize_cnic(raw_cnic)
    if cnic is None:
        raise HTTPException(
            status_code=422,
            detail="Invalid CNIC, expected format 12345-1234567-1 (13 digits)",
        )
    if cnic not in _AUTHORIZED_CNICS:
        raise HTTPException(status_code=401, detail="CNIC is not authorized")

    token = secrets.token_urlsafe(32)
    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
    ttl = timedelta(hours=TOKEN_TTL_HOURS)
    now = time.monotonic()

    with _TOKENS_LOCK:
        _prune_expired(now)
        if len(_TOKENS) >= _MAX_ACTIVE_TOKENS:
            raise HTTPException(
                status_code=503, detail="Too many active sessions, try again later"
            )
        _TOKENS[digest] = (cnic, now + ttl.total_seconds())

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_at": (datetime.now(timezone.utc) + ttl).isoformat(),
        "cnic": cnic,
    }


def _valid_token(token: str) -> bool:
    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
    with _TOKENS_LOCK:
        entry = _TOKENS.get(digest)
        if entry is None:
            return False
        _, expires = entry
        if time.monotonic() > expires:
            del _TOKENS[digest]
            return False
        return True


def require_auth(authorization: str | None = Header(default=None)) -> None:
    """Require a valid Bearer token issued by POST /login."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    if not _valid_token(authorization.split(" ", 1)[1].strip()):
        raise HTTPException(status_code=401, detail="Missing or invalid token")


def _client_ip(scope: dict) -> str:
    """Best-effort client IP; X-Forwarded-For is only trusted behind a proxy."""
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

        ip = _client_ip(scope)
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
                response = JSONResponse(
                    {"detail": "File exceeds size limit"}, status_code=413
                )
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)
