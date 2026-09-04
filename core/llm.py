import logging

from langchain_groq import ChatGroq

from core.config import GOOGLE_API_KEY, GROQ_API_KEY

logger = logging.getLogger(__name__)


def _make_gemini():
    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model="gemini-3.5-flash-lite",
        google_api_key=GOOGLE_API_KEY,
    )


def _make_groq():
    return ChatGroq(
        model="qwen/qwen3.8-27b",
        api_key=GROQ_API_KEY,
    )


def _build_llm():
    if not GOOGLE_API_KEY:
        logger.warning("GOOGLE_API_KEY not set, using Groq fallback")
        return _make_groq()
    return _make_gemini().with_fallbacks([_make_groq()])


def get_llm():
    return _build_llm()


def get_vision_llm():
    return _build_llm()
