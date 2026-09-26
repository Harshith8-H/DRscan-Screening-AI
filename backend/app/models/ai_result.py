from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class AIResult(Base):
    __tablename__ = "ai_results"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"), unique=True, nullable=False)
    
    # Classification
    dr_level = Column(Integer, nullable=False) # 0 to 4
    label = Column(String(50), nullable=False) # e.g. "Moderate NPDR (Grade 2)"
    confidence = Column(Float, nullable=False) # 0.0 to 1.0
    referable = Column(Boolean, nullable=False) # True if dr_level >= 2
    
    # Class probabilities stored as JSON string
    class_probabilities_json = Column(Text, nullable=True)

    # Explainability artifacts paths
    gradcam_path = Column(String(255), nullable=True)
    lesion_mask_path = Column(String(255), nullable=True)
    annotated_path = Column(String(255), nullable=True)

    # Recommendation
    recommendation_action = Column(String(100), nullable=False)
    recommendation_urgency = Column(String(50), nullable=False)
    recommendation_reason = Column(Text, nullable=False)
    clinical_guideline = Column(Text, nullable=True)

    # Model tracking
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=False)
    inference_time_ms = Column(Float, default=0.0)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship
    screening = relationship("Screening", back_populates="ai_result")
