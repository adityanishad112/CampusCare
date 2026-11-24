from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = Field(None, max_length=1000)

class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_id: int
    student_id: int
    student_name: Optional[str] = None
    rating: int
    comments: Optional[str] = None
    created_at: datetime

