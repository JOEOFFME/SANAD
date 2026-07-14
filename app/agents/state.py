from typing import TypedDict, Optional

class AgentState(TypedDict):
    query: str
    asset_id: Optional[str]
    context: Optional[str]
    answer: Optional[str]
