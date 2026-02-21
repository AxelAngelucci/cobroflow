from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db

router = APIRouter()


@router.get("")
def health_check() -> dict[str, str]:
    """Lightweight health check for Cloud Run startup/liveness probes."""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)) -> dict:
    """Readiness check that verifies database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"

    return {
        "status": "ready" if db_status == "connected" else "not_ready",
        "database": db_status,
    }
