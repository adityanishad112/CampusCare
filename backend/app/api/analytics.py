import csv
import io
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.department import Department
from app.models.complaint import Complaint
from app.models.feedback import Feedback
from app.schemas.analytics import (
    AnalyticsSummary, CountByLabel, WeeklyTrendPoint, DepartmentWorkload
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    department_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes real-time statistics from stored records:
    - Status & Category breakdowns
    - Weekly submission & resolution trends
    - Average time to resolution (hours)
    - Average student satisfaction rating
    - Department workloads
    """
    query = db.query(Complaint)
    if current_user.role == "staff":
        department_id = current_user.department_id

    if department_id:
        query = query.filter(Complaint.department_id == department_id)

    total_complaints = query.count()
    submitted_count = query.filter(Complaint.status == "Submitted").count()
    assigned_count = query.filter(Complaint.status == "Assigned").count()
    in_progress_count = query.filter(Complaint.status == "In Progress").count()
    resolved_count = query.filter(Complaint.status == "Resolved").count()
    closed_count = query.filter(Complaint.status == "Closed").count()
    reopened_count = query.filter(Complaint.status == "Reopened").count()

    # Category breakdown
    cat_counts = (
        db.query(Complaint.category, func.count(Complaint.id))
        .filter(Complaint.department_id == department_id if department_id else True)
        .group_by(Complaint.category)
        .all()
    )
    categories_breakdown = [CountByLabel(label=c[0], count=c[1]) for c in cat_counts]

    # Status breakdown
    status_breakdown = [
        CountByLabel(label="Submitted", count=submitted_count),
        CountByLabel(label="Assigned", count=assigned_count),
        CountByLabel(label="In Progress", count=in_progress_count),
        CountByLabel(label="Resolved", count=resolved_count),
        CountByLabel(label="Closed", count=closed_count),
        CountByLabel(label="Reopened", count=reopened_count),
    ]

    # Priority breakdown
    prio_counts = (
        db.query(Complaint.priority, func.count(Complaint.id))
        .filter(Complaint.department_id == department_id if department_id else True)
        .group_by(Complaint.priority)
        .all()
    )
    priority_breakdown = [CountByLabel(label=p[0], count=p[1]) for p in prio_counts]

    # Average resolution time in hours
    resolved_complaints = (
        db.query(Complaint)
        .filter(Complaint.resolved_at.isnot(None))
        .filter(Complaint.department_id == department_id if department_id else True)
        .all()
    )
    
    total_hours = 0.0
    count_resolved = len(resolved_complaints)
    for rc in resolved_complaints:
        if rc.resolved_at and rc.created_at:
            delta = rc.resolved_at - rc.created_at
            total_hours += delta.total_seconds() / 3600.0
    avg_resolution_hours = round(total_hours / count_resolved, 1) if count_resolved > 0 else 0.0

    # Average student satisfaction rating (1-5)
    feedback_ratings = (
        db.query(func.avg(Feedback.rating))
        .join(Complaint, Feedback.complaint_id == Complaint.id)
        .filter(Complaint.department_id == department_id if department_id else True)
        .scalar()
    )
    satisfaction_rate = round(float(feedback_ratings), 1) if feedback_ratings else 0.0

    # Weekly trend (last 7 days)
    now = datetime.now(timezone.utc)
    weekly_trends = []
    for day_offset in range(6, -1, -1):
        target_day = (now - timedelta(days=day_offset)).date()
        date_str = target_day.strftime("%b %d")
        
        day_submitted = (
            db.query(Complaint)
            .filter(func.date(Complaint.created_at) == target_day)
            .filter(Complaint.department_id == department_id if department_id else True)
            .count()
        )
        day_resolved = (
            db.query(Complaint)
            .filter(func.date(Complaint.resolved_at) == target_day)
            .filter(Complaint.department_id == department_id if department_id else True)
            .count()
        )
        weekly_trends.append(WeeklyTrendPoint(
            date=date_str,
            submitted=day_submitted,
            resolved=day_resolved
        ))

    # Department Workload
    departments = db.query(Department).all()
    dept_workloads = []
    for d in departments:
        total_dept = db.query(Complaint).filter(Complaint.department_id == d.id).count()
        pending_dept = db.query(Complaint).filter(
            Complaint.department_id == d.id,
            Complaint.status.in_(["Submitted", "Assigned", "In Progress", "Reopened"])
        ).count()
        resolved_dept = db.query(Complaint).filter(
            Complaint.department_id == d.id,
            Complaint.status.in_(["Resolved", "Closed"])
        ).count()
        
        # Dept resolution time
        d_resolved = db.query(Complaint).filter(
            Complaint.department_id == d.id,
            Complaint.resolved_at.isnot(None)
        ).all()
        d_hours = sum((r.resolved_at - r.created_at).total_seconds() / 3600.0 for r in d_resolved if r.resolved_at and r.created_at)
        avg_d_hours = round(d_hours / len(d_resolved), 1) if d_resolved else 0.0

        dept_workloads.append(DepartmentWorkload(
            department_id=d.id,
            department_name=d.name,
            total_complaints=total_dept,
            pending_complaints=pending_dept,
            resolved_complaints=resolved_dept,
            avg_resolution_hours=avg_d_hours
        ))

    return AnalyticsSummary(
        total_complaints=total_complaints,
        submitted_count=submitted_count,
        assigned_count=assigned_count,
        in_progress_count=in_progress_count,
        resolved_count=resolved_count,
        closed_count=closed_count,
        reopened_count=reopened_count,
        avg_resolution_hours=avg_resolution_hours,
        satisfaction_rate=satisfaction_rate,
        categories_breakdown=categories_breakdown,
        status_breakdown=status_breakdown,
        priority_breakdown=priority_breakdown,
        weekly_trends=weekly_trends,
        department_workloads=dept_workloads
    )

@router.get("/export/csv")
def export_complaints_csv(
    status: Optional[str] = None,
    category: Optional[str] = None,
    department_id: Optional[int] = None,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Export filtered complaint reports as CSV for academic administrators.
    """
    query = db.query(Complaint)
    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Complaint.category == category)
    if department_id:
        query = query.filter(Complaint.department_id == department_id)

    complaints = query.order_by(Complaint.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Tracking Number", "Title", "Category", "Location", "Priority",
        "Status", "Student Name", "Student Email", "Department", "Assigned Staff",
        "AI Confidence", "Created At", "Resolved At", "Resolution Notes"
    ])

    for c in complaints:
        writer.writerow([
            c.tracking_number,
            c.title,
            c.category,
            c.location,
            c.priority,
            c.status,
            c.student.full_name if c.student else "",
            c.student.email if c.student else "",
            c.department.name if c.department else "Unassigned",
            c.assigned_staff.full_name if c.assigned_staff else "None",
            f"{c.ai_confidence:.2f}" if c.ai_confidence is not None else "N/A",
            c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else "",
            c.resolved_at.strftime("%Y-%m-%d %H:%M:%S") if c.resolved_at else "",
            c.resolution_notes or ""
        ])

    csv_data = output.getvalue()
    filename = f"campuscare_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
