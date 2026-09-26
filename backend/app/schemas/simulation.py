from typing import List, Dict
from pydantic import BaseModel, Field

class SimulationParams(BaseModel):
    patients_per_day: int = Field(default=120, ge=10, le=2000, description="Total patients expected daily")
    images_per_patient: int = Field(default=2, ge=1, le=4, description="Fundus images per patient")
    camera_count: int = Field(default=2, ge=1, le=20, description="Available fundus cameras at PHC")
    image_capture_time_min: float = Field(default=4.0, ge=1.0, le=20.0, description="Imaging time per patient (mins)")
    bandwidth_mbps: float = Field(default=2.5, ge=0.05, le=100.0, description="Rural uplink connection speed (Mbps)")
    network_latency_ms: int = Field(default=250, ge=10, le=3000, description="Network latency roundtrip (ms)")
    ai_inference_time_sec: float = Field(default=1.8, ge=0.1, le=30.0, description="Inference & Grad-CAM time (secs)")
    doctor_count: int = Field(default=3, ge=1, le=50, description="District ophthalmologists on duty")
    doctor_review_time_min: float = Field(default=3.5, ge=0.5, le=15.0, description="Doctor review time per case (mins)")
    referral_rate_pct: float = Field(default=28.0, ge=1.0, le=100.0, description="Percentage of cases requiring specialist review")
    work_shift_hours: float = Field(default=8.0, ge=1.0, le=24.0, description="Operating hours per screening camp")

class HourlyQueuePoint(BaseModel):
    hour: int
    arrivals: int
    screened: int
    transmitted: int
    reviewed: int
    queue_cameras: int
    queue_telecom: int
    queue_doctors: int

class SimulationResult(BaseModel):
    total_requested: int
    total_screened: int
    screening_completion_rate_pct: float
    total_referrals_generated: int
    total_doctor_reviews_completed: int
    doctor_review_backlog: int
    average_patient_turnaround_time_min: float
    camera_utilization_pct: float
    network_uplink_utilization_pct: float
    doctor_utilization_pct: float
    primary_bottleneck: str # "CAMERA_CAPACITY" | "TELECOM_BANDWIDTH" | "DOCTOR_SHORTAGE" | "OPTIMAL_FLOW"
    bottleneck_severity: str # "LOW" | "MODERATE" | "CRITICAL"
    recommendations: List[str]
    hourly_breakdown: List[HourlyQueuePoint]
