from typing import Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.complaint import Complaint
from app.models.status_history import StatusHistory
from app.models.department import Department
from app.models.notification import Notification
from app.models.user import User

ALLOWED_TRANSITIONS = {
    "Submitted": ["Assigned", "In Progress"],
    "Assigned": ["In Progress", "Resolved"],
    "In Progress": ["Resolved"],
    "Resolved": ["Closed", "Reopened"],
    "Closed": [],  # Terminal state (cannot reopen directly without explicit admin override or feedback)
    "Reopened": ["In Progress", "Assigned"]
}

CATEGORY_DEPARTMENT_CODE_MAP = {
    "IT and Wi-Fi": "IT",
    "Electrical": "ELEC",
    "Plumbing": "PLUMB",
    "Hostel maintenance": "HOSTEL",
    "Classroom and laboratory equipment": "ACAD",
    "Sanitation": "SANIT",
    "Other": "ESTATE"
}

def resolve_department_for_category(category: str, db: Session) -> Optional[int]:
    code = CATEGORY_DEPARTMENT_CODE_MAP.get(category)
    if not code:
        return None
    dept = db.query(Department).filter(Department.code == code).first()
    return dept.id if dept else None

def validate_and_apply_transition(
    complaint: Complaint,
    new_status: str,
    actor: User,
    db: Session,
    remarks: Optional[str] = None,
    resolution_notes: Optional[str] = None
) -> Complaint:
    current_status = complaint.status
    
    # Check if transition is defined
    allowed_next = ALLOWED_TRANSITIONS.get(current_status, [])
    
    # Admins have override privileges for exceptional circumstances with mandatory remarks
    if actor.role != "admin" and new_status not in allowed_next:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from '{current_status}' to '{new_status}'. Allowed transitions: {allowed_next}"
        )
    
    # Students can only transition Resolved -> Closed or Resolved -> Reopened
    if actor.role == "student":
        if actor.id != complaint.student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only transition status on your own complaints."
            )
        if current_status != "Resolved" or new_status not in ["Closed", "Reopened"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Students can only close or reopen resolved complaints."
            )

    # Department staff can only manage complaints assigned to their department
    if actor.role == "staff":
        if complaint.department_id != actor.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff can only update complaints within their department."
            )

    # Apply state changes
    old_status = complaint.status
    complaint.status = new_status
    complaint.updated_at = datetime.now(timezone.utc)
    
    if new_status == "In Progress" and not complaint.assigned_staff_id and actor.role == "staff":
        complaint.assigned_staff_id = actor.id
        
    if new_status == "Resolved":
        complaint.resolved_at = datetime.now(timezone.utc)
        if resolution_notes:
            complaint.resolution_notes = resolution_notes
            
    if new_status == "Closed":
        complaint.closed_at = datetime.now(timezone.utc)
        
    if new_status == "Reopened":
        complaint.resolved_at = None
        complaint.closed_at = None
        # Return to staff queue; preserve previous assigned staff or keep in department queue

    # Record in status history audit log
    history_entry = StatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=new_status,
        action="status_transition",
        changed_by_id=actor.id,
        remarks=remarks or (f"Status updated to {new_status} by {actor.full_name}")
    )
    db.add(history_entry)

    # Create notifications
    # If staff/admin updated, notify student
    if actor.id != complaint.student_id:
        notif = Notification(
            user_id=complaint.student_id,
            title=f"Complaint {complaint.tracking_number} Status: {new_status}",
            message=f"Your complaint '{complaint.title}' has been updated to {new_status}.",
            link=f"/complaints/{complaint.id}"
        )
        db.add(notif)
        
    # If student reopened, notify assigned staff or department
    if new_status == "Reopened":
        target_user_id = complaint.assigned_staff_id
        if target_user_id:
            db.add(Notification(
                user_id=target_user_id,
                title=f"Complaint {complaint.tracking_number} Reopened",
                message=f"Complaint '{complaint.title}' was reopened by student with reason: {remarks}",
                link=f"/complaints/{complaint.id}"
            ))

    db.commit()
    db.refresh(complaint)
    return complaint
