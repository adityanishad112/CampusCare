import os
import uuid
import math
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Header
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.security import decode_access_token
from app.models.user import User
from app.models.department import Department
from app.models.complaint import Complaint
from app.models.attachment import Attachment
from app.models.comment import Comment
from app.models.status_history import StatusHistory
from app.models.feedback import Feedback
from app.models.notification import Notification
from app.models.duplicate_link import DuplicateLink
from app.schemas.complaint import (
    ComplaintCreate, ComplaintListItem, ComplaintDetail, PaginatedComplaints,
    StatusTransitionRequest, ReopenRequest, ReassignRequest, AdminOverrideRequest,
    StatusHistoryResponse, DuplicateLinkResponse
)
from app.schemas.attachment import AttachmentResponse
from app.schemas.comment import CommentCreate, CommentResponse
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.schemas.ml import DuplicateSuggestionResponse, DuplicateSuggestionItem, LinkDuplicateRequest
from app.services.workflow_engine import validate_and_apply_transition, resolve_department_for_category
from app.services.duplicate_detector import find_potential_duplicates, link_duplicate_complaints

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def generate_tracking_number(db: Session) -> str:
    year = datetime.now().year
    count = db.query(Complaint).count() + 1
    return f"CMP-{year}-{count:04d}"

def map_complaint_to_list_item(c: Complaint) -> ComplaintListItem:
    return ComplaintListItem(
        id=c.id,
        tracking_number=c.tracking_number,
        title=c.title,
        category=c.category,
        location=c.location,
        priority=c.priority,
        status=c.status,
        student_id=c.student_id,
        student_name=c.student.full_name if c.student else "Student",
        department_id=c.department_id,
        department_name=c.department.name if c.department else "Unassigned / Admin Review",
        assigned_staff_id=c.assigned_staff_id,
        assigned_staff_name=c.assigned_staff.full_name if c.assigned_staff else None,
        ai_confidence=c.ai_confidence,
        is_low_confidence=c.is_low_confidence,
        comments_count=len(c.comments),
        attachments_count=len(c.attachments),
        created_at=c.created_at,
        updated_at=c.updated_at
    )

@router.post("/", response_model=ComplaintDetail, status_code=status.HTTP_201_CREATED)
def submit_complaint(
    request: ComplaintCreate,
    current_user: User = Depends(require_role("student", "admin")),
    db: Session = Depends(get_db)
):
    """
    Submit a complaint.
    Auto-assigns department based on confirmed category,
    or flags for Admin Review if category is unmapped or confidence is low (< 60%).
    """
    tracking_num = generate_tracking_number(db)
    dept_id = resolve_department_for_category(request.category, db)

    is_low_conf = False
    if request.ai_confidence is not None and request.ai_confidence < 0.60:
        is_low_conf = True

    complaint = Complaint(
        tracking_number=tracking_num,
        title=request.title,
        description=request.description,
        category=request.category,
        suggested_category=request.suggested_category or request.category,
        ai_confidence=request.ai_confidence,
        is_low_confidence=is_low_conf,
        location=request.location,
        priority=request.priority or "Medium",
        priority_reason=request.priority_reason,
        status="Submitted",
        student_id=current_user.id,
        department_id=dept_id,
        assigned_staff_id=None
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # Record initial status in history audit log
    history = StatusHistory(
        complaint_id=complaint.id,
        old_status=None,
        new_status="Submitted",
        action="created",
        changed_by_id=current_user.id,
        remarks=f"Complaint submitted by {current_user.full_name} under category '{request.category}'."
    )
    db.add(history)

    # In-app notification for the student
    db.add(Notification(
        user_id=current_user.id,
        title=f"Complaint Submitted: {complaint.tracking_number}",
        message=f"Your complaint '{complaint.title}' has been successfully submitted.",
        link=f"/complaints/{complaint.id}"
    ))

    # If routed to a department, notify the department staff
    if dept_id:
        dept_staff = db.query(User).filter(User.department_id == dept_id, User.role == "staff").all()
        for staff in dept_staff:
            db.add(Notification(
                user_id=staff.id,
                title=f"New Complaint in {staff.department.code}: {complaint.tracking_number}",
                message=f"A new complaint '{complaint.title}' has been routed to your department.",
                link=f"/complaints/{complaint.id}"
            ))

    db.commit()
    db.refresh(complaint)
    return get_complaint_detail(complaint.id, current_user, db)

@router.get("/", response_model=PaginatedComplaints)
def list_complaints(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    department_id: Optional[int] = None,
    search: Optional[str] = None,
    assigned_to_me: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)

    # Strict Role-Based Data Isolation
    if current_user.role == "student":
        query = query.filter(Complaint.student_id == current_user.id)
    elif current_user.role == "staff":
        # Staff sees complaints for their department
        query = query.filter(Complaint.department_id == current_user.department_id)
        if assigned_to_me:
            query = query.filter(Complaint.assigned_staff_id == current_user.id)
    elif current_user.role == "admin":
        if department_id:
            query = query.filter(Complaint.department_id == department_id)

    # Filters
    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Complaint.category == category)
    if priority:
        query = query.filter(Complaint.priority == priority)

    # Text search
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Complaint.title.ilike(s),
                Complaint.description.ilike(s),
                Complaint.tracking_number.ilike(s),
                Complaint.location.ilike(s)
            )
        )

    total = query.count()
    total_pages = math.ceil(total / size) if total > 0 else 1
    items = query.order_by(desc(Complaint.created_at)).offset((page - 1) * size).limit(size).all()

    return PaginatedComplaints(
        items=[map_complaint_to_list_item(c) for c in items],
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.get("/{complaint_id}", response_model=ComplaintDetail)
def get_complaint_detail(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # RBAC Access Check
    if current_user.role == "student" and complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this complaint.")
    if current_user.role == "staff" and complaint.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Staff can only view complaints assigned to their department.")

    # Format attachments
    attachments_resp = [
        AttachmentResponse(
            id=a.id,
            complaint_id=a.complaint_id,
            filename=a.filename,
            original_name=a.original_name,
            file_size=a.file_size,
            content_type=a.content_type,
            uploaded_by_id=a.uploaded_by_id,
            created_at=a.created_at,
            download_url=f"/api/v1/complaints/{complaint.id}/attachments/{a.id}/download",
            file_url=f"/uploads/{a.filename}"
        ) for a in complaint.attachments
    ]

    # Filter comments: if student, hide internal staff notes!
    comments_resp = []
    for c in complaint.comments:
        if current_user.role == "student" and c.is_internal:
            continue
        comments_resp.append(CommentResponse(
            id=c.id,
            complaint_id=c.complaint_id,
            author_id=c.author_id,
            author_name=c.author.full_name if c.author else "Unknown",
            author_role=c.author.role if c.author else "User",
            content=c.content,
            is_internal=c.is_internal,
            created_at=c.created_at
        ))

    # Format status history timeline
    history_resp = [
        StatusHistoryResponse(
            id=h.id,
            old_status=h.old_status,
            new_status=h.new_status,
            action=h.action,
            changed_by_name=h.changed_by.full_name if h.changed_by else "System",
            changed_by_role=h.changed_by.role if h.changed_by else "System",
            remarks=h.remarks,
            created_at=h.created_at
        ) for h in complaint.status_history
    ]

    # Feedback
    feedback_resp = None
    if complaint.feedback:
        fb = complaint.feedback
        feedback_resp = FeedbackResponse(
            id=fb.id,
            complaint_id=fb.complaint_id,
            student_id=fb.student_id,
            student_name=fb.student.full_name if fb.student else "Student",
            rating=fb.rating,
            comments=fb.comments,
            created_at=fb.created_at
        )

    # Duplicates links
    duplicates_resp = []
    for d in complaint.duplicates:
        duplicates_resp.append(DuplicateLinkResponse(
            id=d.id,
            primary_complaint_id=d.primary_complaint_id,
            duplicate_complaint_id=d.duplicate_complaint_id,
            duplicate_tracking_number=d.duplicate_complaint.tracking_number if d.duplicate_complaint else None,
            duplicate_title=d.duplicate_complaint.title if d.duplicate_complaint else None,
            similarity_score=d.similarity_score,
            notes=d.notes,
            created_at=d.created_at
        ))

    return ComplaintDetail(
        id=complaint.id,
        tracking_number=complaint.tracking_number,
        title=complaint.title,
        description=complaint.description,
        category=complaint.category,
        suggested_category=complaint.suggested_category,
        ai_confidence=complaint.ai_confidence,
        is_low_confidence=complaint.is_low_confidence,
        location=complaint.location,
        priority=complaint.priority,
        priority_reason=complaint.priority_reason,
        status=complaint.status,
        student_id=complaint.student_id,
        student_name=complaint.student.full_name if complaint.student else "Student",
        department_id=complaint.department_id,
        department_name=complaint.department.name if complaint.department else "Unassigned / Admin Review",
        assigned_staff_id=complaint.assigned_staff_id,
        assigned_staff_name=complaint.assigned_staff.full_name if complaint.assigned_staff else None,
        resolution_notes=complaint.resolution_notes,
        reopened_reason=complaint.reopened_reason,
        resolved_at=complaint.resolved_at,
        closed_at=complaint.closed_at,
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        comments_count=len(comments_resp),
        attachments_count=len(attachments_resp),
        attachments=attachments_resp,
        comments=comments_resp,
        status_history=history_resp,
        feedback=feedback_resp,
        duplicates=duplicates_resp
    )

@router.post("/{complaint_id}/transition", response_model=ComplaintDetail)
def transition_complaint_status(
    complaint_id: int,
    request: StatusTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    validate_and_apply_transition(
        complaint=complaint,
        new_status=request.new_status,
        actor=current_user,
        db=db,
        remarks=request.remarks,
        resolution_notes=request.resolution_notes
    )

    return get_complaint_detail(complaint.id, current_user, db)

@router.post("/{complaint_id}/claim", response_model=ComplaintDetail)
def claim_complaint(
    complaint_id: int,
    current_user: User = Depends(require_role("staff")),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="You can only claim complaints in your department.")

    complaint.assigned_staff_id = current_user.id
    if complaint.status == "Submitted":
        complaint.status = "In Progress"
        
    db.add(StatusHistory(
        complaint_id=complaint.id,
        old_status="Submitted",
        new_status=complaint.status,
        action="claimed",
        changed_by_id=current_user.id,
        remarks=f"Complaint claimed by staff {current_user.full_name}."
    ))
    db.commit()
    db.refresh(complaint)
    return get_complaint_detail(complaint.id, current_user, db)

@router.post("/{complaint_id}/reopen", response_model=ComplaintDetail)
def reopen_complaint(
    complaint_id: int,
    request: ReopenRequest,
    current_user: User = Depends(require_role("student", "admin")),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == "student" and complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only reopen your own complaints.")

    if complaint.status not in ["Resolved", "Closed"]:
        raise HTTPException(status_code=400, detail="Only Resolved or Closed complaints can be reopened.")

    complaint.reopened_reason = request.reopened_reason
    validate_and_apply_transition(
        complaint=complaint,
        new_status="Reopened",
        actor=current_user,
        db=db,
        remarks=f"Reopened with reason: {request.reopened_reason}"
    )

    return get_complaint_detail(complaint.id, current_user, db)

@router.post("/{complaint_id}/reassign", response_model=ComplaintDetail)
def reassign_complaint(
    complaint_id: int,
    request: ReassignRequest,
    current_user: User = Depends(require_role("admin", "staff")),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == "staff":
        # Staff can only reassign to another staff in same department
        if complaint.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        if request.department_id and request.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Staff cannot transfer complaints to other departments.")

    old_dept_id = complaint.department_id
    if request.department_id:
        complaint.department_id = request.department_id
        complaint.is_low_confidence = False
    if request.assigned_staff_id is not None:
        complaint.assigned_staff_id = request.assigned_staff_id
        if complaint.status == "Submitted":
            complaint.status = "Assigned"

    db.add(StatusHistory(
        complaint_id=complaint.id,
        old_status=complaint.status,
        new_status=complaint.status,
        action="reassigned",
        changed_by_id=current_user.id,
        remarks=request.remarks
    ))
    db.commit()
    db.refresh(complaint)
    return get_complaint_detail(complaint.id, current_user, db)

@router.post("/{complaint_id}/override", response_model=ComplaintDetail)
def admin_override(
    complaint_id: int,
    request: AdminOverrideRequest,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    changes = []
    if request.category:
        changes.append(f"category: {complaint.category} -> {request.category}")
        complaint.category = request.category
        complaint.is_low_confidence = False
    if request.priority:
        changes.append(f"priority: {complaint.priority} -> {request.priority}")
        complaint.priority = request.priority
    if request.department_id:
        changes.append(f"department_id: {complaint.department_id} -> {request.department_id}")
        complaint.department_id = request.department_id
        complaint.is_low_confidence = False

    db.add(StatusHistory(
        complaint_id=complaint.id,
        old_status=complaint.status,
        new_status=complaint.status,
        action="admin_override",
        changed_by_id=current_user.id,
        remarks=f"Admin override ({', '.join(changes)}). Reason: {request.remarks}"
    ))
    db.commit()
    db.refresh(complaint)
    return get_complaint_detail(complaint.id, current_user, db)

@router.post("/{complaint_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    complaint_id: int,
    request: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Authorization check
    if current_user.role == "student" and complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if current_user.role == "staff" and complaint.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Students cannot post internal staff notes
    is_internal = request.is_internal if current_user.role in ["staff", "admin"] else False

    comment = Comment(
        complaint_id=complaint.id,
        author_id=current_user.id,
        content=request.content,
        is_internal=is_internal
    )
    db.add(comment)

    # Notify student if staff commented publicly
    if current_user.id != complaint.student_id and not is_internal:
        db.add(Notification(
            user_id=complaint.student_id,
            title=f"New comment on {complaint.tracking_number}",
            message=f"{current_user.full_name} commented: '{request.content[:50]}...'",
            link=f"/complaints/{complaint.id}"
        ))

    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id,
        complaint_id=comment.complaint_id,
        author_id=comment.author_id,
        author_name=current_user.full_name,
        author_role=current_user.role,
        content=comment.content,
        is_internal=comment.is_internal,
        created_at=comment.created_at
    )

@router.post("/{complaint_id}/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    complaint_id: int,
    request: FeedbackCreate,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only submit feedback for your own complaint.")
    if complaint.status not in ["Resolved", "Closed"]:
        raise HTTPException(status_code=400, detail="Feedback can only be submitted after complaint resolution.")
    if complaint.feedback:
        raise HTTPException(status_code=400, detail="Feedback has already been submitted for this complaint.")

    fb = Feedback(
        complaint_id=complaint.id,
        student_id=current_user.id,
        rating=request.rating,
        comments=request.comments
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)

    return FeedbackResponse(
        id=fb.id,
        complaint_id=fb.complaint_id,
        student_id=fb.student_id,
        student_name=current_user.full_name,
        rating=fb.rating,
        comments=fb.comments,
        created_at=fb.created_at
    )

@router.post("/{complaint_id}/attachments", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    complaint_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Access control
    if current_user.role == "student" and complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if current_user.role == "staff" and complaint.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Extension validation
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Read and validate size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE // (1024*1024)}MB."
        )

    saved_filename = f"{uuid.uuid4().hex}.{ext}"
    saved_path = os.path.join(settings.UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as f:
        f.write(content)

    attachment = Attachment(
        complaint_id=complaint.id,
        filename=saved_filename,
        original_name=file.filename,
        file_path=saved_path,
        file_size=len(content),
        content_type=file.content_type or "application/octet-stream",
        uploaded_by_id=current_user.id
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return AttachmentResponse(
        id=attachment.id,
        complaint_id=attachment.complaint_id,
        filename=attachment.filename,
        original_name=attachment.original_name,
        file_size=attachment.file_size,
        content_type=attachment.content_type,
        uploaded_by_id=attachment.uploaded_by_id,
        created_at=attachment.created_at,
        download_url=f"/api/v1/complaints/{complaint.id}/attachments/{attachment.id}/download",
        file_url=f"/uploads/{attachment.filename}"
    )

@router.get("/{complaint_id}/attachments/{attachment_id}/download")
def download_attachment(
    complaint_id: int,
    attachment_id: int,
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Resolve authenticated user from Authorization header or ?token= query parameter
    auth_token = None
    if authorization and authorization.startswith("Bearer "):
        auth_token = authorization.split(" ")[1]
    elif token:
        auth_token = token

    current_user = None
    if auth_token:
        payload = decode_access_token(auth_token)
        if payload and "sub" in payload:
            try:
                user_id = int(payload["sub"])
                current_user = db.query(User).filter(User.id == user_id).first()
            except Exception:
                pass

    if not current_user or not current_user.is_active:
        raise HTTPException(status_code=401, detail="Authentication required to view attachment")

    # RBAC security check
    if current_user.role == "student" and complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if current_user.role == "staff" and complaint.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    attachment = db.query(Attachment).filter(
        Attachment.id == attachment_id,
        Attachment.complaint_id == complaint_id
    ).first()
    if not attachment or not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="Attachment file not found")

    return FileResponse(
        path=attachment.file_path,
        filename=attachment.original_name,
        media_type=attachment.content_type
    )

@router.get("/{complaint_id}/duplicates", response_model=DuplicateSuggestionResponse)
def get_complaint_duplicate_suggestions(
    complaint_id: int,
    current_user: User = Depends(require_role("staff", "admin")),
    db: Session = Depends(get_db)
):
    """
    Staff and admin endpoint to inspect potential related complaints
    using text similarity and location matching.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    duplicates = find_potential_duplicates(
        target_title=complaint.title,
        target_description=complaint.description,
        target_location=complaint.location,
        db=db,
        exclude_complaint_id=complaint.id
    )

    items = [DuplicateSuggestionItem(**d) for d in duplicates]
    return DuplicateSuggestionResponse(
        has_potential_duplicates=len(items) > 0,
        suggestions=items
    )

@router.post("/{complaint_id}/link-duplicate", response_model=DuplicateLinkResponse)
def link_duplicate(
    complaint_id: int,
    request: LinkDuplicateRequest,
    current_user: User = Depends(require_role("staff", "admin")),
    db: Session = Depends(get_db)
):
    link = link_duplicate_complaints(
        primary_id=request.primary_complaint_id,
        duplicate_id=request.duplicate_complaint_id,
        actor=current_user,
        db=db,
        notes=request.notes
    )
    dup = link.duplicate_complaint
    return DuplicateLinkResponse(
        id=link.id,
        primary_complaint_id=link.primary_complaint_id,
        duplicate_complaint_id=link.duplicate_complaint_id,
        duplicate_tracking_number=dup.tracking_number if dup else None,
        duplicate_title=dup.title if dup else None,
        similarity_score=link.similarity_score,
        notes=link.notes,
        created_at=link.created_at
    )
