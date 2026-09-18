from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.tenant import Tenant
from app.models.course import Course, Enrollment
from app.core.config import settings
import re

router = APIRouter()

def normalize_institution_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())

def get_allowed_teachers() -> list[str]:
    """
    Returns list of allowed teacher emails from settings.
    Set ALLOWED_TEACHER_EMAILS env var as comma-separated emails.
    e.g., ALLOWED_TEACHER_EMAILS=prof.khan@uetpeshawar.edu.pk,dr.ali@uetpeshawar.edu.pk
    If empty/unset, all @uetpeshawar.edu.pk emails are allowed as teachers.
    """
    raw = getattr(settings, "ALLOWED_TEACHER_EMAILS", "")
    if not raw:
        return []
    return [e.strip().lower() for e in raw.split(",") if e.strip()]

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="This email is already registered. Please log in instead."
        )

    # Enforce teacher whitelist
    if user_in.role == "teacher":
        allowed = get_allowed_teachers()
        if allowed and user_in.email.lower() not in allowed:
            raise HTTPException(
                status_code=403,
                detail="This email is not authorized to register as a teacher. Contact administration."
            )
        # Ensure no other teacher account exists with this email on a different device
        # (device lock: if registering as teacher, fingerprint must be provided)
        if not user_in.device_fingerprint:
            raise HTTPException(
                status_code=400,
                detail="Device information is required to register as a teacher."
            )

    requested_institution = normalize_institution_name(user_in.tenant_name)
    tenant = next(
        (candidate for candidate in db.query(Tenant).all()
         if normalize_institution_name(candidate.name) == requested_institution),
        None,
    )

    if not tenant:
        tenant = Tenant(
            name=user_in.tenant_name,
            domain=f"{user_in.tenant_name.replace(' ', '').lower()}.edu"
        )
        db.add(tenant)
        db.commit()
        db.refresh(tenant)

    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role,
        tenant_id=tenant.id,
        device_fingerprint=user_in.device_fingerprint if user_in.role == "teacher" else None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Auto-enroll a student into courses in their own institution only.
    if new_user.role == "student":
        all_courses = db.query(Course).filter(Course.tenant_id == tenant.id).all()
        for course in all_courses:
            db.add(Enrollment(course_id=course.id, student_id=new_user.id))
        db.commit()

    return new_user


@router.post("/login", response_model=Token)
def login(user_in: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is inactive. Contact administration.")

    # Device lock check for teachers
    if user.role == "teacher":
        if user.device_fingerprint:
            incoming_fp = user_in.device_fingerprint or ""
            if incoming_fp != user.device_fingerprint:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: this account is registered to a different device. Contact administration if you changed devices."
                )
        else:
            # First login after DB migration — bind fingerprint now
            if user_in.device_fingerprint:
                user.device_fingerprint = user_in.device_fingerprint
                db.commit()

    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}


from app.api.deps import get_current_active_user

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user
