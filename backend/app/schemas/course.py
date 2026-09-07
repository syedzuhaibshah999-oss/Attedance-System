from pydantic import BaseModel
from typing import List, Optional

class CourseBase(BaseModel):
    name: str
    code: str

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: int
    tenant_id: int
    teacher_id: int

    class Config:
        from_attributes = True

class EnrollmentCreate(BaseModel):
    course_id: int
    student_id: int
