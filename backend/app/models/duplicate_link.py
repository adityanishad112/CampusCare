from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class DuplicateLink(Base):
    __tablename__ = "duplicate_links"

    id = Column(Integer, primary_key=True, index=True)
    primary_complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    duplicate_complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    similarity_score = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    linked_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    primary_complaint = relationship("Complaint", foreign_keys=[primary_complaint_id], back_populates="duplicates")
    duplicate_complaint = relationship("Complaint", foreign_keys=[duplicate_complaint_id], back_populates="duplicate_of")
    linked_by = relationship("User")
