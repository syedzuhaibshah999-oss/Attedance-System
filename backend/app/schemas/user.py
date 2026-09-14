from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "student"
    tenant_name: str
    device_fingerprint: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device_fingerprint: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    tenant_id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
