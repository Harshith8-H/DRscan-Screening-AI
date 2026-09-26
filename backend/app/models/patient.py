from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String(10), nullable=False)  # Male, Female, Other
    diabetes_duration_years = Column(Float, nullable=True)
    phone = Column(String(20), nullable=True)
    village_or_phc = Column(String(100), nullable=True)
    blood_sugar_fasting = Column(Float, nullable=True)   # mg/dL
    hba1c = Column(Float, nullable=True)                # %
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    screenings = relationship("Screening", back_populates="patient", cascade="all, delete-orphan")
