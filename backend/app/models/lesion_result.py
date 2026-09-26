from sqlalchemy import Column, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base

class LesionResult(Base):
    __tablename__ = "lesion_results"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"), unique=True, nullable=False)
    
    microaneurysms = Column(Integer, default=0, nullable=False)
    hemorrhages = Column(Integer, default=0, nullable=False)
    exudates = Column(Integer, default=0, nullable=False)
    cotton_wool_spots = Column(Integer, default=0, nullable=False)
    foveal_involvement = Column(Boolean, default=False, nullable=False)

    # Relationship
    screening = relationship("Screening", back_populates="lesion_result")
