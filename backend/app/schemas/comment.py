from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    is_internal: bool = False  # Only staff/admin can set this to True

class CommentResponse(BaseModel):
    id: int
    complaint_id: int
    author_id: Optional[int] = None
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    content: str
    is_internal: bool
    created_at: datetime

    class Config:
        from_attributes = True
