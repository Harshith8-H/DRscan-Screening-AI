from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.screening import Screening, ScreeningStatus
from app.schemas.screening import ScreeningResponse
from app.api.screenings import _format_screening_response

router = APIRouter(prefix="/sync", tags=["Rural Offline Queue & Sync"])

@router.get("/status")
def get_sync_status(db: Session = Depends(get_db)):
    queued_count = db.query(Screening).filter(Screening.is_offline_queued == True).count()
    return {
        "pending_offline_sync_count": queued_count,
        "is_online": True,
        "last_sync_timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.post("/batch")
def sync_offline_screenings(db: Session = Depends(get_db)):
    """Simulates syncing locally stored offline screenings to District Central Database"""
    offline_screenings = db.query(Screening).filter(Screening.is_offline_queued == True).all()
    count = len(offline_screenings)
    now = datetime.now(timezone.utc)
    for s in offline_screenings:
        s.is_offline_queued = False
        s.synced_at = now
        if s.status == ScreeningStatus.UPLOADED.value:
            s.status = ScreeningStatus.REVIEW_REQUIRED.value
    db.commit()

    return {
        "success": True,
        "synced_records_count": count,
        "synced_at": now.isoformat(),
        "message": f"Successfully synchronized {count} offline screening record(s) to District Server."
    }
