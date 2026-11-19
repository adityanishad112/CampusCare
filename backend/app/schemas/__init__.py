from app.schemas.auth import (
    Token, TokenPayload, LoginRequest, RegisterRequest, UserResponse, UserCreateAdmin, UserUpdate
)
from app.schemas.department import (
    DepartmentCreate, DepartmentUpdate, DepartmentResponse
)
from app.schemas.complaint import (
    ComplaintCreate, ComplaintUpdate, ComplaintListItem, ComplaintDetail,
    StatusTransitionRequest, ReopenRequest, ReassignRequest, AdminOverrideRequest,
    PaginatedComplaints, StatusHistoryResponse, DuplicateLinkResponse
)
from app.schemas.comment import CommentCreate, CommentResponse
from app.schemas.attachment import AttachmentResponse
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.schemas.notification import NotificationResponse
from app.schemas.ml import (
    PredictCategoryRequest, PredictCategoryResponse,
    PrioritySuggestionResponse, DuplicateSuggestionResponse, LinkDuplicateRequest
)
from app.schemas.analytics import AnalyticsSummary, CountByLabel, WeeklyTrendPoint, DepartmentWorkload

__all__ = [
    "Token", "TokenPayload", "LoginRequest", "RegisterRequest", "UserResponse", "UserCreateAdmin", "UserUpdate",
    "DepartmentCreate", "DepartmentUpdate", "DepartmentResponse",
    "ComplaintCreate", "ComplaintUpdate", "ComplaintListItem", "ComplaintDetail",
    "StatusTransitionRequest", "ReopenRequest", "ReassignRequest", "AdminOverrideRequest",
    "PaginatedComplaints", "StatusHistoryResponse", "DuplicateLinkResponse",
    "CommentCreate", "CommentResponse",
    "AttachmentResponse",
    "FeedbackCreate", "FeedbackResponse",
    "NotificationResponse",
    "PredictCategoryRequest", "PredictCategoryResponse",
    "PrioritySuggestionResponse", "DuplicateSuggestionResponse", "LinkDuplicateRequest",
    "AnalyticsSummary", "CountByLabel", "WeeklyTrendPoint", "DepartmentWorkload"
]
