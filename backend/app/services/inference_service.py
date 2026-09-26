import time
from pathlib import Path
from typing import Dict, Any, Optional

from app.core.config import settings
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
from app.services.efficientnet_service import EfficientNetService


DR_LABELS = {
    0: "No DR (Grade 0)",
    1: "Mild NPDR (Grade 1)",
    2: "Moderate NPDR (Grade 2)",
    3: "Severe NPDR (Grade 3)",
    4: "Proliferative DR (Grade 4)",
}

CLASS_TO_GRADE = {
    "No_DR": 0,
    "Mild": 1,
    "Moderate": 2,
    "Severe": 3,
    "Proliferative_DR": 4,
}


class InferenceService:

    @staticmethod
    def _url_for_upload(path: Optional[Path]) -> Optional[str]:
        if path is None or not path.exists():
            return None
        return f"/uploads/{path.name}"

    @staticmethod
    def _find_matlab_output(full_image_path: Path, suffix: str) -> Optional[Path]:
        """
        MATLAB saves files beside the input image:

          image.png
          image_preprocessed.png
          image_gradcam.png
          image_gradcam_overlay.png

        We resolve them from the original filename instead of relying
        on a database column that does not exist for these files.
        """
        candidate = full_image_path.with_name(
            f"{full_image_path.stem}{suffix}"
        )
        return candidate if candidate.exists() else None

    @staticmethod
    def _build_lesson(
        dr_level: int,
        confidence: float,
        quality: QualityMetrics,
        matlab_result: Dict[str, Any],
    ) -> LessonInfo:

        raw = matlab_result.get("lesson") or {}

        predicted_class = raw.get(
            "predicted_class",
            {
                0: "None",
                1: "Mild",
                2: "Moderate",
                3: "Severe",
                4: "Proliferative",
            }.get(dr_level, "Unknown"),
        )

        severity = raw.get(
            "severity",
            {
                0: "None",
                1: "Mild",
                2: "Moderate",
                3: "Severe",
                4: "Proliferative",
            }.get(dr_level, "Unknown"),
        )

        title = raw.get(
            "title",
            {
                0: "No Diabetic Retinopathy",
                1: "Mild Diabetic Retinopathy",
                2: "Moderate Diabetic Retinopathy",
                3: "Severe Diabetic Retinopathy",
                4: "Proliferative Diabetic Retinopathy",
            }.get(dr_level, "Diabetic Retinopathy"),
        )

        description = raw.get(
            "description",
            f"The model classified the image as {severity.lower()} diabetic retinopathy.",
        )

        lesson_text = raw.get(
            "lesson",
            "The image should be reviewed together with image quality and model evidence.",
        )

        action = raw.get(
            "action",
            "Clinical follow-up recommended"
            if dr_level >= 2
            else "Routine screening follow-up",
        )

        confidence_level = raw.get(
            "confidence_level",
            "High" if confidence >= 0.80 else "Moderate",
        )

        summary = raw.get(
            "summary",
            f"{title} with {confidence * 100:.2f}% model confidence.",
        )

        # MATLAB lesson quality is usually 0-100.
        raw_quality = raw.get("image_quality")
        if raw_quality is None:
            raw_quality = quality.score * 100

        quality_status = raw.get(
            "quality_status",
            "ACCEPTABLE" if quality.is_acceptable else "RECAPTURE",
        )

        return LessonInfo(
            predicted_class=str(predicted_class),
            confidence=float(raw.get("confidence", confidence * 100)),
            image_quality=float(raw_quality),
            quality_status=str(quality_status),
            severity=str(severity),
            title=str(title),
            description=str(description),
            lesson=str(lesson_text),
            action=str(action),
            confidence_level=str(confidence_level),
            summary=str(summary),
        )

    @staticmethod
    def run_inference(
        screening_id: str,
        image_relative_path: str,
        quality: QualityMetrics,
        force_dr_level: int = None,
    ) -> InferenceResponse:

        start_time = time.time()

        filename = Path(image_relative_path).name
        full_image_path = settings.UPLOAD_DIR / filename

        if not full_image_path.exists():
            full_image_path = settings.SAMPLES_DIR / filename

        if not full_image_path.exists():
            raise FileNotFoundError(
                f"Image not found: {filename}"
            )

        print()
        print("=" * 60)
        print("APTOS DR INFERENCE")
        print("=" * 60)
        print(f"Screening ID : {screening_id}")
        print(f"Image        : {full_image_path}")
        print()
        print("RUNNING MATLAB DR PIPELINE")

        # ---------------------------------------------------------
        # MATLAB / EfficientNet
        # ---------------------------------------------------------
        # The MATLAB bridge has existed in a few response formats
        # during development. Accept all of these: 
        #   {status: "success", prediction: ...}
        #   {success: true, prediction: ...}
        #   {prediction: ..., confidence: ...}
        #   {prediction: {label: ..., confidence: ...}}
        # This prevents a successful MATLAB run from being rejected
        # merely because the wrapper did not add a `status` field.
        matlab_result = EfficientNetService.predict(
            str(full_image_path)
        )

        if not isinstance(matlab_result, dict):
            raise RuntimeError(
                "MATLAB bridge returned an invalid response."
            )

        status = str(
            matlab_result.get("status", "")
        ).lower()
        explicit_success = matlab_result.get("success")

        prediction_block = matlab_result.get("prediction")

        if isinstance(prediction_block, dict):
            nested_prediction = prediction_block
            predicted_label = (
                nested_prediction.get("label")
                or nested_prediction.get("prediction")
                or nested_prediction.get("class")
                or "No_DR"
            )
            confidence = float(
                nested_prediction.get("confidence", 0.0)
            )
            probabilities = (
                nested_prediction.get("class_probabilities")
                or nested_prediction.get("probabilities")
                or matlab_result.get("probabilities")
                or {}
            )
        else:
            predicted_label = (
                prediction_block
                or matlab_result.get("raw_prediction")
                or "No_DR"
            )
            confidence = float(
                matlab_result.get("confidence", 0.0)
            )
            probabilities = (
                matlab_result.get("probabilities")
                or matlab_result.get("class_probabilities")
                or {}
            )

        # A successful MATLAB result is valid even if the wrapper
        # omitted the status/success convenience field.
        has_prediction = bool(predicted_label) and confidence >= 0.0
        if not (
            status == "success"
            or explicit_success is True
            or has_prediction
        ):
            raise RuntimeError(
                matlab_result.get(
                    "message",
                    "EfficientNet prediction failed.",
                )
            )

        predicted_label = str(predicted_label)

        # MATLAB can return class names with the longer display text.
        # Normalize them before mapping to APTOS grades.
        label_normalized = predicted_label.strip()
        if "Moderate" in label_normalized:
            label_normalized = "Moderate"
        elif "Mild" in label_normalized:
            label_normalized = "Mild"
        elif "Severe" in label_normalized:
            label_normalized = "Severe"
        elif "Proliferative" in label_normalized:
            label_normalized = "Proliferative_DR"
        elif "No DR" in label_normalized or "No_DR" in label_normalized:
            label_normalized = "No_DR"

        predicted_label = label_normalized

        # Normalize probability keys from either MATLAB class names
        # or the API's grade_0 ... grade_4 format.
        if probabilities:
            probabilities = dict(probabilities)
            if "No_DR" not in probabilities and "grade_0" in probabilities:
                probabilities["No_DR"] = probabilities.get("grade_0", 0.0)
            if "Mild" not in probabilities and "grade_1" in probabilities:
                probabilities["Mild"] = probabilities.get("grade_1", 0.0)
            if "Moderate" not in probabilities and "grade_2" in probabilities:
                probabilities["Moderate"] = probabilities.get("grade_2", 0.0)
            if "Severe" not in probabilities and "grade_3" in probabilities:
                probabilities["Severe"] = probabilities.get("grade_3", 0.0)
            if "Proliferative_DR" not in probabilities and "grade_4" in probabilities:
                probabilities["Proliferative_DR"] = probabilities.get("grade_4", 0.0)

        dr_level = CLASS_TO_GRADE.get(
            predicted_label,
            0,
        )

        if (
            force_dr_level is not None
            and 0 <= force_dr_level <= 4
        ):
            dr_level = force_dr_level
            predicted_label = {
                0: "No_DR",
                1: "Mild",
                2: "Moderate",
                3: "Severe",
                4: "Proliferative_DR",
            }[dr_level]

        class_probabilities: Dict[str, float] = {
            "grade_0": round(
                float(probabilities.get("No_DR", 0.0)),
                6,
            ),
            "grade_1": round(
                float(probabilities.get("Mild", 0.0)),
                6,
            ),
            "grade_2": round(
                float(probabilities.get("Moderate", 0.0)),
                6,
            ),
            "grade_3": round(
                float(probabilities.get("Severe", 0.0)),
                6,
            ),
            "grade_4": round(
                float(probabilities.get("Proliferative_DR", 0.0)),
                6,
            ),
        }

        referable = dr_level >= 2

        # EfficientNet classification does not produce real lesion
        # detections, so do not fabricate lesion counts.
        lesions = LesionsInfo(
            microaneurysms=0,
            hemorrhages=0,
            exudates=0,
            cotton_wool_spots=0,
            foveal_involvement=False,
        )

        # ---------------------------------------------------------
        # MATLAB visual outputs
        #
        # These files are actually generated by your MATLAB code:
        #
        # *_preprocessed.png
        # *_gradcam.png
        # *_gradcam_overlay.png
        #
        # The UI should use the OVERLAY for both Grad-CAM and
        # Detections. The pure heatmap is kept available as well.
        # ---------------------------------------------------------
        preprocessed_path = InferenceService._find_matlab_output(
            full_image_path,
            "_preprocessed.png",
        )

        pure_heatmap_path = InferenceService._find_matlab_output(
            full_image_path,
            "_gradcam.png",
        )

        overlay_path = InferenceService._find_matlab_output(
            full_image_path,
            "_gradcam_overlay.png",
        )

        # Grad-CAM tab = MATLAB overlay.
        # Detections tab = same real MATLAB overlay.
        gradcam_display_url = InferenceService._url_for_upload(
            overlay_path
        )

        annotated_url = InferenceService._url_for_upload(
            overlay_path
        )

        # If overlay is missing, fall back to the pure heatmap.
        if gradcam_display_url is None:
            gradcam_display_url = InferenceService._url_for_upload(
                pure_heatmap_path
            )

        if annotated_url is None:
            annotated_url = gradcam_display_url

        explainability = ExplainabilityInfo(
            gradcam_available=(
                gradcam_display_url is not None
            ),
            heatmap_url=gradcam_display_url,
            lesion_mask_url=None,
            annotated_url=annotated_url,
            preprocessed_url=InferenceService._url_for_upload(
                preprocessed_path
            ),
            salient_regions=[],
        )

        recommendation = InferenceService._get_recommendation(
            dr_level=dr_level,
            is_acceptable_quality=quality.is_acceptable,
        )

        lesson = InferenceService._build_lesson(
            dr_level=dr_level,
            confidence=confidence,
            quality=quality,
            matlab_result=matlab_result,
        )

        inference_time_ms = round(
            (time.time() - start_time) * 1000,
            1,
        )

        result = InferenceResponse(
            success=True,
            inference_time_ms=inference_time_ms,

            model=ModelInfo(
                name="EfficientNet-B0",
                version="MATLAB",
                architecture="EfficientNet-B0",
                dataset="APTOS 2019",
                input_size="224x224x3",
            ),

            prediction=PredictionInfo(
                dr_level=dr_level,
                label=DR_LABELS[dr_level],
                confidence=round(confidence, 6),
                referable=referable,
                class_probabilities=class_probabilities,
            ),

            quality=quality,
            lesions=lesions,
            explainability=explainability,
            recommendation=recommendation,
            lesson=lesson,
        )

        print()
        print("=" * 60)
        print("APTOS DR INFERENCE RESULT")
        print("=" * 60)
        print(f"Prediction   : {result.prediction.label}")
        print(
            f"Confidence   : "
            f"{result.prediction.confidence * 100:.2f}%"
        )
        print(f"DR Level     : {result.prediction.dr_level}")
        print(f"Referable    : {result.prediction.referable}")
        print(f"Preprocessed : {explainability.preprocessed_url}")
        print(f"Grad-CAM     : {explainability.heatmap_url}")
        print(f"Detections   : {explainability.annotated_url}")
        print(f"Inference    : {result.inference_time_ms:.2f} ms")
        print("-" * 60)
        print(
            f"Recommendation: "
            f"{result.recommendation.action}"
        )
        print("=" * 60)
        print()

        return result

    @staticmethod
    def _get_recommendation(
        dr_level: int,
        is_acceptable_quality: bool,
    ) -> RecommendationInfo:

        if not is_acceptable_quality:
            return RecommendationInfo(
                action="RECAPTURE_IMAGE",
                urgency="recapture",
                reason=(
                    "Image quality is inadequate for reliable "
                    "automated DR screening."
                ),
                clinical_guideline=(
                    "Reposition the patient, adjust fundus "
                    "camera focus and illumination, and recapture "
                    "the image."
                ),
            )

        if dr_level == 0:
            return RecommendationInfo(
                action="ROUTINE_ANNUAL_FOLLOWUP",
                urgency="routine",
                reason=(
                    "No diabetic retinopathy detected by the "
                    "screening model."
                ),
                clinical_guideline=(
                    "Continue routine diabetic eye screening "
                    "according to local clinical guidance."
                ),
            )

        if dr_level == 1:
            return RecommendationInfo(
                action="ROUTINE_FOLLOWUP",
                urgency="routine",
                reason=(
                    "Mild diabetic retinopathy detected by the "
                    "screening model."
                ),
                clinical_guideline=(
                    "Clinical follow-up and periodic retinal "
                    "screening are recommended."
                ),
            )

        if dr_level == 2:
            return RecommendationInfo(
                action="REFER_TO_OPHTHALMOLOGIST",
                urgency="referral",
                reason=(
                    "The model classified the image as "
                    "referable diabetic retinopathy."
                ),
                clinical_guideline=(
                    "Refer the patient for professional "
                    "ophthalmic evaluation."
                ),
            )

        if dr_level == 3:
            return RecommendationInfo(
                action="URGENT_REFERRAL",
                urgency="urgent",
                reason=(
                    "Severe diabetic retinopathy detected by "
                    "the screening model."
                ),
                clinical_guideline=(
                    "Arrange prompt ophthalmic evaluation."
                ),
            )

        return RecommendationInfo(
            action="URGENT_REFERRAL",
            urgency="urgent",
            reason=(
                "Proliferative diabetic retinopathy detected by "
                "the screening model."
            ),
            clinical_guideline=(
                "Arrange urgent referral to an ophthalmologist "
                "or retinal specialist."
            ),
        )
