import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DRscan - Explainable AI for Diabetic Retinopathy Screening"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "sih26038-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Storage paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    RESULTS_DIR: Path = BASE_DIR / "results"
    SAMPLES_DIR: Path = BASE_DIR / "samples"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{Path(__file__).resolve().parent.parent.parent / 'dr_screening.db'}")

    # ML Configuration
    ML_PROVIDER: str = os.getenv("ML_PROVIDER", "mock")  # "mock" | "pytorch" | "onnx"
    MODEL_NAME: str = "DenseNet121-Explainable-DR"
    MODEL_VERSION: str = "1.0.0"
    DATASET_SOURCE: str = "APTOS2019 / EyePACS / Messidor-2"

    # Rural Simulation Parameters
    DEFAULT_BANDWIDTH_MBPS: float = 2.5
    DEFAULT_LATENCY_MS: int = 250

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
settings.SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
