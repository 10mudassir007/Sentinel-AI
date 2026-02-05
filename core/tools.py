from langchain.tools import tool

@tool
def call_ambulance(incident: str) -> str:
    """ Call an ambulance.
    
    Args:
        incident: Analysis of what happened
    """

    return f"Calling Ambulance"

@tool
def call_police(incident: str) -> str:
    """ Call police.
    
    Args:
        incident: Analysis of what happened
    """

    return f"Calling Police"

@tool
def call_firebrigade(incident: str) -> str:
    """ Call fire brigade.
    
    Args:
        incident: Analysis of what happened
    """

    return f"Calling Fire Brigade"


### THESE FUNCTIONS ARE JUST PLACEHOLDERS, THE REAL THING WOULD BE USING TWILO OR VAPI LIKE SERVICES TO DIRECTLY CALL THE RELEVANT AUTHORITIES OR EVEN BETTER #   DIRECTLY NOTIFY THE RELEVANT AUTHORITIES