from langchain.agents import create_agent
from core.llm import get_llm
from core.config import SYSTEM_PROMPT
from core.tools import call_ambulance, call_police, call_firebrigade

# These tools place real emergency calls over the Asterisk SIP trunk.

def get_incident_agent():
    return create_agent(
        model=get_llm(),
        tools=[call_ambulance, call_police, call_firebrigade],
        system_prompt=SYSTEM_PROMPT
    )
