from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.department import Department
from app.models.user import User
from app.models.complaint import Complaint
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("/", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).all()
    results = []
    for d in departments:
        staff_count = db.query(User).filter(User.department_id == d.id, User.role == "staff").count()
        active_complaints = db.query(Complaint).filter(
            Complaint.department_id == d.id,
            Complaint.status.in_(["Submitted", "Assigned", "In Progress", "Reopened"])
        ).count()
        results.append(DepartmentResponse(
            id=d.id,
            name=d.name,
            code=d.code,
            description=d.description,
            contact_email=d.contact_email,
            created_at=d.created_at,
            staff_count=staff_count,
            active_complaints_count=active_complaints
        ))
    return results

@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department_by_id(department_id: int, db: Session = Depends(get_db)):
    d = db.query(Department).filter(Department.id == department_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Department not found")
    staff_count = db.query(User).filter(User.department_id == d.id, User.role == "staff").count()
    active_complaints = db.query(Complaint).filter(
        Complaint.department_id == d.id,
        Complaint.status.in_(["Submitted", "Assigned", "In Progress", "Reopened"])
    ).count()
    return DepartmentResponse(
        id=d.id,
        name=d.name,
        code=d.code,
        description=d.description,
        contact_email=d.contact_email,
        created_at=d.created_at,
        staff_count=staff_count,
        active_complaints_count=active_complaints
    )

@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    request: DepartmentCreate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    existing = db.query(Department).filter(
        (Department.name == request.name) | (Department.code == request.code.upper())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name or code already exists.")

    dept = Department(
        name=request.name,
        code=request.code.upper(),
        description=request.description,
        contact_email=request.contact_email
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return DepartmentResponse(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        contact_email=dept.contact_email,
        created_at=dept.created_at,
        staff_count=0,
        active_complaints_count=0
    )

@router.put("/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: int,
    request: DepartmentUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    if request.name:
        dept.name = request.name
    if request.code:
        dept.code = request.code.upper()
    if request.description is not None:
        dept.description = request.description
    if request.contact_email is not None:
        dept.contact_email = request.contact_email

    db.commit()
    db.refresh(dept)
    
    staff_count = db.query(User).filter(User.department_id == dept.id, User.role == "staff").count()
    active_complaints = db.query(Complaint).filter(
        Complaint.department_id == dept.id,
        Complaint.status.in_(["Submitted", "Assigned", "In Progress", "Reopened"])
    ).count()

    return DepartmentResponse(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        contact_email=dept.contact_email,
        created_at=dept.created_at,
        staff_count=staff_count,
        active_complaints_count=active_complaints
    )

@router.get("/{department_id}/staff", response_model=List[UserResponse])
def get_department_staff(
    department_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    staff_members = db.query(User).filter(
        User.department_id == department_id,
        User.role == "staff",
        User.is_active == True
    ).all()
    results = []
    for s in staff_members:
        results.append(UserResponse(
            id=s.id,
            email=s.email,
            full_name=s.full_name,
            role=s.role,
            department_id=s.department_id,
            department_name=s.department.name if s.department else None,
            is_active=s.is_active,
            created_at=s.created_at
        ))
    return results
