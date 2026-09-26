from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class DoctorReviewCreate(BaseModel):
    screening_id: str
    decision: str # "CONFIRMED" | "MODIFIED" | "REJECTED" | "REQUIRES_FURTHER_REVIEW"
    final_dr_level: Optional[int] = None # 0 to 4
    clinical_notes: Optional[str] = None
    referral_facility: Optional[str] = "District Tertiary Eye Care Hospital"

class DoctorReviewResponse(BaseModel):
    id: int
    screening_id: str
    doctor_id: int
    doctor_name: str
    decision: str
    final_dr_level: Optional[int] = None
    clinical_notes: Optional[str] = None
    referral_facility: Optional[str] = None
    reviewed_at: datetime

    class Config:
        from_attributes = True
