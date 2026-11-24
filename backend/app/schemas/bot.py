from typing import Any

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str
    timestamp: str | None = None

class ChatAction(BaseModel):
    action_type: str = Field(..., description="'VIEW_TICKET', 'FILE_COMPLAINT', 'NAVIGATE', 'QUICK_REPLY', 'CALL'")
    label: str
    payload: dict[str, Any] = {}

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: list[ChatMessage] | None = []
    context: dict[str, Any] | None = None

class ChatResponse(BaseModel):
    reply: str
    intent: str
    actions: list[ChatAction] = []
    suggested_replies: list[str] = []
    data: dict[str, Any] | None = None
