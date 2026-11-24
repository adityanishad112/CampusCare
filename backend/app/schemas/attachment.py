from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_id: int
    filename: str
    original_name: str
    file_size: int
    content_type: str
    uploaded_by_id: Optional[int] = None
    created_at: datetime
    download_url: Optional[str] = None
    file_url: Optional[str] = None

