from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    suggested_category = Column(String(100), nullable=True)
    ai_confidence = Column(Float, nullable=True)
    is_low_confidence = Column(Boolean, default=False)
    
    location = Column(String(200), nullable=False)
    priority = Column(String(20), nullable=False, default="Medium")  # 'Low', 'Medium', 'High'
    priority_reason = Column(String(255), nullable=True)
    status = Column(String(30), nullable=False, default="Submitted", index=True)  # 'Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Reopened'
    
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    assigned_staff_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    resolution_notes = Column(Text, nullable=True)
    reopened_reason = Column(Text, nullable=True)
    
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="submitted_complaints")
    department = relationship("Department", back_populates="complaints")
    assigned_staff = relationship("User", foreign_keys=[assigned_staff_id], back_populates="assigned_complaints")
    
    attachments = relationship("Attachment", back_populates="complaint", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="complaint", cascade="all, delete-orphan", order_by="Comment.created_at")
    status_history = relationship("StatusHistory", back_populates="complaint", cascade="all, delete-orphan", order_by="StatusHistory.created_at")
    feedback = relationship("Feedback", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    
    # Duplicate relationships
    duplicate_of = relationship(
        "DuplicateLink",
        foreign_keys="DuplicateLink.duplicate_complaint_id",
        back_populates="duplicate_complaint",
        cascade="all, delete-orphan"
    )
    duplicates = relationship(
        "DuplicateLink",
        foreign_keys="DuplicateLink.primary_complaint_id",
        back_populates="primary_complaint",
        cascade="all, delete-orphan"
    )
