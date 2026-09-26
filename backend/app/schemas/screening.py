from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.inference import InferenceResponse, QualityMetrics, LesionsInfo, ExplainabilityInfo, PredictionInfo, RecommendationInfo, ModelInfo
from app.schemas.patient import PatientResponse

class ScreeningCreate(BaseModel):
    patient_id: int
    eye_side: str = "RIGHT" # "LEFT" | "RIGHT"

class ScreeningResponse(BaseModel):
    id: int
    screening_id: str
    patient_id: int
    patient_name: Optional[str] = None
    patient_code: Optional[str] = None
    eye_side: str
    original_image_url: str
    status: str
    image_quality_score: Optional[float] = None
    image_quality_status: Optional[str] = None
    is_acceptable_quality: bool = True
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    dr_level: Optional[int] = None
    dr_label: Optional[str] = None
    confidence: Optional[float] = None
    referable: Optional[bool] = None
    review_decision: Optional[str] = None
    is_offline_queued: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class DoctorReviewDetail(BaseModel):
    id: int
    doctor_name: str
    decision: str
    final_dr_level: Optional[int] = None
    clinical_notes: Optional[str] = None
    referral_facility: Optional[str] = None
    reviewed_at: datetime

class ScreeningDetailResponse(BaseModel):
    screening: ScreeningResponse
    patient: PatientResponse
    inference: Optional[InferenceResponse] = None
    doctor_review: Optional[DoctorReviewDetail] = None
