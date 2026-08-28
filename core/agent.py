from langchain.agents import create_agent
from core.llm import get_llm
from core.config import SYSTEM_PROMPT
from core.tools import call_ambulance, call_police, call_firebrigade

# ⚠ PRODUCTION — These tools now place REAL emergency calls over the
# Asterisk SIP trunk the moment the agent decides to. The SYSTEM_PROMPT
# treats vision output as untrusted data, but a human-in-loop approval gate
# (e.g. a /dispatch/approve endpoint) is strongly recommended before live
# deployment.

def get_incident_agent():
    return create_agent(
        model=get_llm(),
        tools=[call_ambulance, call_police, call_firebrigade],
        system_prompt=SYSTEM_PROMPT
    )
