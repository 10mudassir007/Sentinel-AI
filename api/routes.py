import logging
import os
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from core.config import DESCRIPTION_LANGUAGES, MAX_UPLOAD_SIZE, SUPPORTED_DESCRIPTION_LANGUAGES
from core.security import create_session, require_auth
from services.video_service import analyze_video

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_EXTENSIONS = (".mp4", ".avi", ".mov")
_CHUNK_SIZE = 1024 * 1024


class LoginRequest(BaseModel):
    cnic: str


@router.post("/login")
async def login_endpoint(request: LoginRequest) -> dict:
    """Exchange a valid CNIC for a bearer token used on every other endpoint."""
    return create_session(request.cnic)


def _parse_language_param(raw: str) -> list[str]:
    """Parse the client-supplied language list; empty falls back to the server default."""
    codes = [code.strip().lower() for code in raw.split(",") if code.strip()]
    if codes and any(code not in SUPPORTED_DESCRIPTION_LANGUAGES for code in codes):
        raise HTTPException(
            status_code=422,
            detail="language must be one of: "
            + ", ".join(SUPPORTED_DESCRIPTION_LANGUAGES),
        )
    return codes or list(DESCRIPTION_LANGUAGES)


def _has_supported_extension(filename: str | None) -> bool:
    return bool(filename and filename.lower().endswith(ALLOWED_EXTENSIONS))


def _has_video_magic_bytes(file: UploadFile) -> bool:
    """Reject files whose content is not actually MP4/MOV or AVI."""
    try:
        file.file.seek(0)
        header = file.file.read(16)
        file.file.seek(0)
    except (OSError, ValueError):
        return False

    if len(header) < 12:
        return False
    if header[4:8] == b"ftyp":  # MP4 / MOV (ISO Base Media)
        return True
    if header[0:4] == b"RIFF" and header[8:12] == b"AVI ":  # AVI
        return True
    return False


@router.post("/analyze-video")
async def analyze_video_endpoint(
    file: UploadFile = File(...),
    language: str = Form(""),
    _: None = Depends(require_auth),
):
    if not _has_supported_extension(file.filename):
        raise HTTPException(status_code=400, detail="Unsupported video format")

    if not _has_video_magic_bytes(file):
        raise HTTPException(
            status_code=400,
            detail="File content does not match a supported video format",
        )

    languages = _parse_language_param(language)

    tmp_path = None
    try:
        with NamedTemporaryFile(
            delete=False, suffix=os.path.splitext(file.filename or "")[1] or ".mp4"
        ) as tmp:
            tmp_path = tmp.name
            copied = 0
            while chunk := file.file.read(_CHUNK_SIZE):
                copied += len(chunk)
                if copied > MAX_UPLOAD_SIZE:
                    raise HTTPException(status_code=413, detail="File exceeds size limit")
                tmp.write(chunk)

        video_analysis, agent_answer = await run_in_threadpool(
            analyze_video, tmp_path, languages=languages
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Video analysis failed")
        raise HTTPException(status_code=500, detail="Internal server error during analysis")
    finally:
        if tmp_path:
            try:
                os.remove(tmp_path)
            except OSError:
                logger.warning("Could not remove temporary file %s", tmp_path)

    return {
        "filename": file.filename,
        "incidents_detected": len(video_analysis.get("incidents", [])),
        "video_analysis": video_analysis,
        "agent_response": agent_answer,
    }
