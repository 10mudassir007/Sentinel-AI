from langchain_groq import ChatGroq
from core.config import GROQ_API_KEY

def get_llm():
    return ChatGroq(
        model="qwen/qwen3.8-27b",
        api_key=GROQ_API_KEY
    )

def get_vision_llm():
    return ChatGroq(
        model="qwen/qwen3.8-27b",
        api_key=GROQ_API_KEY
    )