from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, Token, UserResponse
from app.core.security import verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/demo-users")
def get_demo_users(db: Session = Depends(get_db)):
    """Return available pre-configured demo users for quick login"""
    users = db.query(User).all()
    return [
        {
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "phc_center": u.phc_center,
            "medical_council_id": u.medical_council_id
        }
        for u in users
    ]
