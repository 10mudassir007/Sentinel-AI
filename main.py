import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from core.config import CORS_ORIGINS, MAX_UPLOAD_SIZE, RATE_LIMIT_PER_MINUTE
from core.security import MaxUploadSizeMiddleware, RateLimitMiddleware, SecurityHeadersMiddleware

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Sentinel AI API")

if RATE_LIMIT_PER_MINUTE > 0:
    app.add_middleware(
        RateLimitMiddleware,
        max_requests=RATE_LIMIT_PER_MINUTE,
        window_seconds=60,
    )

app.add_middleware(
    MaxUploadSizeMiddleware,
    max_size=MAX_UPLOAD_SIZE,
)

# Security headers must sit outside MaxUploadSize/RateLimit so that even their
# error responses (411/413/429) carry the headers.
app.add_middleware(SecurityHeadersMiddleware)

# CORS is added last so it is outermost: every response also gets CORS headers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    # Wildcard origins cannot be combined with credentials.
    allow_credentials="*" not in CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
