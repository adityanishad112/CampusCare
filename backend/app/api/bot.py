from app.core.database import get_db
from app.core.dependencies import get_optional_current_user
from app.models.user import User
from app.schemas.bot import ChatRequest, ChatResponse
from app.services.bot_service import process_chat
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/bot", tags=["AI Assistant Bot"])

@router.post("/chat", response_model=ChatResponse)
@router.post("/chat/", response_model=ChatResponse, include_in_schema=False)
def chat_with_bot(
    request: ChatRequest,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Instant AI Helpdesk Bot for students, staff, and campus visitors.
    Provides ticket tracking, issue pre-classification, SLA guidance,
    emergency protocol, and 1-click complaint pre-filling.
    """
    response = process_chat(
        message=request.message,
        db=db,
        current_user=current_user,
        history=request.history
    )
    return response

@router.get("/quick-prompts")
@router.get("/quick-prompts/", include_in_schema=False)
def get_quick_prompts():
    """
    Returns preset quick-reply prompts to assist users instantly.
    """
    return {
        "prompts": [
            {"label": "🔍 Track Ticket Status", "query": "Track ticket CMP-2026-0001", "category": "tracking"},
            {"label": "⚡ Report Wi-Fi Issue", "query": "Wi-Fi is disconnected in my hostel room", "category": "report"},
            {"label": "💧 Water Leakage / Plumbing", "query": "Water pipe leaking in washroom", "category": "report"},
            {"label": "🚨 Emergency Numbers", "query": "Campus emergency contacts", "category": "emergency"},
            {"label": "📋 My Active Tickets", "query": "Show my complaints", "category": "my_tickets"},
            {"label": "⏱️ Resolution SLA Rules", "query": "What is the resolution SLA and timeline?", "category": "info"},
            {"label": "🏛️ Department Emails", "query": "Contact directory for departments", "category": "directory"}
        ]
    }

@router.get("/status")
@router.get("/status/", include_in_schema=False)
def bot_status():
    return {
        "status": "online",
        "service": "CampusCare AI Helpdesk Assistant",
        "features": [
            "NLP Category Classification (TF-IDF + Multinomial Logistic Regression)",
            "Heuristic Priority & Safety Evaluation",
            "Real-time Ticket Tracking via CMP Number",
            "Contextual User Complaint Lookup",
            "Emergency Escalation Protocols"
        ]
    }
