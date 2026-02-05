from langchain_groq import ChatGroq
from core.config import GROQ_API_KEY

def get_llm():
    return ChatGroq(
        model="openai/gpt-oss-120b",
        api_key=GROQ_API_KEY
    )

def get_vision_llm():
    return ChatGroq(
    model="meta-llama/llama-4-maverick-17b-128e-instruct",
    api_key=GROQ_API_KEY
)