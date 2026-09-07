from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest
from app.core.security import get_password_hash, verify_password, create_access_token

from app.models.tenant import Tenant
from app.models.course import Course, Enrollment
import re

router = APIRouter()

def normalize_institution_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="This email is already registered. Please log in instead.")
    
    requested_institution = normalize_institution_name(user_in.tenant_name)
    tenant = next(
        (candidate for candidate in db.query(Tenant).all()
         if normalize_institution_name(candidate.name) == requested_institution),
        None,
    )
    
    if not tenant:
        tenant = Tenant(name=user_in.tenant_name, domain=f"{user_in.tenant_name.replace(' ', '').lower()}.edu")
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
            
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role,
        tenant_id=tenant.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Auto-enroll student into all courses (tenant courses or all courses)
    if new_user.role == "student":
        all_courses = db.query(Course).filter(Course.tenant_id == tenant.id).all()
        if not all_courses:
            all_courses = db.query(Course).all()
        for course in all_courses:
            db.add(Enrollment(course_id=course.id, student_id=new_user.id))
        db.commit()

    return new_user

@router.post("/login", response_model=Token)
def login(user_in: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

from app.api.deps import get_current_active_user

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user
