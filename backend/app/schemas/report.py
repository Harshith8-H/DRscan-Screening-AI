from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel
from app.schemas.patient import PatientResponse
from app.schemas.screening import ScreeningResponse
from app.schemas.inference import InferenceResponse
from app.schemas.review import DoctorReviewResponse

class ReportSummaryResponse(BaseModel):
    report_id: str
    generated_at: datetime
    patient: PatientResponse
    screening: ScreeningResponse
    inference: Optional[InferenceResponse] = None
    doctor_review: Optional[DoctorReviewResponse] = None
    pdf_download_url: str
    disclaimer: str
