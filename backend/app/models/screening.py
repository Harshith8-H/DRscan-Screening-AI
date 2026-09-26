from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class ScreeningStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"

class Screening(Base):
    __tablename__ = "screenings"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    eye_side = Column(String(10), default="RIGHT", nullable=False) # LEFT, RIGHT
    original_image_path = Column(String(255), nullable=False)
    status = Column(String(30), default=ScreeningStatus.UPLOADED.value, nullable=False)
    
    # Image Quality Gate
    image_quality_score = Column(Float, nullable=True) # 0.0 - 1.0
    image_quality_status = Column(String(20), default="pending") # good, adequate, poor
    image_quality_issues = Column(String(255), nullable=True)
    is_acceptable_quality = Column(Boolean, default=True)

    # Model metadata
    model_name = Column(String(100), nullable=True)
    model_version = Column(String(50), nullable=True)

    # Rural connectivity / offline sync tracking
    is_offline_queued = Column(Boolean, default=False)
    synced_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    patient = relationship("Patient", back_populates="screenings")
    ai_result = relationship("AIResult", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    lesion_result = relationship("LesionResult", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    doctor_review = relationship("DoctorReview", back_populates="screening", uselist=False, cascade="all, delete-orphan")
