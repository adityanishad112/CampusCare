from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.attachment import AttachmentResponse
from app.schemas.comment import CommentResponse
from app.schemas.feedback import FeedbackResponse

class StatusHistoryResponse(BaseModel):
    id: int
    old_status: Optional[str] = None
    new_status: str
    action: str
    changed_by_name: Optional[str] = None
    changed_by_role: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    category: str = Field(..., min_length=2, max_length=100)
    location: str = Field(..., min_length=2, max_length=200)
    suggested_category: Optional[str] = None
    ai_confidence: Optional[float] = None
    priority: Optional[str] = Field("Medium", pattern="^(Low|Medium|High)$")
    priority_reason: Optional[str] = None

class ComplaintUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    location: Optional[str] = None

class StatusTransitionRequest(BaseModel):
    new_status: str = Field(..., pattern="^(Submitted|Assigned|In Progress|Resolved|Closed|Reopened)$")
    remarks: Optional[str] = Field(None, max_length=1000)
    resolution_notes: Optional[str] = None

class ReopenRequest(BaseModel):
    reopened_reason: str = Field(..., min_length=5, max_length=1000)

class ReassignRequest(BaseModel):
    department_id: Optional[int] = None
    assigned_staff_id: Optional[int] = None
    remarks: str = Field(..., min_length=3, max_length=500)

class AdminOverrideRequest(BaseModel):
    category: Optional[str] = None
    priority: Optional[str] = Field(None, pattern="^(Low|Medium|High)$")
    department_id: Optional[int] = None
    remarks: str = Field(..., min_length=3, max_length=500)

class DuplicateLinkResponse(BaseModel):
    id: int
    primary_complaint_id: int
    duplicate_complaint_id: int
    duplicate_tracking_number: Optional[str] = None
    duplicate_title: Optional[str] = None
    similarity_score: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintListItem(BaseModel):
    id: int
    tracking_number: str
    title: str
    category: str
    location: str
    priority: str
    status: str
    student_id: int
    student_name: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    assigned_staff_id: Optional[int] = None
    assigned_staff_name: Optional[str] = None
    ai_confidence: Optional[float] = None
    is_low_confidence: bool = False
    comments_count: int = 0
    attachments_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ComplaintDetail(ComplaintListItem):
    description: str
    suggested_category: Optional[str] = None
    priority_reason: Optional[str] = None
    resolution_notes: Optional[str] = None
    reopened_reason: Optional[str] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    attachments: List[AttachmentResponse] = []
    comments: List[CommentResponse] = []
    status_history: List[StatusHistoryResponse] = []
    feedback: Optional[FeedbackResponse] = None
    duplicates: List[DuplicateLinkResponse] = []

    class Config:
        from_attributes = True

class PaginatedComplaints(BaseModel):
    items: List[ComplaintListItem]
    total: int
    page: int
    size: int
    total_pages: int
