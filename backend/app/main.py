from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.logging import logger
from app.db.init_db import init_database
from app.api import (
    auth,
    patients,
    screenings,
    reviews,
    reports,
    simulation,
    sync
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database & demo records exist
    logger.info("Initializing DRscan AI Screening Platform backend...")
    init_database()
    logger.info("DRscan Backend ready.")
    yield
    # Shutdown
    logger.info("Shutting down DRscan Backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Explainable AI Diabetic Retinopathy Screening System for Rural Healthcare in India (SIH26038)",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for original images and Grad-CAM/lesion masks
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/results", StaticFiles(directory=str(settings.RESULTS_DIR)), name="results")
app.mount("/samples", StaticFiles(directory=str(settings.SAMPLES_DIR)), name="samples")

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(patients.router, prefix=settings.API_V1_STR)
app.include_router(screenings.router, prefix=settings.API_V1_STR)
app.include_router(reviews.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(simulation.router, prefix=settings.API_V1_STR)
app.include_router(sync.router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ml_provider": settings.ML_PROVIDER,
        "active_model": settings.MODEL_NAME
    }
