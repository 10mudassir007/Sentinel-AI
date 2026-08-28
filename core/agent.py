from langchain.agents import create_agent
from core.llm import get_llm
from core.config import SYSTEM_PROMPT
from core.tools import call_ambulance, call_police, call_firebrigade

# ⚠ PROTOTYPE — Tools are placeholders. Before wiring real emergency-dispatch
# services (Twilio, VAPI, etc.) a human-in-loop approval gate MUST be added.
# The SYSTEM_PROMPT treats LLM-generated video descriptions as untrusted data,
# but the final "call authorities" decision should never execute automatically.

def get_incident_agent():
    return create_agent(
        model=get_llm(),
        tools=[call_ambulance, call_police, call_firebrigade],
        system_prompt=SYSTEM_PROMPT
    )
