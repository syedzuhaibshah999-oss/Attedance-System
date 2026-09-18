from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_active_user
from app.core.security import get_password_hash

router = APIRouter()

from app.models.tenant import Tenant

@router.get("/init-seed-once")
def init_seed_once(db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter_by(name="Test University").first()
    if not tenant:
        tenant = Tenant(name="Test University", domain="test.edu")
        db.add(tenant)
        db.commit()
        db.refresh(tenant)

    admin = db.query(User).filter_by(email="admin@test.edu").first()
    if not admin:
        admin = User(
            email="admin@test.edu",
            hashed_password=get_password_hash("admin123"),
            full_name="System Admin",
            role="admin",
            tenant_id=tenant.id
        )
        db.add(admin)
        db.commit()

    teacher = db.query(User).filter_by(email="teacher@test.edu").first()
    if not teacher:
        teacher = User(
            email="teacher@test.edu",
            hashed_password=get_password_hash("password123"),
            full_name="Teacher",
            role="teacher",
            tenant_id=tenant.id
        )
        db.add(teacher)
        db.commit()

    student = db.query(User).filter_by(email="student@test.edu").first()
    if not student:
        student = User(
            email="student@test.edu",
            hashed_password=get_password_hash("student123"),
            full_name="Student",
            role="student",
            tenant_id=tenant.id
        )
        db.add(student)
        db.commit()

    return {"message": "Database seeded with test accounts!"}

def get_current_admin_user(current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return current_user

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "teacher"

class UserUpdatePassword(BaseModel):
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True

@router.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    users = db.query(User).filter(User.tenant_id == current_user.tenant_id).all()
    return users

@router.post("/users", response_model=UserResponse)
def create_user(user_in: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role,
        tenant_id=current_user.tenant_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}/password")
def update_user_password(user_id: int, pwd_in: UserUpdatePassword, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    user = db.query(User).filter(User.id == user_id, User.tenant_id == current_user.tenant_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = get_password_hash(pwd_in.password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    user = db.query(User).filter(User.id == user_id, User.tenant_id == current_user.tenant_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}
