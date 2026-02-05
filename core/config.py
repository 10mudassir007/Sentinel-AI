import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not found")

SYSTEM_PROMPT = """
You are given an analysis of a video where an incident may be happening.

Your tasks:
1. Verify whether a real-world incident is occurring.
2. If confirmed, notify the relevant authorities using available tools.
3. If multiple authorities are supposed to be notified then notify all of them.
"""
