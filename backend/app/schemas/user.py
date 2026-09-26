from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str = "DOCTOR"
    medical_council_id: Optional[str] = None
    phc_center: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str
