from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class ReviewDecision(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    MODIFIED = "MODIFIED"
    REJECTED = "REJECTED"
    REQUIRES_FURTHER_REVIEW = "REQUIRES_FURTHER_REVIEW"

class DoctorReview(Base):
    __tablename__ = "doctor_reviews"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"), unique=True, nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    decision = Column(String(50), default=ReviewDecision.CONFIRMED.value, nullable=False)
    final_dr_level = Column(Integer, nullable=True) # Overridden or confirmed DR level
    clinical_notes = Column(Text, nullable=True)
    referral_facility = Column(String(150), nullable=True) # E.g. "District Tertiary Eye Care Hospital"
    reviewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    screening = relationship("Screening", back_populates="doctor_review")
    doctor = relationship("User")
