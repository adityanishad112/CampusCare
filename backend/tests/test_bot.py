import pytest
from app.services.bot_service import process_chat
from app.core.database import SessionLocal
from app.models.user import User

def test_bot_service_emergency():
    db = SessionLocal()
    try:
        res = process_chat("There is a fire emergency in lab 2", db=db)
        assert res.intent == "emergency"
        assert "🚨" in res.reply
        assert len(res.actions) > 0
    finally:
        db.close()

def test_bot_service_track_ticket():
    db = SessionLocal()
    try:
        res = process_chat("Track ticket CMP-2026-0001", db=db)
        assert res.intent == "track_ticket"
        assert "CMP-2026-0001" in res.reply
        assert len(res.actions) > 0
        assert res.actions[0].action_type == "VIEW_TICKET"
    finally:
        db.close()

def test_bot_service_diagnose_and_prefill():
    db = SessionLocal()
    try:
        res = process_chat("The Wi-Fi in hostel room 302 keeps disconnecting constantly", db=db)
        assert res.intent == "file_complaint_assistant"
        assert "IT and Wi-Fi" in res.reply
        assert any(act.action_type == "FILE_COMPLAINT" for act in res.actions)
    finally:
        db.close()

def test_bot_service_department_directory():
    db = SessionLocal()
    try:
        res = process_chat("Show me department contact directory", db=db)
        assert res.intent == "department_contacts"
        assert "Department Directory" in res.reply
    finally:
        db.close()

def test_bot_service_sla_policy():
    db = SessionLocal()
    try:
        res = process_chat("What is the resolution SLA and timeline?", db=db)
        assert res.intent == "sla_policy"
        assert "Service Level Agreement" in res.reply
    finally:
        db.close()

def test_bot_service_my_tickets_authenticated():
    db = SessionLocal()
    try:
        student = db.query(User).filter(User.email == "alex.student@campuscare.edu").first()
        assert student is not None
        res = process_chat("Show my complaints", db=db, current_user=student)
        assert res.intent in ["my_tickets", "my_tickets_empty"]
    finally:
        db.close()
