from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class PatientBase(BaseModel):
    name: str
    age: int
    sex: str
    diabetes_duration_years: Optional[float] = None
    phone: Optional[str] = None
    village_or_phc: Optional[str] = None
    blood_sugar_fasting: Optional[float] = None
    hba1c: Optional[float] = None
    notes: Optional[str] = None

class PatientCreate(PatientBase):
    patient_code: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    patient_code: str
    created_at: datetime
    screenings_count: Optional[int] = 0

    class Config:
        from_attributes = True

class PatientLongitudinalEntry(BaseModel):
    screening_id: str
    date: datetime
    eye_side: str
    dr_level: Optional[int] = None
    label: Optional[str] = None
    confidence: Optional[float] = None
    referable: Optional[bool] = None
    image_url: str
    gradcam_url: Optional[str] = None
    doctor_decision: Optional[str] = None

class PatientHistoryResponse(BaseModel):
    patient: PatientResponse
    screenings: List[PatientLongitudinalEntry]
    progression_alert: Optional[str] = None
    risk_trend: Optional[str] = None
