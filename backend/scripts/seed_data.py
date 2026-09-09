import os
import sys
from datetime import datetime, timedelta, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.department import Department
from app.models.user import User
from app.models.complaint import Complaint
from app.models.comment import Comment
from app.models.status_history import StatusHistory
from app.models.feedback import Feedback
from app.models.notification import Notification
from app.models.duplicate_link import DuplicateLink

def seed():
    print("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    existing_user = db.query(User).first()
    if existing_user:
        print("Database already contains records. Skipping seed.")
        db.close()
        return

    print("Seeding initial data...")

    # 1. Departments
    dept_data = [
        ("Information Technology Department", "IT", "Handles network, Wi-Fi, portals, server systems, and academic software infrastructure.", "it-support@campuscare.edu"),
        ("Electrical & Power Works Department", "ELEC", "Maintains high & low voltage power, backup generators, switchboards, lighting, and classroom fans.", "electrical@campuscare.edu"),
        ("Plumbing & Water Supply Department", "PLUMB", "Manages potable water supply, washroom fixtures, drainage lines, and rooftop storage tanks.", "plumbing@campuscare.edu"),
        ("Hostel & Residential Affairs", "HOSTEL", "Oversees hostel room fixtures, furniture, civil maintenance, windows, and security doors.", "hostel-office@campuscare.edu"),
        ("Academic & Lab Facilities Department", "ACAD", "Maintains lecture hall digital podiums, projectors, microscopes, and lab test apparatus.", "facilities@campuscare.edu"),
        ("Campus Sanitation & Housekeeping", "SANIT", "Responsible for waste management, hygiene, washroom cleaning, and pest control.", "sanitation@campuscare.edu"),
        ("Estate & General Administration", "ESTATE", "Handles parking, campus security gates, landscaping, signage, and general admin inquiries.", "estate@campuscare.edu"),
    ]

    departments = {}
    for name, code, desc, email in dept_data:
        d = Department(name=name, code=code, description=desc, contact_email=email)
        db.add(d)
        departments[code] = d
    db.commit()

    # 2. Demo Users
    common_pass = get_password_hash("Student@123")
    staff_pass = get_password_hash("Staff@123")
    admin_pass = get_password_hash("Admin@123")

    admin = User(
        email="admin@campuscare.edu",
        full_name="Dr. Priya Nair (Dean of Student Affairs)",
        hashed_password=admin_pass,
        role="admin",
        department_id=None,
        is_active=True
    )
    db.add(admin)

    # Department Staff
    it_staff = User(
        email="it_staff@campuscare.edu",
        full_name="Arjun Mehta (Senior Network Engineer)",
        hashed_password=staff_pass,
        role="staff",
        department_id=departments["IT"].id,
        is_active=True
    )
    elec_staff = User(
        email="electrical_staff@campuscare.edu",
        full_name="Suresh Kumar (Chief Electrician)",
        hashed_password=staff_pass,
        role="staff",
        department_id=departments["ELEC"].id,
        is_active=True
    )
    plumb_staff = User(
        email="plumbing_staff@campuscare.edu",
        full_name="Ramesh Gupta (Senior Plumber)",
        hashed_password=staff_pass,
        role="staff",
        department_id=departments["PLUMB"].id,
        is_active=True
    )
    hostel_staff = User(
        email="hostel_staff@campuscare.edu",
        full_name="Kavitha Reddy (Hostel Warden & Maintenance Lead)",
        hashed_password=staff_pass,
        role="staff",
        department_id=departments["HOSTEL"].id,
        is_active=True
    )
    acad_staff = User(
        email="acad_staff@campuscare.edu",
        full_name="Dr. Vikram Rao (Lab Equipment Coordinator)",
        hashed_password=staff_pass,
        role="staff",
        department_id=departments["ACAD"].id,
        is_active=True
    )
    db.add_all([it_staff, elec_staff, plumb_staff, hostel_staff, acad_staff])

    # Students
    aarav = User(
        email="alex.student@campuscare.edu",
        full_name="Aarav Sharma (Final Year CSE)",
        hashed_password=common_pass,
        role="student",
        is_active=True
    )
    priya = User(
        email="maria.student@campuscare.edu",
        full_name="Priya Iyer (3rd Year Bioengineering)",
        hashed_password=common_pass,
        role="student",
        is_active=True
    )
    rohit = User(
        email="rohit.student@campuscare.edu",
        full_name="Rohit Sharma (2nd Year Mechanical)",
        hashed_password=common_pass,
        role="student",
        is_active=True
    )
    db.add_all([aarav, priya, rohit])
    db.commit()

    now = datetime.now(timezone.utc)

    # 3. Seed Realistic Complaints across various workflow stages
    # Complaint 1: In Progress (IT & Wi-Fi)
    c1 = Complaint(
        tracking_number="CMP-2026-0001",
        title="High-latency and dropped packets on Hostel 4 3rd floor Wi-Fi",
        description="Wi-Fi signal shows full bars but packet loss is exceeding 35%, making online coursework and research paper access impossible during evening hours.",
        category="IT and Wi-Fi",
        suggested_category="IT and Wi-Fi",
        ai_confidence=0.96,
        is_low_confidence=False,
        location="Hostel 4, 3rd Floor Corridor AP-12",
        priority="Medium",
        priority_reason="Standard operational issue with moderate impact on daily activities.",
        status="In Progress",
        student_id=aarav.id,
        department_id=departments["IT"].id,
        assigned_staff_id=it_staff.id,
        created_at=now - timedelta(days=2, hours=4),
        updated_at=now - timedelta(hours=3)
    )
    db.add(c1)
    db.flush()

    db.add_all([
        StatusHistory(complaint_id=c1.id, old_status=None, new_status="Submitted", action="created", changed_by_id=aarav.id, remarks="Submitted via student portal", created_at=now - timedelta(days=2, hours=4)),
        StatusHistory(complaint_id=c1.id, old_status="Submitted", new_status="In Progress", action="claimed", changed_by_id=it_staff.id, remarks="Assigned to network field team. Checking AP channel congestion.", created_at=now - timedelta(days=1, hours=2)),
        Comment(complaint_id=c1.id, author_id=aarav.id, content="The latency gets worse around 8 PM to 11 PM.", is_internal=False, created_at=now - timedelta(days=1)),
        Comment(complaint_id=c1.id, author_id=it_staff.id, content="Internal diagnostic: Switch port 14 shows flapping link. Dispatching technician with replacement patch cord.", is_internal=True, created_at=now - timedelta(hours=5)),
        Comment(complaint_id=c1.id, author_id=it_staff.id, content="We have rebooted the upstream switch and are monitoring signal stability today.", is_internal=False, created_at=now - timedelta(hours=3))
    ])

    # Complaint 2: Submitted (High Priority Electrical Hazard)
    c2 = Complaint(
        tracking_number="CMP-2026-0002",
        title="Sparking and burning smell from corridor switchboard near Room 204",
        description="Observed continuous sparking and audible crackling from the main 3-phase lighting switchboard outside Room 204. Students are avoiding the hallway due to smoke odor.",
        category="Electrical",
        suggested_category="Electrical",
        ai_confidence=0.98,
        is_low_confidence=False,
        location="Academic Block A, 2nd Floor Corridor outside Room 204",
        priority="High",
        priority_reason="Rule match: Immediate electrical or fire hazard detected.",
        status="Submitted",
        student_id=priya.id,
        department_id=departments["ELEC"].id,
        assigned_staff_id=None,
        created_at=now - timedelta(hours=2),
        updated_at=now - timedelta(hours=2)
    )
    db.add(c2)
    db.flush()
    db.add(StatusHistory(complaint_id=c2.id, old_status=None, new_status="Submitted", action="created", changed_by_id=priya.id, remarks="Urgent safety submission", created_at=now - timedelta(hours=2)))

    # Complaint 3: Resolved with 5-Star Feedback (Plumbing)
    c3 = Complaint(
        tracking_number="CMP-2026-0003",
        title="Major flush tank leakage flooding washroom floor",
        description="Cistern valve in 1st floor boys washroom was jammed open, wasting continuous streams of water and flooding the lobby entrance.",
        category="Plumbing",
        suggested_category="Plumbing",
        ai_confidence=0.95,
        is_low_confidence=False,
        location="Hostel 2, Ground Floor West Wing Washroom",
        priority="Medium",
        priority_reason="Utility maintenance requiring standard departmental attention within 24-48 hours.",
        status="Closed",
        student_id=rohit.id,
        department_id=departments["PLUMB"].id,
        assigned_staff_id=plumb_staff.id,
        resolution_notes="Replaced the corroded brass float valve and resealed the inlet washer. Inspected all 4 adjacent stalls.",
        resolved_at=now - timedelta(days=1),
        closed_at=now - timedelta(hours=18),
        created_at=now - timedelta(days=3),
        updated_at=now - timedelta(hours=18)
    )
    db.add(c3)
    db.flush()

    db.add_all([
        StatusHistory(complaint_id=c3.id, old_status=None, new_status="Submitted", action="created", changed_by_id=rohit.id, remarks="Submitted by student", created_at=now - timedelta(days=3)),
        StatusHistory(complaint_id=c3.id, old_status="Submitted", new_status="Assigned", action="assigned", changed_by_id=admin.id, remarks="Assigned to Ramesh Gupta", created_at=now - timedelta(days=2, hours=10)),
        StatusHistory(complaint_id=c3.id, old_status="Assigned", new_status="In Progress", action="status_transition", changed_by_id=plumb_staff.id, remarks="Procured replacement seal", created_at=now - timedelta(days=1, hours=6)),
        StatusHistory(complaint_id=c3.id, old_status="In Progress", new_status="Resolved", action="status_transition", changed_by_id=plumb_staff.id, remarks="Valve replaced and leak verified resolved.", created_at=now - timedelta(days=1)),
        StatusHistory(complaint_id=c3.id, old_status="Resolved", new_status="Closed", action="status_transition", changed_by_id=rohit.id, remarks="Confirmed leak is fixed, closing complaint.", created_at=now - timedelta(hours=18)),
        Feedback(complaint_id=c3.id, student_id=rohit.id, rating=5, comments="Fixed very quickly within 24 hours, excellent response by the plumbing team!", created_at=now - timedelta(hours=18))
    ])

    # Complaint 4: Reopened (Hostel Maintenance)
    c4 = Complaint(
        tracking_number="CMP-2026-0004",
        title="Water heater geyser in bathroom 302 not functioning",
        description="Geyser green light turns on but heating element does not heat water even after 45 minutes of operation.",
        category="Hostel maintenance",
        suggested_category="Hostel maintenance",
        ai_confidence=0.91,
        is_low_confidence=False,
        location="Hostel 6, 3rd Floor Common Washroom",
        priority="Medium",
        priority_reason="Standard operational issue with moderate impact on daily activities.",
        status="Reopened",
        student_id=aarav.id,
        department_id=departments["HOSTEL"].id,
        assigned_staff_id=hostel_staff.id,
        reopened_reason="The technician replaced the indicator lamp yesterday but the water is still completely cold today morning. Heating coil seems burned out.",
        created_at=now - timedelta(days=4),
        updated_at=now - timedelta(hours=6)
    )
    db.add(c4)
    db.flush()

    db.add_all([
        StatusHistory(complaint_id=c4.id, old_status=None, new_status="Submitted", action="created", changed_by_id=aarav.id, remarks="Submitted", created_at=now - timedelta(days=4)),
        StatusHistory(complaint_id=c4.id, old_status="Submitted", new_status="In Progress", action="claimed", changed_by_id=hostel_staff.id, remarks="Checking power supply to geyser", created_at=now - timedelta(days=3)),
        StatusHistory(complaint_id=c4.id, old_status="In Progress", new_status="Resolved", action="status_transition", changed_by_id=hostel_staff.id, remarks="Thermostat reset done", created_at=now - timedelta(days=1, hours=2)),
        StatusHistory(complaint_id=c4.id, old_status="Resolved", new_status="Reopened", action="status_transition", changed_by_id=aarav.id, remarks="Water remains cold, heating coil needs replacement.", created_at=now - timedelta(hours=6))
    ])

    # Complaint 5: Classroom Equipment (Assigned)
    c5 = Complaint(
        tracking_number="CMP-2026-0005",
        title="Ceiling projector HDMI signal flickering in Lecture Audi 1",
        description="Projector HDMI feed blinks every 30 seconds with purple color distortion, disrupting ongoing computer graphics lectures.",
        category="Classroom and laboratory equipment",
        suggested_category="Classroom and laboratory equipment",
        ai_confidence=0.97,
        is_low_confidence=False,
        location="Main Academic Building, Lecture Auditorium 1",
        priority="High",
        priority_reason="Rule match: Disrupts active examinations or academic evaluations.",
        status="Assigned",
        student_id=priya.id,
        department_id=departments["ACAD"].id,
        assigned_staff_id=acad_staff.id,
        created_at=now - timedelta(days=1, hours=8),
        updated_at=now - timedelta(hours=14)
    )
    db.add(c5)
    db.flush()
    db.add(StatusHistory(complaint_id=c5.id, old_status=None, new_status="Submitted", action="created", changed_by_id=priya.id, remarks="Submitted", created_at=now - timedelta(days=1, hours=8)))
    db.add(StatusHistory(complaint_id=c5.id, old_status="Submitted", new_status="Assigned", action="assigned", changed_by_id=admin.id, remarks="Assigned to Dr. Vikram Rao", created_at=now - timedelta(hours=14)))

    # Complaint 6: Low Confidence / Admin Review Queue
    c6 = Complaint(
        tracking_number="CMP-2026-0006",
        title="Unusual vibrating hum and vibration in ground floor wall near elevator",
        description="There is an ambiguous humming noise coming from inside the wall between the staircase and elevator shaft. Unclear whether it is mechanical pump or ventilation fan.",
        category="Other",
        suggested_category="Other",
        ai_confidence=0.48,  # Below 60% -> Low confidence routing
        is_low_confidence=True,
        location="Science Tower, Ground Floor Elevator Shaft",
        priority="Medium",
        priority_reason="Standard operational issue with moderate impact on daily activities.",
        status="Submitted",
        student_id=rohit.id,
        department_id=None,  # Unassigned -> In Admin Review Queue
        assigned_staff_id=None,
        created_at=now - timedelta(hours=10),
        updated_at=now - timedelta(hours=10)
    )
    db.add(c6)
    db.flush()
    db.add(StatusHistory(complaint_id=c6.id, old_status=None, new_status="Submitted", action="created", changed_by_id=rohit.id, remarks="AI confidence 48% < 60%. Routed to Admin Review queue.", created_at=now - timedelta(hours=10)))

    # Complaint 7: Resolved (Sanitation)
    c7 = Complaint(
        tracking_number="CMP-2026-0007",
        title="Corridor garbage dumpster overflowing near Canteen entry",
        description="Waste bags piled up outside the main bin container attracting flies and causing unhygienic corridor environment.",
        category="Sanitation",
        suggested_category="Sanitation",
        ai_confidence=0.95,
        is_low_confidence=False,
        location="Student Activity Centre, Canteen Rear Entry",
        priority="Medium",
        priority_reason="Standard operational issue with moderate impact on daily activities.",
        status="Resolved",
        student_id=aarav.id,
        department_id=departments["SANIT"].id,
        assigned_staff_id=None,
        resolution_notes="Dumpster emptied, perimeter sanitized with disinfectant spray, extra secondary bin installed.",
        resolved_at=now - timedelta(hours=4),
        created_at=now - timedelta(days=1),
        updated_at=now - timedelta(hours=4)
    )
    db.add(c7)
    db.flush()
    db.add_all([
        StatusHistory(complaint_id=c7.id, old_status=None, new_status="Submitted", action="created", changed_by_id=aarav.id, remarks="Submitted", created_at=now - timedelta(days=1)),
        StatusHistory(complaint_id=c7.id, old_status="Submitted", new_status="In Progress", action="status_transition", changed_by_id=admin.id, remarks="Sanitation contractor dispatched", created_at=now - timedelta(hours=8)),
        StatusHistory(complaint_id=c7.id, old_status="In Progress", new_status="Resolved", action="status_transition", changed_by_id=admin.id, remarks="Sanitized and cleared", created_at=now - timedelta(hours=4))
    ])

    # Complaint 8: Potential Duplicate of Complaint 1 (Wi-Fi issue in Hostel 4)
    c8 = Complaint(
        tracking_number="CMP-2026-0008",
        title="Hostel 4 3rd floor Wi-Fi keeps disconnecting every few minutes",
        description="Cannot connect to internet from room 308 in hostel 4, the signal drops constantly since yesterday.",
        category="IT and Wi-Fi",
        suggested_category="IT and Wi-Fi",
        ai_confidence=0.94,
        is_low_confidence=False,
        location="Hostel 4, Room 308, 3rd Floor",
        priority="Medium",
        priority_reason="Standard operational issue with moderate impact on daily activities.",
        status="Submitted",
        student_id=priya.id,
        department_id=departments["IT"].id,
        assigned_staff_id=None,
        created_at=now - timedelta(hours=1),
        updated_at=now - timedelta(hours=1)
    )
    db.add(c8)
    db.flush()

    # Link duplicate manually between c1 and c8
    dup_link = DuplicateLink(
        primary_complaint_id=c1.id,
        duplicate_complaint_id=c8.id,
        similarity_score=0.82,
        notes="Related to the same faulty 3rd floor Wi-Fi access point in Hostel 4.",
        linked_by_id=it_staff.id,
        created_at=now - timedelta(minutes=30)
    )
    db.add(dup_link)

    # In-app notifications
    db.add_all([
        Notification(user_id=aarav.id, title="Complaint Status Updated", message="Your complaint CMP-2026-0001 is now In Progress with Arjun Mehta.", link=f"/complaints/{c1.id}", created_at=now - timedelta(days=1)),
        Notification(user_id=priya.id, title="High Priority Safety Alert", message="Your complaint CMP-2026-0002 has been flagged as High Priority and routed to Electrical Department.", link=f"/complaints/{c2.id}", created_at=now - timedelta(hours=2)),
        Notification(user_id=it_staff.id, title="New Assigned Complaint", message="CMP-2026-0001 has been assigned to you.", link=f"/complaints/{c1.id}", created_at=now - timedelta(days=1, hours=2)),
        Notification(user_id=admin.id, title="Admin Review Required", message="Complaint CMP-2026-0006 has low AI confidence (48%) and requires review.", link=f"/complaints/{c6.id}", created_at=now - timedelta(hours=10))
    ])

    db.commit()
    db.close()
    print("Database seeding completed successfully!")
    print("\n--- Demo Accounts Created ---")
    print("Administrator: admin@campuscare.edu / Admin@123")
    print("IT Staff:      it_staff@campuscare.edu / Staff@123")
    print("Elec Staff:    electrical_staff@campuscare.edu / Staff@123")
    print("Hostel Staff:  hostel_staff@campuscare.edu / Staff@123")
    print("Student 1:     alex.student@campuscare.edu / Student@123  (Aarav Sharma)")
    print("Student 2:     maria.student@campuscare.edu / Student@123  (Priya Iyer)")
    print("Student 3:     rohit.student@campuscare.edu / Student@123  (Rohit Sharma)")

if __name__ == "__main__":
    seed()
