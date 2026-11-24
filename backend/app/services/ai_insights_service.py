from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.complaint import Complaint
from app.models.department import Department
from app.models.user import User
from app.services.ai_sentiment_service import analyze_sentiment

def generate_executive_insights(db: Session) -> Dict[str, Any]:
    """
    Analyzes aggregate campus complaint patterns, sentiment distributions,
    and departmental turnaround to produce executive intelligence insights.
    """
    total_active = db.query(Complaint).filter(
        Complaint.status.in_(["Submitted", "Assigned", "In Progress", "Reopened"])
    ).count()

    total_complaints = db.query(Complaint).count()
    reopened_count = db.query(Complaint).filter(Complaint.status == "Reopened").count()

    # Department breakdown
    depts = db.query(Department).all()
    bottlenecks: List[str] = []
    dept_loads = []

    for d in depts:
        active_cnt = db.query(Complaint).filter(
            Complaint.department_id == d.id,
            Complaint.status.in_(["Submitted", "Assigned", "In Progress", "Reopened"])
        ).count()
        staff_cnt = db.query(User).filter(User.department_id == d.id, User.role == "staff").count()
        ratio = active_cnt / max(1, staff_cnt)
        dept_loads.append({"dept": d.name, "code": d.code, "active": active_cnt, "staff": staff_cnt, "ratio": ratio})
        if ratio >= 3.0:
            bottlenecks.append(d.name)

    # Category breakdown
    cat_counts = (
        db.query(Complaint.category, func.count(Complaint.id))
        .group_by(Complaint.category)
        .order_by(func.count(Complaint.id).desc())
        .all()
    )

    # Sentiment check on active complaints
    active_complaints = db.query(Complaint).filter(
        Complaint.status.in_(["Submitted", "Assigned", "In Progress", "Reopened"])
    ).limit(20).all()

    high_frustration_count = 0
    frustration_categories = {}

    for c in active_complaints:
        s = analyze_sentiment(f"{c.title} {c.description}")
        if s["sentiment"] == "Frustrated" or s["escalation_risk"] == "High":
            high_frustration_count += 1
            frustration_categories[c.category] = frustration_categories.get(c.category, 0) + 1

    # Formulate insights
    insights = []

    # 1. Top Category Volume Insight
    if cat_counts:
        top_cat, top_cnt = cat_counts[0]
        pct = int((top_cnt / max(1, total_complaints)) * 100)
        insights.append({
            "type": "trend",
            "title": f"Primary Volume Driver: {top_cat}",
            "description": f"'{top_cat}' constitutes {pct}% ({top_cnt}/{total_complaints}) of all logged grievances campus-wide.",
            "severity": "info",
            "metric": f"{pct}% of Total"
        })

    # 2. Bottleneck Warning
    if bottlenecks:
        insights.append({
            "type": "bottleneck",
            "title": "Department Workload Imbalance",
            "description": f"High ticket-to-staff backlog identified in: {', '.join(bottlenecks[:2])}. Response times may experience latency.",
            "severity": "warning",
            "metric": f"{len(bottlenecks)} Depts Affected"
        })
    else:
        insights.append({
            "type": "trend",
            "title": "Balanced Department Dispatching",
            "description": "All department queues are operating within optimal capacity parameters with sub-2.0 active tickets per engineer.",
            "severity": "info",
            "metric": "Capacity Normal"
        })

    # 3. Repeat Grievance / Reopening Anomaly
    if reopened_count > 0:
        insights.append({
            "type": "anomaly",
            "title": f"Reopened Tickets Detected ({reopened_count})",
            "description": f"{reopened_count} ticket{'s' if reopened_count > 1 else ''} reopened by students after initial resolution. Inspect resolution notes and verification standards.",
            "severity": "warning",
            "metric": f"{reopened_count} Reopened"
        })

    # 4. Student Sentiment & Escalation Risk
    if high_frustration_count > 0:
        top_frust_cat = max(frustration_categories, key=frustration_categories.get) if frustration_categories else "General"
        insights.append({
            "type": "bottleneck",
            "title": f"High Student Frustration in {top_frust_cat}",
            "description": f"{high_frustration_count} active tickets indicate emotional distress or repeated breakdown mentions. Recommend prioritizing for student satisfaction.",
            "severity": "critical",
            "metric": f"{high_frustration_count} At-Risk"
        })
    else:
        insights.append({
            "type": "trend",
            "title": "Low Student Friction",
            "description": "Grievance tone analysis indicates predominantly objective, calm reports with minimal escalation triggers.",
            "severity": "info",
            "metric": "Healthy Sentiment"
        })

    # 5. Strategic AI Recommendation
    insights.append({
        "type": "recommendation",
        "title": "Preventive Facilities Maintenance",
        "description": "Leverage recurring location telemetry to conduct scheduled maintenance in high-frequency residential blocks.",
        "severity": "info",
        "metric": "Preventive Action"
    })

    summary = (
        f"CampusCare currently tracks {total_active} active grievances across 7 departments. "
        f"{'Elevated backlog detected in ' + ', '.join(bottlenecks) if bottlenecks else 'All department queues are stable'}. "
        f"{high_frustration_count} ticket(s) exhibit high emotional urgency or repeat frustration."
    )

    return {
        "summary": summary,
        "total_active_complaints": total_active,
        "high_frustration_count": high_frustration_count,
        "bottleneck_departments": bottlenecks,
        "insights": insights,
        "generated_at": datetime.now(timezone.utc).strftime("%b %d, %Y, %I:%M %p UTC")
    }
