from pydantic import BaseModel
from datetime import datetime

class AttendanceSessionCreate(BaseModel):
    course_id: int
    duration_minutes: int = 2

class AttendanceSessionResponse(BaseModel):
    id: int
    course_id: int
    qr_token: str
    expires_at: datetime
    
    class Config:
        from_attributes = True

class MarkAttendanceRequest(BaseModel):
    qr_token: str
