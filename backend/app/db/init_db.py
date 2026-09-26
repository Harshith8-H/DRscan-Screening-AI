import os
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from PIL import Image
from sqlalchemy.orm import Session
from app.db.database import Base, engine, SessionLocal
from app.core.config import settings
from app.core.security import get_password_hash
from app.models import (
    User, UserRole,
    Patient,
    Screening, ScreeningStatus,
    AIResult,
    LesionResult,
    DoctorReview, ReviewDecision
)
from app.services.inference_service import InferenceService
from app.services.image_service import ImageService
from app.db.generate_samples import generate_all_samples

def init_database():
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Generate sample images
    generate_all_samples(settings.SAMPLES_DIR)

    db: Session = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).first():
            return

        # 1. Seed Users
        doctor_user = User(
            username="dr.priya",
            email="dr.priya@telehealth.gov.in",
            hashed_password=get_password_hash("doctor123"),
            full_name="Dr. Priya Sharma, MS (Ophthalmology)",
            role=UserRole.DOCTOR.value,
            medical_council_id="MCI-OPHTH-88421",
            phc_center="District Civil Hospital Eye Department"
        )
        operator_user = User(
            username="operator.rajesh",
            email="rajesh.phc@telehealth.gov.in",
            hashed_password=get_password_hash("operator123"),
            full_name="Rajesh Kumar (Screening Technician)",
            role=UserRole.OPERATOR.value,
            phc_center="Rampur Rural Primary Health Centre"
        )
        db.add_all([doctor_user, operator_user])
        db.commit()
        db.refresh(doctor_user)
        db.refresh(operator_user)

        # 2. Seed Patients
        patients_data = [
            {
                "patient_code": "P-1001",
                "name": "Ramesh Patel",
                "age": 58,
                "sex": "Male",
                "diabetes_duration_years": 12.0,
                "phone": "+91 98765 43210",
                "village_or_phc": "Rampur Village PHC",
                "blood_sugar_fasting": 185.0,
                "hba1c": 8.8,
                "notes": "Poor glycaemic control, complains of occasional floaters"
            },
            {
                "patient_code": "P-1002",
                "name": "Lakshmi Devi",
                "age": 52,
                "sex": "Female",
                "diabetes_duration_years": 4.5,
                "phone": "+91 94512 88392",
                "village_or_phc": "Sundarpur Sub-centre",
                "blood_sugar_fasting": 142.0,
                "hba1c": 7.1,
                "notes": "Adherent to Metformin, routine annual checkup"
            },
            {
                "patient_code": "P-1003",
                "name": "Ananya Sen",
                "age": 41,
                "sex": "Female",
                "diabetes_duration_years": 1.5,
                "phone": "+91 87654 32109",
                "village_or_phc": "Balrampur Rural CHC",
                "blood_sugar_fasting": 128.0,
                "hba1c": 6.5,
                "notes": "Recently diagnosed Type-2 Diabetes"
            },
            {
                "patient_code": "P-1004",
                "name": "Mohammed Farooq",
                "age": 65,
                "sex": "Male",
                "diabetes_duration_years": 19.0,
                "phone": "+91 91234 56780",
                "village_or_phc": "Rampur Village PHC",
                "blood_sugar_fasting": 220.0,
                "hba1c": 9.6,
                "notes": "Severe vision diminution in right eye, previous laser history"
            }
        ]

        seeded_patients = []
        for pdata in patients_data:
            p = Patient(**pdata)
            db.add(p)
            seeded_patients.append(p)
        db.commit()

        # Copy sample images to uploads for seeded screenings
        import shutil
        for sample_file in settings.SAMPLES_DIR.glob("*.jpg"):
            dest = settings.UPLOAD_DIR / sample_file.name
            if not dest.exists():
                shutil.copy(sample_file, dest)

        # 3. Seed Longitudinal History for Ramesh Patel (P-1001)
        # Screening 1: 12 months ago -> Grade 1 Mild NPDR
        scr1_id = "SCR-1001"
        date1 = datetime.now(timezone.utc) - timedelta(days=365)
        scr1 = Screening(
            screening_id=scr1_id,
            patient_id=seeded_patients[0].id,
            eye_side="RIGHT",
            original_image_path="/uploads/sample_grade1_mild.jpg",
            status=ScreeningStatus.COMPLETED.value,
            image_quality_score=0.92,
            image_quality_status="good",
            is_acceptable_quality=True,
            model_name=settings.MODEL_NAME,
            model_version=settings.MODEL_VERSION,
            created_at=date1
        )
        db.add(scr1)
        db.commit()
        db.refresh(scr1)
        res1 = InferenceService.run_inference(scr1_id, scr1.original_image_path, ImageService.evaluate_fundus_quality(Image.open(settings.SAMPLES_DIR / "sample_grade1_mild.jpg")), force_dr_level=1)
        ai1 = AIResult(
            screening_id=scr1.id,
            dr_level=res1.prediction.dr_level,
            label=res1.prediction.label,
            confidence=res1.prediction.confidence,
            referable=res1.prediction.referable,
            class_probabilities_json=json.dumps(res1.prediction.class_probabilities),
            gradcam_path=res1.explainability.heatmap_url,
            lesion_mask_path=res1.explainability.lesion_mask_url,
            annotated_path=res1.explainability.annotated_url,
            recommendation_action=res1.recommendation.action,
            recommendation_urgency=res1.recommendation.urgency,
            recommendation_reason=res1.recommendation.reason,
            clinical_guideline=res1.recommendation.clinical_guideline,
            model_name=res1.model.name,
            model_version=res1.model.version,
            inference_time_ms=res1.inference_time_ms,
            created_at=date1
        )
        les1 = LesionResult(
            screening_id=scr1.id,
            microaneurysms=res1.lesions.microaneurysms,
            hemorrhages=res1.lesions.hemorrhages,
            exudates=res1.lesions.exudates,
            cotton_wool_spots=res1.lesions.cotton_wool_spots,
            foveal_involvement=res1.lesions.foveal_involvement
        )
        rev1 = DoctorReview(
            screening_id=scr1.id,
            doctor_id=doctor_user.id,
            decision=ReviewDecision.CONFIRMED.value,
            final_dr_level=1,
            clinical_notes="Early microaneurysms present. Advised strict blood sugar control and 6-month follow-up.",
            reviewed_at=date1 + timedelta(hours=2)
        )
        db.add_all([ai1, les1, rev1])

        # Screening 2: 6 months ago -> Grade 2 Moderate NPDR
        scr2_id = "SCR-1002"
        date2 = datetime.now(timezone.utc) - timedelta(days=180)
        scr2 = Screening(
            screening_id=scr2_id,
            patient_id=seeded_patients[0].id,
            eye_side="RIGHT",
            original_image_path="/uploads/sample_grade2_moderate.jpg",
            status=ScreeningStatus.COMPLETED.value,
            image_quality_score=0.91,
            image_quality_status="good",
            is_acceptable_quality=True,
            model_name=settings.MODEL_NAME,
            model_version=settings.MODEL_VERSION,
            created_at=date2
        )
        db.add(scr2)
        db.commit()
        db.refresh(scr2)
        res2 = InferenceService.run_inference(scr2_id, scr2.original_image_path, ImageService.evaluate_fundus_quality(Image.open(settings.SAMPLES_DIR / "sample_grade2_moderate.jpg")), force_dr_level=2)
        ai2 = AIResult(
            screening_id=scr2.id,
            dr_level=res2.prediction.dr_level,
            label=res2.prediction.label,
            confidence=res2.prediction.confidence,
            referable=res2.prediction.referable,
            class_probabilities_json=json.dumps(res2.prediction.class_probabilities),
            gradcam_path=res2.explainability.heatmap_url,
            lesion_mask_path=res2.explainability.lesion_mask_url,
            annotated_path=res2.explainability.annotated_url,
            recommendation_action=res2.recommendation.action,
            recommendation_urgency=res2.recommendation.urgency,
            recommendation_reason=res2.recommendation.reason,
            clinical_guideline=res2.recommendation.clinical_guideline,
            model_name=res2.model.name,
            model_version=res2.model.version,
            inference_time_ms=res2.inference_time_ms,
            created_at=date2
        )
        les2 = LesionResult(
            screening_id=scr2.id,
            microaneurysms=res2.lesions.microaneurysms,
            hemorrhages=res2.lesions.hemorrhages,
            exudates=res2.lesions.exudates,
            cotton_wool_spots=res2.lesions.cotton_wool_spots,
            foveal_involvement=res2.lesions.foveal_involvement
        )
        rev2 = DoctorReview(
            screening_id=scr2.id,
            doctor_id=doctor_user.id,
            decision=ReviewDecision.CONFIRMED.value,
            final_dr_level=2,
            clinical_notes="Progression noted from mild to moderate NPDR. Initiated tele-referral.",
            reviewed_at=date2 + timedelta(hours=3)
        )
        db.add_all([ai2, les2, rev2])

        # Screening 3: Current -> Grade 3 Severe NPDR (Pending Review!)
        scr3_id = "SCR-1003"
        date3 = datetime.now(timezone.utc) - timedelta(hours=4)
        scr3 = Screening(
            screening_id=scr3_id,
            patient_id=seeded_patients[0].id,
            eye_side="RIGHT",
            original_image_path="/uploads/sample_grade3_severe.jpg",
            status=ScreeningStatus.REVIEW_REQUIRED.value,
            image_quality_score=0.94,
            image_quality_status="good",
            is_acceptable_quality=True,
            model_name=settings.MODEL_NAME,
            model_version=settings.MODEL_VERSION,
            created_at=date3
        )
        db.add(scr3)
        db.commit()
        db.refresh(scr3)
        res3 = InferenceService.run_inference(scr3_id, scr3.original_image_path, ImageService.evaluate_fundus_quality(Image.open(settings.SAMPLES_DIR / "sample_grade3_severe.jpg")), force_dr_level=3)
        ai3 = AIResult(
            screening_id=scr3.id,
            dr_level=res3.prediction.dr_level,
            label=res3.prediction.label,
            confidence=res3.prediction.confidence,
            referable=res3.prediction.referable,
            class_probabilities_json=json.dumps(res3.prediction.class_probabilities),
            gradcam_path=res3.explainability.heatmap_url,
            lesion_mask_path=res3.explainability.lesion_mask_url,
            annotated_path=res3.explainability.annotated_url,
            recommendation_action=res3.recommendation.action,
            recommendation_urgency=res3.recommendation.urgency,
            recommendation_reason=res3.recommendation.reason,
            clinical_guideline=res3.recommendation.clinical_guideline,
            model_name=res3.model.name,
            model_version=res3.model.version,
            inference_time_ms=res3.inference_time_ms,
            created_at=date3
        )
        les3 = LesionResult(
            screening_id=scr3.id,
            microaneurysms=res3.lesions.microaneurysms,
            hemorrhages=res3.lesions.hemorrhages,
            exudates=res3.lesions.exudates,
            cotton_wool_spots=res3.lesions.cotton_wool_spots,
            foveal_involvement=res3.lesions.foveal_involvement
        )
        db.add_all([ai3, les3])

        # Screening 4 for Mohammed Farooq (P-1004) -> Grade 4 Proliferative DR (Pending Doctor Review)
        scr4_id = "SCR-1004"
        date4 = datetime.now(timezone.utc) - timedelta(hours=2)
        scr4 = Screening(
            screening_id=scr4_id,
            patient_id=seeded_patients[3].id,
            eye_side="RIGHT",
            original_image_path="/uploads/sample_grade4_pdr.jpg",
            status=ScreeningStatus.REVIEW_REQUIRED.value,
            image_quality_score=0.88,
            image_quality_status="good",
            is_acceptable_quality=True,
            model_name=settings.MODEL_NAME,
            model_version=settings.MODEL_VERSION,
            created_at=date4
        )
        db.add(scr4)
        db.commit()
        db.refresh(scr4)
        res4 = InferenceService.run_inference(scr4_id, scr4.original_image_path, ImageService.evaluate_fundus_quality(Image.open(settings.SAMPLES_DIR / "sample_grade4_pdr.jpg")), force_dr_level=4)
        ai4 = AIResult(
            screening_id=scr4.id,
            dr_level=res4.prediction.dr_level,
            label=res4.prediction.label,
            confidence=res4.prediction.confidence,
            referable=res4.prediction.referable,
            class_probabilities_json=json.dumps(res4.prediction.class_probabilities),
            gradcam_path=res4.explainability.heatmap_url,
            lesion_mask_path=res4.explainability.lesion_mask_url,
            annotated_path=res4.explainability.annotated_url,
            recommendation_action=res4.recommendation.action,
            recommendation_urgency=res4.recommendation.urgency,
            recommendation_reason=res4.recommendation.reason,
            clinical_guideline=res4.recommendation.clinical_guideline,
            model_name=res4.model.name,
            model_version=res4.model.version,
            inference_time_ms=res4.inference_time_ms,
            created_at=date4
        )
        les4 = LesionResult(
            screening_id=scr4.id,
            microaneurysms=res4.lesions.microaneurysms,
            hemorrhages=res4.lesions.hemorrhages,
            exudates=res4.lesions.exudates,
            cotton_wool_spots=res4.lesions.cotton_wool_spots,
            foveal_involvement=res4.lesions.foveal_involvement
        )
        db.add_all([ai4, les4])

        db.commit()
        print("Database initialized and populated with realistic longitudinal patient data successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    init_database()
