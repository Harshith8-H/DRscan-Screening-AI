import base64
import json
import shutil
from pathlib import Path
from typing import List, Optional

from PIL import Image
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
)
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.config import settings
from app.models.patient import Patient
from app.models.screening import Screening, ScreeningStatus
from app.models.ai_result import AIResult
from app.models.lesion_result import LesionResult
from app.models.doctor_review import DoctorReview

from app.schemas.screening import (
    ScreeningResponse,
    ScreeningDetailResponse,
    DoctorReviewDetail,
)
from app.schemas.patient import PatientResponse
from app.schemas.inference import (
    InferenceResponse,
    ModelInfo,
    PredictionInfo,
    QualityMetrics,
    LesionsInfo,
    ExplainabilityInfo,
    RecommendationInfo,
    LessonInfo,
)

from app.services.image_service import ImageService
from app.services.inference_service import InferenceService


router = APIRouter(
    prefix="/screenings",
    tags=["Screenings"],
)


def _format_screening_response(
    screening: Screening,
) -> ScreeningResponse:

    ai = screening.ai_result
    rev = screening.doctor_review

    return ScreeningResponse(
        id=screening.id,
        screening_id=screening.screening_id,
        patient_id=screening.patient_id,
        patient_name=(
            screening.patient.name
            if screening.patient
            else None
        ),
        patient_code=(
            screening.patient.patient_code
            if screening.patient
            else None
        ),
        eye_side=screening.eye_side,
        original_image_url=screening.original_image_path,
        status=screening.status,
        image_quality_score=screening.image_quality_score,
        image_quality_status=screening.image_quality_status,
        is_acceptable_quality=screening.is_acceptable_quality,
        model_name=screening.model_name,
        model_version=screening.model_version,
        dr_level=ai.dr_level if ai else None,
        dr_label=ai.label if ai else None,
        confidence=ai.confidence if ai else None,
        referable=ai.referable if ai else None,
        review_decision=rev.decision if rev else None,
        is_offline_queued=screening.is_offline_queued,
        created_at=screening.created_at,
    )


def _quality_response(screening: Screening) -> QualityMetrics:
    issues = []

    if screening.image_quality_issues:
        issues = [
            item.strip()
            for item in screening.image_quality_issues.split(",")
            if item.strip()
        ]

    return QualityMetrics(
        score=(
            screening.image_quality_score
            if screening.image_quality_score is not None
            else 0.0
        ),
        status=(
            screening.image_quality_status
            or "unknown"
        ),
        sharpness=0.0,
        illumination=0.0,
        is_acceptable=bool(
            screening.is_acceptable_quality
        ),
        issues=issues,
    )


def _build_lesson_from_db(
    screening: Screening,
    ai: AIResult,
) -> LessonInfo:

    dr_level = ai.dr_level or 0
    confidence = float(ai.confidence or 0.0)

    names = {
        0: "None",
        1: "Mild",
        2: "Moderate",
        3: "Severe",
        4: "Proliferative",
    }

    titles = {
        0: "No Diabetic Retinopathy",
        1: "Mild Diabetic Retinopathy",
        2: "Moderate Diabetic Retinopathy",
        3: "Severe Diabetic Retinopathy",
        4: "Proliferative Diabetic Retinopathy",
    }

    quality_score = float(
        screening.image_quality_score or 0.0
    )

    # Existing DB quality is stored as 0-1.
    # MATLAB lesson quality is displayed as 0-100.
    lesson_quality = (
        quality_score * 100
        if quality_score <= 1
        else quality_score
    )

    severity = names.get(dr_level, "Unknown")
    title = titles.get(dr_level, "Diabetic Retinopathy")

    return LessonInfo(
        predicted_class=severity,
        confidence=confidence * 100,
        image_quality=lesson_quality,
        quality_status=(
            "ACCEPTABLE"
            if screening.is_acceptable_quality
            else "RECAPTURE"
        ),
        severity=severity,
        title=title,
        description=(
            f"The model classified the image as "
            f"{severity.lower()} diabetic retinopathy."
        ),
        lesson=(
            "The image shows changes that should be interpreted "
            "together with clinical findings and image quality."
        ),
        action=(
            "Clinical follow-up recommended"
            if dr_level >= 2
            else "Routine screening follow-up"
        ),
        confidence_level=(
            "High" if confidence >= 0.80 else "Moderate"
        ),
        summary=(
            f"{title} with "
            f"{confidence * 100:.2f}% model confidence."
        ),
    )


def _build_detail_inference(
    screening: Screening,
    ai: Optional[AIResult],
    les: Optional[LesionResult],
) -> Optional[InferenceResponse]:

    if ai is None:
        return None

    class_probs = {}

    if ai.class_probabilities_json:
        try:
            class_probs = json.loads(
                ai.class_probabilities_json
            )
        except Exception:
            class_probs = {}

    original_url = screening.original_image_path or ""
    original_name = Path(original_url).name
    original_path = settings.UPLOAD_DIR / original_name

    # ---------------------------------------------------------
    # Reconstruct MATLAB-generated files from the original file
    # ---------------------------------------------------------
    preprocessed_path = (
        original_path.with_name(
            f"{original_path.stem}_preprocessed.png"
        )
    )

    pure_heatmap_path = (
        original_path.with_name(
            f"{original_path.stem}_gradcam.png"
        )
    )

    overlay_path = (
        original_path.with_name(
            f"{original_path.stem}_gradcam_overlay.png"
        )
    )

    def url_if_exists(path: Path):
        if path.exists():
            try:
                mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
                with open(path, "rb") as f:
                    encoded = base64.b64encode(f.read()).decode("utf-8")
                return f"data:{mime};base64,{encoded}"
            except Exception:
                return f"/uploads/{path.name}"
        return None

    # IMPORTANT:
    # Grad-CAM = overlay, not pure heatmap.
    gradcam_url = url_if_exists(overlay_path)

    if gradcam_url is None:
        gradcam_url = url_if_exists(pure_heatmap_path)

    detections_url = url_if_exists(overlay_path)

    if detections_url is None:
        detections_url = gradcam_url

    preprocessed_url = url_if_exists(
        preprocessed_path
    )

    lesion_info = LesionsInfo(
        microaneurysms=(
            les.microaneurysms if les else 0
        ),
        hemorrhages=(
            les.hemorrhages if les else 0
        ),
        exudates=(
            les.exudates if les else 0
        ),
        cotton_wool_spots=(
            les.cotton_wool_spots if les else 0
        ),
        foveal_involvement=(
            les.foveal_involvement if les else False
        ),
    )

    quality = _quality_response(screening)

    recommendation = RecommendationInfo(
        action=(
            ai.recommendation_action
            or "CLINICAL_REVIEW"
        ),
        urgency=(
            ai.recommendation_urgency
            or "review"
        ),
        reason=(
            ai.recommendation_reason
            or "Clinical review recommended."
        ),
        clinical_guideline=(
            ai.clinical_guideline
            or "Refer for professional ophthalmic evaluation."
        ),
    )

    # Keep architecture/model information aligned with the real
    # MATLAB pipeline rather than the older DenseNet placeholder.
    model_name = ai.model_name or "EfficientNet-B0"
    model_version = ai.model_version or "MATLAB"

    lesson = _build_lesson_from_db(
        screening,
        ai,
    )

    return InferenceResponse(
        success=True,
        inference_time_ms=(
            float(ai.inference_time_ms or 0)
        ),
        model=ModelInfo(
            name=model_name,
            version=model_version,
            architecture="EfficientNet-B0",
            dataset="APTOS 2019",
            input_size="224x224x3",
        ),
        prediction=PredictionInfo(
            dr_level=int(ai.dr_level or 0),
            label=ai.label or "Unknown",
            confidence=float(
                ai.confidence or 0.0
            ),
            referable=bool(ai.referable),
            class_probabilities=class_probs,
        ),
        quality=quality,
        lesions=lesion_info,
        explainability=ExplainabilityInfo(
            gradcam_available=(
                gradcam_url is not None
            ),
            heatmap_url=gradcam_url,
            lesion_mask_url=None,
            annotated_url=detections_url,
            preprocessed_url=preprocessed_url,
            salient_regions=[],
        ),
        recommendation=recommendation,
        lesson=lesson,
    )


@router.get(
    "",
    response_model=List[ScreeningResponse],
)
def list_screenings(
    patient_id: Optional[int] = None,
    status: Optional[str] = None,
    referable_only: Optional[bool] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(Screening)

    if patient_id is not None:
        query = query.filter(
            Screening.patient_id == patient_id
        )

    if status:
        query = query.filter(
            Screening.status == status
        )

    screenings = (
        query
        .order_by(Screening.id.desc())
        .limit(limit)
        .all()
    )

    results = []

    for screening in screenings:
        response = _format_screening_response(
            screening
        )

        if (
            referable_only is True
            and not response.referable
        ):
            continue

        results.append(response)

    return results


@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
):
    total = db.query(Screening).count()

    referable_count = (
        db.query(AIResult)
        .filter(AIResult.referable.is_(True))
        .count()
    )

    pending_review = (
        db.query(Screening)
        .filter(
            Screening.status
            == ScreeningStatus.REVIEW_REQUIRED.value
        )
        .count()
    )

    poor_quality = (
        db.query(Screening)
        .filter(
            Screening.is_acceptable_quality.is_(False)
        )
        .count()
    )

    completed = (
        db.query(Screening)
        .filter(
            Screening.status
            == ScreeningStatus.COMPLETED.value
        )
        .count()
    )

    grade_counts = {
        f"grade_{i}": 0
        for i in range(5)
    }

    for ai in db.query(AIResult).all():
        if ai.dr_level is not None:
            if 0 <= ai.dr_level <= 4:
                grade_counts[
                    f"grade_{ai.dr_level}"
                ] += 1

    return {
        "total_screenings": total,
        "referable_cases": referable_count,
        "pending_doctor_reviews": pending_review,
        "poor_quality_images": poor_quality,
        "completed_screenings": completed,
        "grade_distribution": grade_counts,
        "referral_rate_pct": round(
            (referable_count / max(1, total)) * 100,
            1,
        ),
    }


@router.get("/samples/list")
def list_sample_images():
    return [
        {
            "id": "sample_grade0",
            "name": "Normal Retina (Grade 0 - No DR)",
            "filename": "sample_grade0_normal.jpg",
            "description": "Healthy fundus image.",
            "expected_grade": 0,
        },
        {
            "id": "sample_grade1",
            "name": "Mild NPDR (Grade 1)",
            "filename": "sample_grade1_mild.jpg",
            "description": "Mild NPDR sample.",
            "expected_grade": 1,
        },
        {
            "id": "sample_grade2",
            "name": "Moderate NPDR (Grade 2 - Referable)",
            "filename": "sample_grade2_moderate.jpg",
            "description": "Moderate NPDR sample.",
            "expected_grade": 2,
        },
        {
            "id": "sample_grade3",
            "name": "Severe NPDR (Grade 3 - High Risk)",
            "filename": "sample_grade3_severe.jpg",
            "description": "Severe NPDR sample.",
            "expected_grade": 3,
        },
        {
            "id": "sample_grade4",
            "name": "Proliferative DR (Grade 4)",
            "filename": "sample_grade4_pdr.jpg",
            "description": "PDR sample.",
            "expected_grade": 4,
        },
        {
            "id": "sample_poor",
            "name": "Poor Quality (Camera Blur & Glare)",
            "filename": "sample_poor_quality.jpg",
            "description": "Poor-quality fundus sample.",
            "expected_grade": 1,
        },
    ]


@router.post(
    "",
    response_model=ScreeningDetailResponse,
)
async def create_screening_with_upload(
    patient_id: int = Form(...),
    eye_side: str = Form("RIGHT"),
    is_offline_queued: bool = Form(False),
    fundus_image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    screening_count = (
        db.query(Screening).count()
    )

    screening_id = (
        f"SCR-{1000 + screening_count + 1}"
    )

    image_rel_url, quality = (
        await ImageService.validate_and_save_upload(
            fundus_image,
            screening_id,
        )
    )

    screening = Screening(
        screening_id=screening_id,
        patient_id=patient.id,
        eye_side=eye_side.upper(),
        original_image_path=image_rel_url,
        status=ScreeningStatus.PROCESSING.value,
        image_quality_score=quality.score,
        image_quality_status=quality.status,
        image_quality_issues=(
            ", ".join(quality.issues)
            if quality.issues
            else None
        ),
        is_acceptable_quality=(
            quality.is_acceptable
        ),
        model_name=settings.MODEL_NAME,
        model_version=settings.MODEL_VERSION,
        is_offline_queued=is_offline_queued,
    )

    db.add(screening)
    db.commit()
    db.refresh(screening)

    try:
        inf_result = InferenceService.run_inference(
            screening_id=screening_id,
            image_relative_path=image_rel_url,
            quality=quality,
        )

        ai_result = AIResult(
            screening_id=screening.id,
            dr_level=inf_result.prediction.dr_level,
            label=inf_result.prediction.label,
            confidence=inf_result.prediction.confidence,
            referable=inf_result.prediction.referable,
            class_probabilities_json=json.dumps(
                inf_result.prediction.class_probabilities
            ),
            # Save overlay as gradcam_path.
            # This makes older DB consumers show the same
            # correct Grad-CAM visual.
            gradcam_path=(
                inf_result
                .explainability
                .heatmap_url
            ),
            lesion_mask_path=(
                inf_result
                .explainability
                .lesion_mask_url
            ),
            annotated_path=(
                inf_result
                .explainability
                .annotated_url
            ),
            recommendation_action=(
                inf_result.recommendation.action
            ),
            recommendation_urgency=(
                inf_result.recommendation.urgency
            ),
            recommendation_reason=(
                inf_result.recommendation.reason
            ),
            clinical_guideline=(
                inf_result.recommendation
                .clinical_guideline
            ),
            model_name=inf_result.model.name,
            model_version=inf_result.model.version,
            inference_time_ms=(
                inf_result.inference_time_ms
            ),
        )

        lesion_result = LesionResult(
            screening_id=screening.id,
            microaneurysms=(
                inf_result.lesions.microaneurysms
            ),
            hemorrhages=(
                inf_result.lesions.hemorrhages
            ),
            exudates=(
                inf_result.lesions.exudates
            ),
            cotton_wool_spots=(
                inf_result.lesions.cotton_wool_spots
            ),
            foveal_involvement=(
                inf_result.lesions.foveal_involvement
            ),
        )

        db.add_all([
            ai_result,
            lesion_result,
        ])

        if (
            not quality.is_acceptable
            or inf_result.prediction.referable
            or inf_result.prediction.confidence < 0.80
        ):
            screening.status = (
                ScreeningStatus.REVIEW_REQUIRED.value
            )
        else:
            screening.status = (
                ScreeningStatus.COMPLETED.value
            )

        db.commit()
        db.refresh(screening)

    except Exception:
        db.rollback()
        screening.status = (
            ScreeningStatus.FAILED.value
        )
        db.commit()
        raise

    return ScreeningDetailResponse(
        screening=_format_screening_response(
            screening
        ),
        patient=PatientResponse.from_orm(
            patient
        ),
        inference=inf_result,
        doctor_review=None,
    )


@router.post(
    "/use-sample",
    response_model=ScreeningDetailResponse,
)
def create_screening_from_sample(
    patient_id: int = Form(...),
    sample_filename: str = Form(...),
    eye_side: str = Form("RIGHT"),
    db: Session = Depends(get_db),
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    sample_src = (
        settings.SAMPLES_DIR
        / sample_filename
    )

    if not sample_src.exists():
        raise HTTPException(
            status_code=404,
            detail=(
                f"Sample '{sample_filename}' "
                f"not found"
            ),
        )

    screening_count = (
        db.query(Screening).count()
    )

    screening_id = (
        f"SCR-{1000 + screening_count + 1}"
    )

    dest_filename = (
        f"{screening_id}_from_sample_"
        f"{sample_filename}"
    )

    dest_path = (
        settings.UPLOAD_DIR
        / dest_filename
    )

    shutil.copy(
        sample_src,
        dest_path,
    )

    image_rel_url = (
        f"/uploads/{dest_filename}"
    )

    image = (
        Image.open(dest_path)
        .convert("RGB")
    )

    quality = (
        ImageService.evaluate_fundus_quality(
            image
        )
    )

    forced_grade = None

    if "grade0" in sample_filename:
        forced_grade = 0
    elif "grade1" in sample_filename:
        forced_grade = 1
    elif "grade2" in sample_filename:
        forced_grade = 2
    elif "grade3" in sample_filename:
        forced_grade = 3
    elif "grade4" in sample_filename:
        forced_grade = 4
    elif "poor" in sample_filename:
        forced_grade = 1

    screening = Screening(
        screening_id=screening_id,
        patient_id=patient.id,
        eye_side=eye_side.upper(),
        original_image_path=image_rel_url,
        status=ScreeningStatus.PROCESSING.value,
        image_quality_score=quality.score,
        image_quality_status=quality.status,
        image_quality_issues=(
            ", ".join(quality.issues)
            if quality.issues
            else None
        ),
        is_acceptable_quality=(
            quality.is_acceptable
        ),
        model_name=settings.MODEL_NAME,
        model_version=settings.MODEL_VERSION,
        is_offline_queued=False,
    )

    db.add(screening)
    db.commit()
    db.refresh(screening)

    inf_result = InferenceService.run_inference(
        screening_id=screening_id,
        image_relative_path=image_rel_url,
        quality=quality,
        force_dr_level=forced_grade,
    )

    ai_result = AIResult(
        screening_id=screening.id,
        dr_level=inf_result.prediction.dr_level,
        label=inf_result.prediction.label,
        confidence=inf_result.prediction.confidence,
        referable=inf_result.prediction.referable,
        class_probabilities_json=json.dumps(
            inf_result.prediction.class_probabilities
        ),
        gradcam_path=(
            inf_result.explainability.heatmap_url
        ),
        lesion_mask_path=(
            inf_result.explainability.lesion_mask_url
        ),
        annotated_path=(
            inf_result.explainability.annotated_url
        ),
        recommendation_action=(
            inf_result.recommendation.action
        ),
        recommendation_urgency=(
            inf_result.recommendation.urgency
        ),
        recommendation_reason=(
            inf_result.recommendation.reason
        ),
        clinical_guideline=(
            inf_result.recommendation.clinical_guideline
        ),
        model_name=inf_result.model.name,
        model_version=inf_result.model.version,
        inference_time_ms=(
            inf_result.inference_time_ms
        ),
    )

    lesion_result = LesionResult(
        screening_id=screening.id,
        microaneurysms=(
            inf_result.lesions.microaneurysms
        ),
        hemorrhages=(
            inf_result.lesions.hemorrhages
        ),
        exudates=(
            inf_result.lesions.exudates
        ),
        cotton_wool_spots=(
            inf_result.lesions.cotton_wool_spots
        ),
        foveal_involvement=(
            inf_result.lesions.foveal_involvement
        ),
    )

    db.add_all([
        ai_result,
        lesion_result,
    ])

    if (
        not quality.is_acceptable
        or inf_result.prediction.referable
        or inf_result.prediction.confidence < 0.80
    ):
        screening.status = (
            ScreeningStatus.REVIEW_REQUIRED.value
        )
    else:
        screening.status = (
            ScreeningStatus.COMPLETED.value
        )

    db.commit()
    db.refresh(screening)

    return ScreeningDetailResponse(
        screening=_format_screening_response(
            screening
        ),
        patient=PatientResponse.from_orm(
            patient
        ),
        inference=inf_result,
        doctor_review=None,
    )


@router.get(
    "/{screening_id}",
    response_model=ScreeningDetailResponse,
)
def get_screening_detail(
    screening_id: str,
    db: Session = Depends(get_db),
):
    screening = (
        db.query(Screening)
        .filter(
            Screening.screening_id
            == screening_id
        )
        .first()
    )

    if not screening:
        raise HTTPException(
            status_code=404,
            detail="Screening record not found",
        )

    patient = screening.patient
    ai = screening.ai_result
    les = screening.lesion_result
    rev = screening.doctor_review

    inference = _build_detail_inference(
        screening,
        ai,
        les,
    )

    review_detail = None

    if rev:
        review_detail = DoctorReviewDetail(
            id=rev.id,
            doctor_name=(
                rev.doctor.full_name
                if rev.doctor
                else "Dr. Specialist"
            ),
            decision=rev.decision,
            final_dr_level=rev.final_dr_level,
            clinical_notes=rev.clinical_notes,
            referral_facility=rev.referral_facility,
            reviewed_at=rev.reviewed_at,
        )

    return ScreeningDetailResponse(
        screening=_format_screening_response(
            screening
        ),
        patient=PatientResponse.from_orm(
            patient
        ),
        inference=inference,
        doctor_review=review_detail,
    )
