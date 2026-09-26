from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum
from app.db.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    OPERATOR = "OPERATOR"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default=UserRole.DOCTOR.value, nullable=False)
    medical_council_id = Column(String(50), nullable=True)  # For doctors
    phc_center = Column(String(100), nullable=True)         # Primary Health Centre
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
