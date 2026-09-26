from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.screening import Screening, ScreeningStatus
from app.models.doctor_review import DoctorReview, ReviewDecision
from app.models.user import User
from app.schemas.review import DoctorReviewCreate, DoctorReviewResponse
from app.schemas.screening import ScreeningResponse
from app.api.deps import get_current_user
from app.api.screenings import _format_screening_response

router = APIRouter(prefix="/reviews", tags=["Doctor Reviews"])

@router.get("/pending", response_model=List[ScreeningResponse])
def get_pending_reviews(db: Session = Depends(get_db)):
    """Fetches screenings requiring doctor review (Section 13.5)"""
    screenings = (
        db.query(Screening)
        .filter(Screening.status == ScreeningStatus.REVIEW_REQUIRED.value)
        .order_by(Screening.created_at.desc())
        .all()
    )
    return [_format_screening_response(s) for s in screenings]

@router.post("", response_model=DoctorReviewResponse)
def submit_doctor_review(
    payload: DoctorReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    screening = db.query(Screening).filter(Screening.screening_id == payload.screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    # Check if review already exists
    existing_review = db.query(DoctorReview).filter(DoctorReview.screening_id == screening.id).first()
    if existing_review:
        existing_review.decision = payload.decision
        existing_review.final_dr_level = payload.final_dr_level
        existing_review.clinical_notes = payload.clinical_notes
        existing_review.referral_facility = payload.referral_facility
        existing_review.reviewed_at = datetime.now(timezone.utc)
        existing_review.doctor_id = current_user.id
        db.commit()
        db.refresh(existing_review)
        review = existing_review
    else:
        review = DoctorReview(
            screening_id=screening.id,
            doctor_id=current_user.id,
            decision=payload.decision,
            final_dr_level=payload.final_dr_level,
            clinical_notes=payload.clinical_notes,
            referral_facility=payload.referral_facility
        )
        db.add(review)

    # Mark screening status as COMPLETED
    screening.status = ScreeningStatus.COMPLETED.value
    db.commit()
    db.refresh(review)

    return DoctorReviewResponse(
        id=review.id,
        screening_id=screening.screening_id,
        doctor_id=current_user.id,
        doctor_name=current_user.full_name,
        decision=review.decision,
        final_dr_level=review.final_dr_level,
        clinical_notes=review.clinical_notes,
        referral_facility=review.referral_facility,
        reviewed_at=review.reviewed_at
    )
