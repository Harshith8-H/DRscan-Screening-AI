from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.db.database import get_db
from app.models.patient import Patient
from app.models.screening import Screening
from app.models.ai_result import AIResult
from app.models.doctor_review import DoctorReview
from app.schemas.patient import (
    PatientCreate,
    PatientResponse,
    PatientHistoryResponse,
    PatientLongitudinalEntry
)

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("", response_model=List[PatientResponse])
def list_patients(
    search: Optional[str] = Query(None, description="Search by name, code, or village"),
    db: Session = Depends(get_db)
):
    query = db.query(Patient)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Patient.name.ilike(search_fmt),
                Patient.patient_code.ilike(search_fmt),
                Patient.village_or_phc.ilike(search_fmt)
            )
        )
    patients = query.order_by(Patient.id.desc()).all()
    
    result = []
    for p in patients:
        count = db.query(Screening).filter(Screening.patient_id == p.id).count()
        p_resp = PatientResponse(
            id=p.id,
            patient_code=p.patient_code,
            name=p.name,
            age=p.age,
            sex=p.sex,
            diabetes_duration_years=p.diabetes_duration_years,
            phone=p.phone,
            village_or_phc=p.village_or_phc,
            blood_sugar_fasting=p.blood_sugar_fasting,
            hba1c=p.hba1c,
            notes=p.notes,
            created_at=p.created_at,
            screenings_count=count
        )
        result.append(p_resp)
    return result

@router.post("", response_model=PatientResponse)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    # Auto-generate patient code if not provided
    if not payload.patient_code:
        count = db.query(Patient).count()
        code = f"P-{1000 + count + 1}"
    else:
        code = payload.patient_code

    # Check uniqueness
    existing = db.query(Patient).filter(Patient.patient_code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Patient code '{code}' already exists")

    patient = Patient(
        patient_code=code,
        name=payload.name,
        age=payload.age,
        sex=payload.sex,
        diabetes_duration_years=payload.diabetes_duration_years,
        phone=payload.phone,
        village_or_phc=payload.village_or_phc,
        blood_sugar_fasting=payload.blood_sugar_fasting,
        hba1c=payload.hba1c,
        notes=payload.notes
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    return PatientResponse(
        id=patient.id,
        patient_code=patient.patient_code,
        name=patient.name,
        age=patient.age,
        sex=patient.sex,
        diabetes_duration_years=patient.diabetes_duration_years,
        phone=patient.phone,
        village_or_phc=patient.village_or_phc,
        blood_sugar_fasting=patient.blood_sugar_fasting,
        hba1c=patient.hba1c,
        notes=patient.notes,
        created_at=patient.created_at,
        screenings_count=0
    )

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    count = db.query(Screening).filter(Screening.patient_id == patient.id).count()
    return PatientResponse(
        id=patient.id,
        patient_code=patient.patient_code,
        name=patient.name,
        age=patient.age,
        sex=patient.sex,
        diabetes_duration_years=patient.diabetes_duration_years,
        phone=patient.phone,
        village_or_phc=patient.village_or_phc,
        blood_sugar_fasting=patient.blood_sugar_fasting,
        hba1c=patient.hba1c,
        notes=patient.notes,
        created_at=patient.created_at,
        screenings_count=count
    )

@router.get("/{patient_id}/history", response_model=PatientHistoryResponse)
def get_patient_longitudinal_history(patient_id: int, db: Session = Depends(get_db)):
    """Section 20 of README: Longitudinal Monitoring and Progression Alerts"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    screenings = (
        db.query(Screening)
        .filter(Screening.patient_id == patient.id)
        .order_by(Screening.created_at.asc())
        .all()
    )

    longitudinal_list: List[PatientLongitudinalEntry] = []
    dr_progression: List[int] = []

    for s in screenings:
        ai = s.ai_result
        review = s.doctor_review

        dr_lvl = ai.dr_level if ai else None
        if dr_lvl is not None:
            dr_progression.append(dr_lvl)

        entry = PatientLongitudinalEntry(
            screening_id=s.screening_id,
            date=s.created_at,
            eye_side=s.eye_side,
            dr_level=dr_lvl,
            label=ai.label if ai else None,
            confidence=ai.confidence if ai else None,
            referable=ai.referable if ai else None,
            image_url=s.original_image_path,
            gradcam_url=ai.gradcam_path if ai else None,
            doctor_decision=review.decision if review else None
        )
        longitudinal_list.append(entry)

    # Check longitudinal progression
    progression_alert = None
    risk_trend = "Stable"
    if len(dr_progression) >= 2:
        diff = dr_progression[-1] - dr_progression[0]
        if diff > 0:
            progression_alert = (
                f"Longitudinal Progression Alert: Patient progressed by +{diff} DR grade(s) "
                f"from Grade {dr_progression[0]} to Grade {dr_progression[-1]} across serial screenings. "
                "Urgent specialist review advised."
            )
            risk_trend = "Worsening / Rapid Progression"
        elif diff < 0:
            risk_trend = "Improving / Post-treatment Regression"
        else:
            risk_trend = "Stable DR Grade"

    count = len(screenings)
    p_resp = PatientResponse(
        id=patient.id,
        patient_code=patient.patient_code,
        name=patient.name,
        age=patient.age,
        sex=patient.sex,
        diabetes_duration_years=patient.diabetes_duration_years,
        phone=patient.phone,
        village_or_phc=patient.village_or_phc,
        blood_sugar_fasting=patient.blood_sugar_fasting,
        hba1c=patient.hba1c,
        notes=patient.notes,
        created_at=patient.created_at,
        screenings_count=count
    )

    return PatientHistoryResponse(
        patient=p_resp,
        screenings=longitudinal_list,
        progression_alert=progression_alert,
        risk_trend=risk_trend
    )
