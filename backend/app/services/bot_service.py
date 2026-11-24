import logging
import os
import re
import urllib.parse

from app.models.complaint import Complaint
from app.models.department import Department
from app.models.user import User
from app.schemas.bot import ChatAction, ChatMessage, ChatResponse
from app.services.duplicate_detector import find_potential_duplicates
from app.services.ml_classifier import classifier_service
from app.services.priority_engine import suggest_priority
from sqlalchemy import desc
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

EMERGENCY_CONTACTS = [
    {"name": "24x7 Campus Security Central Control", "phone": "+91 98765 00100", "ext": "100"},
    {"name": "Campus Health Center & Ambulance", "phone": "+91 98765 00108", "ext": "108"},
    {"name": "Electrical & Fire Safety Rapid Cell", "phone": "+91 98765 00102", "ext": "102"},
    {"name": "Hostel Chief Warden Emergency Desk", "phone": "+91 98765 00105", "ext": "105"},
]

SLA_GUIDELINES = {
    "Critical": "4–6 Hours (Immediate electrical hazards, active water pipe bursts, chemical risks)",
    "High": "24 Hours (Lecture hall equipment during exams, departmental Wi-Fi outages)",
    "Medium": "48–72 Hours (Routine room repairs, faucet maintenance, LAN port checks)",
    "Low": "5–7 Days (Cosmetic maintenance, paint wear, non-blocking requests)",
}

def extract_tracking_number(text: str) -> str | None:
    # Match patterns like CMP-2026-0001 or CMP2026-0001 or CMP 0001
    m = re.search(r"(CMP-\d{4}-\d{4})", text, re.IGNORECASE)
    if m:
        return m.group(1).upper()
    m2 = re.search(r"\bCMP[- ]?(\d{4})\b", text, re.IGNORECASE)
    if m2:
        return f"CMP-2026-{int(m2.group(1)):04d}"
    return None

def process_chat(
    message: str,
    db: Session,
    current_user: User | None = None,
    history: list[ChatMessage] | None = None
) -> ChatResponse:
    clean_msg = message.strip()
    lower_msg = clean_msg.lower()

    # -------------------------------------------------------------
    # 1. TICKET TRACKING INTENT
    # -------------------------------------------------------------
    tracking_no = extract_tracking_number(clean_msg)
    if tracking_no or (("track" in lower_msg or "status" in lower_msg) and any(char.isdigit() for char in lower_msg)):
        if not tracking_no:
            # Try to grab digit sequence
            digits = re.findall(r"\b\d+\b", lower_msg)
            if digits:
                candidate_id = int(digits[0])
                complaint = db.query(Complaint).filter(Complaint.id == candidate_id).first()
                if complaint:
                    tracking_no = complaint.tracking_number

        if tracking_no:
            complaint = db.query(Complaint).filter(Complaint.tracking_number == tracking_no).first()
            if complaint:
                dept_name = complaint.department.name if complaint.department else "Unassigned / Admin Review"
                staff_name = complaint.assigned_staff.full_name if complaint.assigned_staff else "Pending staff claim"
                notes = f"\n- **Resolution Summary**: {complaint.resolution_notes}" if complaint.resolution_notes else ""
                reason = f"\n- **Priority Reason**: {complaint.priority_reason}" if complaint.priority_reason else ""
                
                status_emoji = {
                    "Submitted": "🟡",
                    "Assigned": "🔵",
                    "In Progress": "🟣",
                    "Resolved": "🟢",
                    "Closed": "⚪",
                    "Reopened": "🟠"
                }.get(complaint.status, "ℹ️")

                reply = (
                    f"### 📋 Ticket Found: `{complaint.tracking_number}`\n\n"
                    f"- **Title**: {complaint.title}\n"
                    f"- **Current Status**: {status_emoji} **{complaint.status}**\n"
                    f"- **Category**: {complaint.category}\n"
                    f"- **Priority**: **{complaint.priority}**{reason}\n"
                    f"- **Department**: {dept_name}\n"
                    f"- **Assigned Engineer**: {staff_name}\n"
                    f"- **Location**: {complaint.location}\n"
                    f"- **Filed On**: {complaint.created_at.strftime('%b %d, %Y at %I:%M %p')}"
                    f"{notes}\n\n"
                    f"You can view the full activity audit trail, submit additional comments, or attach photos by clicking below."
                )

                return ChatResponse(
                    reply=reply,
                    intent="track_ticket",
                    actions=[
                        ChatAction(
                            action_type="VIEW_TICKET",
                            label=f"View Ticket #{complaint.tracking_number}",
                            payload={"url": f"/complaints/{complaint.id}", "complaint_id": complaint.id}
                        )
                    ],
                    suggested_replies=[
                        "What is the resolution SLA for this?",
                        "Who is the department head?",
                        "How do I reopen if unresolved?"
                    ],
                    data={"complaint_id": complaint.id, "tracking_number": complaint.tracking_number, "status": complaint.status}
                )
            else:
                return ChatResponse(
                    reply=f"⚠️ I could not find any ticket with tracking number `{tracking_no}` in the CampusCare database. Please double-check your tracking number (e.g. `CMP-2026-0001`).",
                    intent="track_ticket_not_found",
                    actions=[
                        ChatAction(action_type="NAVIGATE", label="Go to My Complaints", payload={"url": "/complaints"})
                    ],
                    suggested_replies=["Show my active complaints", "How to submit a new complaint", "Contact helpdesk"]
                )

    # -------------------------------------------------------------
    # 2. "MY COMPLAINTS" / USER TICKETS SUMMARY INTENT
    # -------------------------------------------------------------
    if any(k in lower_msg for k in ["my complaint", "my ticket", "my issues", "complaints filed by me", "what did i submit"]):
        if not current_user:
            return ChatResponse(
                reply="🔐 Please sign in to your CampusCare account to view your filed complaints and real-time updates.",
                intent="auth_required",
                actions=[ChatAction(action_type="NAVIGATE", label="Sign In", payload={"url": "/login"})],
                suggested_replies=["Demo accounts", "Campus emergency contacts"]
            )

        user_complaints = (
            db.query(Complaint)
            .filter(Complaint.student_id == current_user.id)
            .order_by(desc(Complaint.created_at))
            .limit(5)
            .all()
        )

        if not user_complaints:
            return ChatResponse(
                reply=f"👋 Hello **{current_user.full_name}**! You do not currently have any complaints on record.\n\nWould you like to file a new issue?",
                intent="my_tickets_empty",
                actions=[
                    ChatAction(action_type="NAVIGATE", label="Submit New Issue", payload={"url": "/complaints/new"})
                ],
                suggested_replies=["Report Wi-Fi problem", "Report Hostel plumbing issue", "View Emergency numbers"]
            )

        items_str = ""
        actions = []
        for c in user_complaints:
            status_emoji = {"Submitted": "🟡", "Assigned": "🔵", "In Progress": "🟣", "Resolved": "🟢", "Closed": "⚪", "Reopened": "🟠"}.get(c.status, "ℹ️")
            items_str += f"- **[{c.tracking_number}]** ({status_emoji} {c.status}) — *{c.title}* ({c.priority} Priority)\n"
            actions.append(ChatAction(
                action_type="VIEW_TICKET",
                label=f"View {c.tracking_number}",
                payload={"url": f"/complaints/{c.id}", "complaint_id": c.id}
            ))

        reply = (
            f"### 📋 Your Recent Complaints ({len(user_complaints)} total):\n\n"
            f"{items_str}\n"
            f"Click on any ticket above to view its live progress or add comments."
        )

        return ChatResponse(
            reply=reply,
            intent="my_tickets",
            actions=actions,
            suggested_replies=["Submit another issue", "SLA resolution timelines", "Contact IT helpdesk"]
        )

    # -------------------------------------------------------------
    # 3. EMERGENCY / RAPID SAFETY RESPONSE INTENT
    # -------------------------------------------------------------
    emergency_keywords = ["emergency", "fire", "smoke", "spark", "electric shock", "flood", "flooding", "ambulance", "injury", "bleeding", "hazard", "threat", "police"]
    if any(re.search(rf"\b{k}\b", lower_msg) for k in emergency_keywords):
        contacts_str = "\n".join([f"- **{c['name']}**: 📞 **{c['phone']}** (Campus Intercom: `#{c['ext']}`)" for c in EMERGENCY_CONTACTS])
        reply = (
            f"### 🚨 Campus Safety Alert & Emergency Protocol\n\n"
            f"If you are witnessing an active physical hazard, electrical sparking, structural damage, or medical emergency, **please contact emergency units immediately**:\n\n"
            f"{contacts_str}\n\n"
            f"⚠️ **Safety Guidelines:**\n"
            f"1. Move to a safe location away from sparks, exposed cables, or flooding.\n"
            f"2. Alert nearby faculty, hostel wardens, or security personnel.\n"
            f"3. An automatic **High/Critical Priority** ticket can also be logged to notify the maintenance rapid response team."
        )
        return ChatResponse(
            reply=reply,
            intent="emergency",
            actions=[
                ChatAction(
                    action_type="FILE_COMPLAINT",
                    label="🚨 Report Urgent Safety Hazard",
                    payload={
                        "url": "/complaints/new?priority=High&category=Electrical&title=Urgent%20Safety%20Hazard",
                        "priority": "High"
                    }
                )
            ],
            suggested_replies=["Hospital ambulance desk", "Hostel warden contacts", "Electrical team intercom"]
        )

    # -------------------------------------------------------------
    # 4. DEPARTMENT CONTACTS & DIRECTORY INTENT
    # -------------------------------------------------------------
    if any(k in lower_msg for k in ["contact", "directory", "email", "phone number", "who to call", "department info", "warden", "electrician", "plumber"]):
        depts = db.query(Department).all()
        dept_lines = []
        for d in depts:
            dept_lines.append(f"- **{d.name}** (`{d.code}`)\n  📧 Contact: `{d.contact_email}`\n  ℹ️ Scope: {d.description}")
        
        reply = (
            "### 🏛️ CampusCare Department Directory\n\n"
            "Here are the official contact emails and operating scopes for campus departments:\n\n"
            + "\n\n".join(dept_lines)
            + "\n\n*Note: Complaints logged through this portal are automatically routed to the respective department's staff queue.*"
        )
        return ChatResponse(
            reply=reply,
            intent="department_contacts",
            actions=[
                ChatAction(action_type="NAVIGATE", label="Submit New Issue", payload={"url": "/complaints/new"})
            ],
            suggested_replies=["Report Wi-Fi issue", "Report Hostel issue", "Emergency telephone numbers"]
        )

    # -------------------------------------------------------------
    # 5. SLA / RESOLUTION POLICY & RULES INTENT
    # -------------------------------------------------------------
    if any(k in lower_msg for k in ["sla", "timeline", "how long", "time to resolve", "reopen policy", "grace period", "rating", "satisfaction"]):
        sla_lines = "\n".join([f"- **{level} Priority**: {time_desc}" for level, time_desc in SLA_GUIDELINES.items()])
        reply = (
            f"### ⏱️ Service Level Agreement (SLA) & Policies\n\n"
            f"CampusCare enforces strict departmental resolution timelines:\n\n"
            f"{sla_lines}\n\n"
            f"#### 🔄 Resolution & Reopening Policy:\n"
            f"1. **Student Verification**: When staff marks a ticket as `Resolved`, you will receive an in-app notification.\n"
            f"2. **7-Day Grace Period**: You have 7 days to test the fix and submit a 5-star feedback rating.\n"
            f"3. **Instant Reopening**: If the problem persists or returns within 7 days, you can click **Reopen Ticket** with a brief reason. The ticket immediately jumps back to the department queue!\n"
            f"4. **Auto-Closure**: Tickets without dispute are automatically marked `Closed` after 7 days."
        )
        return ChatResponse(
            reply=reply,
            intent="sla_policy",
            actions=[
                ChatAction(action_type="NAVIGATE", label="My Complaints", payload={"url": "/complaints"})
            ],
            suggested_replies=["Check my complaints", "Emergency helpline", "Submit new issue"]
        )

    # -------------------------------------------------------------
    # 6. COMPLAINT FILING ASSISTANT / ISSUE DIAGNOSTIC INTENT
    # -------------------------------------------------------------
    # If the user is describing a problem or asking how to file:
    issue_indicators = [
        "not working", "broken", "issue", "problem", "fault", "leaking", "damaged", "slow",
        "disconnect", "down", "clogged", "smell", "spark", "flicker", "fan", "ac", "wifi",
        "wi-fi", "water", "light", "switch", "door", "lock", "projector", "report", "lodge",
        "file a complaint", "how to file", "how do i complain"
    ]

    is_describing_issue = any(ind in lower_msg for ind in issue_indicators) and len(clean_msg.split()) >= 3

    if is_describing_issue or "how to file" in lower_msg or "lodge" in lower_msg:
        # Run ML categorization on the message text
        sample_title = clean_msg[:75]
        prediction = classifier_service.predict(title=clean_msg, description=clean_msg)
        category = prediction.get("suggested_category", "IT and Wi-Fi")
        confidence = prediction.get("confidence", 0.85)

        priority_res = suggest_priority(title=clean_msg, description=clean_msg, category=category)
        priority = priority_res.get("suggested_priority", "Medium")
        priority_reason = priority_res.get("reason", "Standard operational issue with moderate impact.")

        # Check for similar active complaints in DB
        dups = find_potential_duplicates(
            target_title=clean_msg,
            target_description=clean_msg,
            target_location="",
            db=db,
            threshold=0.40
        )

        dup_notice = ""
        if dups:
            top_dup = dups[0]
            dup_notice = (
                f"\n\n⚠️ **Notice:** A similar issue `{top_dup['tracking_number']}` (*\"{top_dup['title']}\"*) "
                f"was recently submitted ({int(top_dup['similarity_score'] * 100)}% match). "
                f"You can check that ticket or proceed if this is distinct."
            )

        # Build pre-fill query parameters for 1-click filing
        query_params = {
            "title": sample_title,
            "description": clean_msg,
            "category": category,
            "priority": priority,
            "priority_reason": priority_reason
        }
        encoded_query = urllib.parse.urlencode(query_params)
        prefill_url = f"/complaints/new?{encoded_query}"

        reply = (
            f"### 🤖 AI Diagnostic & Pre-Classification\n\n"
            f"I analyzed your description using our embedded NLP model:\n\n"
            f"- **Detected Department / Category**: `{category}` ({int(confidence * 100)}% confidence)\n"
            f"- **Assessed Priority**: **{priority}**\n"
            f"- **Priority Rationale**: {priority_reason}"
            f"{dup_notice}\n\n"
            f"Click **\"⚡ Pre-Fill Complaint\"** below to launch the ticket submission form with these fields filled automatically!"
        )

        actions = [
            ChatAction(
                action_type="FILE_COMPLAINT",
                label="⚡ Pre-Fill Complaint Form",
                payload={"url": prefill_url, "category": category, "priority": priority}
            )
        ]

        if dups:
            actions.append(ChatAction(
                action_type="VIEW_TICKET",
                label=f"Inspect Similar #{dups[0]['tracking_number']}",
                payload={"url": f"/complaints/{dups[0]['complaint_id']}"}
            ))

        return ChatResponse(
            reply=reply,
            intent="file_complaint_assistant",
            actions=actions,
            suggested_replies=[
                "Change department category",
                "What is the resolution SLA for this?",
                "Emergency contacts"
            ],
            data={"category": category, "priority": priority, "confidence": confidence}
        )

    # -------------------------------------------------------------
    # 7. OPTIONAL GEMINI LLM ENHANCEMENT (if GEMINI_API_KEY is configured)
    # -------------------------------------------------------------
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        try:
            import httpx
            system_prompt = (
                "You are CampusCare Assistant, the official AI support bot for a university campus issue management system. "
                "You help students and staff report issues (IT/Wi-Fi, Electrical, Plumbing, Hostel, Academic, Sanitation), "
                "track existing complaints by ticket number, understand resolution SLAs, and provide campus guidance. "
                "Keep responses polite, structured, concise, and encourage users to file complaints or check tickets."
            )
            # Call Gemini Interactions or GenerateContent via httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": f"{system_prompt}\n\nUser Question: {clean_msg}"}]}
                ]
            }
            with httpx.Client(timeout=6.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    cand = res.json().get("candidates", [])[0]["content"]["parts"][0]["text"]
                    return ChatResponse(
                        reply=cand,
                        intent="llm_generative",
                        actions=[
                            ChatAction(action_type="NAVIGATE", label="Submit Complaint", payload={"url": "/complaints/new"}),
                            ChatAction(action_type="NAVIGATE", label="My Complaints", payload={"url": "/complaints"})
                        ],
                        suggested_replies=["Track a ticket", "Emergency numbers", "Department emails"]
                    )
        except Exception as e:
            logger.debug("Gemini fallback: %s", e)  # Fall through to default local response

    # -------------------------------------------------------------
    # 8. DEFAULT FRIENDLY CONVERSATIONAL FALLBACK
    # -------------------------------------------------------------
    reply = (
        "👋 Hello! I am the **CampusCare AI Instant Assistant**.\n\n"
        "Here are the things I can help you with right now:\n\n"
        "1. **⚡ Report an Issue**: Describe any breakdown (e.g., *\"Wi-Fi not working in Hostel 4\"*) and I will automatically detect the category, priority, and pre-fill your complaint ticket.\n"
        "2. **🔍 Track a Complaint**: Type your ticket number (e.g., `CMP-2026-0001` or `track 1`) to see real-time status and assigned engineer details.\n"
        "3. **📋 View My Tickets**: Say *\"show my complaints\"* to list your active tickets.\n"
        "4. **🏛️ Department Directory**: Ask for contact emails or office details for IT, Electrical, Plumbing, Hostel, or Sanitation.\n"
        "5. **🚨 Emergency**: Ask for immediate campus emergency, fire, or medical contacts."
    )

    return ChatResponse(
        reply=reply,
        intent="general_help",
        actions=[
            ChatAction(action_type="NAVIGATE", label="📝 File New Complaint", payload={"url": "/complaints/new"}),
            ChatAction(action_type="NAVIGATE", label="📋 View All Complaints", payload={"url": "/complaints"})
        ],
        suggested_replies=[
            "Track ticket CMP-2026-0001",
            "Wi-Fi keeps dropping in my hostel",
            "Campus emergency numbers",
            "What is the resolution SLA?"
        ]
    )
