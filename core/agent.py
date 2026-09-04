import threading

from langchain.agents import create_agent

from core.config import SYSTEM_PROMPT
from core.llm import get_llm
from core.tools import call_ambulance, call_firebrigade, call_police

# These tools place real emergency calls over the Asterisk SIP trunk.

_agent_lock = threading.Lock()
_agent = None


def get_incident_agent():
    """Return a cached incident agent (thread-safe lazy init).

    The agent is stateless - it has no memory - so a single instance is
    safe to invoke from any thread. LangGraph & LangChain tool nodes are
    designed for concurrent use.
    """
    global _agent
    if _agent is None:
        with _agent_lock:
            if _agent is None:
                _agent = create_agent(
                    model=get_llm(),
                    tools=[call_ambulance, call_police, call_firebrigade],
                    system_prompt=SYSTEM_PROMPT,
                )
    return _agent
