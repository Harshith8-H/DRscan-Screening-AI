from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.config import settings
from app.schemas.report import ReportSummaryResponse
from app.api.screenings import get_screening_detail
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{screening_id}", response_model=ReportSummaryResponse)
def get_report_summary(screening_id: str, db: Session = Depends(get_db)):
    detail = get_screening_detail(screening_id, db)
    pdf_rel_url = ReportService.generate_pdf_report(detail)

    return ReportSummaryResponse(
        report_id=f"REP-{screening_id}",
        generated_at=datetime.now(timezone.utc),
        patient=detail.patient,
        screening=detail.screening,
        inference=detail.inference,
        doctor_review=detail.doctor_review,
        pdf_download_url=f"/api/reports/{screening_id}/download",
        disclaimer=(
            "AI-assisted screening report generated under rural tele-ophthalmology protocol. "
            "For referral triage only; not a definitive automated diagnosis."
        )
    )

@router.get("/{screening_id}/download")
def download_pdf_report(screening_id: str, db: Session = Depends(get_db)):
    detail = get_screening_detail(screening_id, db)
    pdf_rel_url = ReportService.generate_pdf_report(detail)
    pdf_path = settings.BASE_DIR / pdf_rel_url.lstrip('/')
    
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Generated PDF report not found")

    return FileResponse(
        path=str(pdf_path),
        filename=f"DR_Screening_Report_{screening_id}.pdf",
        media_type="application/pdf"
    )
