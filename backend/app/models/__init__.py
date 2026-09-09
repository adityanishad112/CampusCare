from app.core.database import Base
from app.models.department import Department
from app.models.user import User
from app.models.complaint import Complaint
from app.models.attachment import Attachment
from app.models.comment import Comment
from app.models.status_history import StatusHistory
from app.models.feedback import Feedback
from app.models.notification import Notification
from app.models.duplicate_link import DuplicateLink

__all__ = [
    "Base",
    "Department",
    "User",
    "Complaint",
    "Attachment",
    "Comment",
    "StatusHistory",
    "Feedback",
    "Notification",
    "DuplicateLink"
]
