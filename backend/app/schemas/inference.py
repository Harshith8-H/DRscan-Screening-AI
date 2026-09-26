from typing import Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ModelInfo(BaseModel):
    name: str
    version: str
    architecture: str
    dataset: str
    input_size: str


class PredictionInfo(BaseModel):
    dr_level: int
    label: str
    confidence: float
    referable: bool
    class_probabilities: Dict[str, float] = Field(default_factory=dict)


class QualityMetrics(BaseModel):
    score: float
    status: str
    sharpness: float = 0.0
    illumination: float = 0.0
    is_acceptable: bool
    issues: List[str] = Field(default_factory=list)


class LesionsInfo(BaseModel):
    # EfficientNet-B0 is a classification model. These stay zero
    # unless a real lesion detector is connected.
    microaneurysms: int = 0
    hemorrhages: int = 0
    exudates: int = 0
    cotton_wool_spots: int = 0
    foveal_involvement: bool = False


class SalientRegion(BaseModel):
    x1: float = 0.0
    y1: float = 0.0
    x2: float = 0.0
    y2: float = 0.0
    label: Optional[str] = None
    score: Optional[float] = None


class ExplainabilityInfo(BaseModel):
    gradcam_available: bool = False

    # IMPORTANT:
    # heatmap_url is intentionally the MATLAB Grad-CAM OVERLAY.
    # This is what the UI should show in the Grad-CAM tab.
    heatmap_url: Optional[str] = None

    # Real lesion mask. Currently null because EfficientNet itself
    # does not generate a lesion segmentation mask.
    lesion_mask_url: Optional[str] = None

    # Detection/annotated view. We use the same MATLAB Grad-CAM
    # overlay because that is the actual visual evidence generated
    # by the MATLAB pipeline.
    annotated_url: Optional[str] = None

    # MATLAB preprocessing output.
    preprocessed_url: Optional[str] = None

    salient_regions: List[SalientRegion] = Field(default_factory=list)


class LessonInfo(BaseModel):
    predicted_class: str
    confidence: float
    image_quality: float
    quality_status: str
    severity: str
    title: str
    description: str
    lesson: str
    action: str
    confidence_level: str
    summary: str


class RecommendationInfo(BaseModel):
    action: str
    urgency: str
    reason: str
    clinical_guideline: Optional[str] = None


class InferenceResponse(BaseModel):
    success: bool
    inference_time_ms: float
    model: ModelInfo
    prediction: PredictionInfo
    quality: QualityMetrics
    lesions: LesionsInfo
    explainability: ExplainabilityInfo
    recommendation: RecommendationInfo
    lesson: LessonInfo

    model_config = ConfigDict(from_attributes=True)
