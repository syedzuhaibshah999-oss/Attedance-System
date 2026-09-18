from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.course import Course, Enrollment
from app.models.user import User
from app.schemas.course import CourseCreate, CourseResponse, EnrollmentCreate
from app.api.deps import get_current_teacher_user, get_current_active_user

router = APIRouter()

@router.post("/", response_model=CourseResponse)
def create_course(
    course_in: CourseCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_teacher_user)
):
    new_course = Course(
        name=course_in.name,
        code=course_in.code,
        tenant_id=current_user.tenant_id,
        teacher_id=current_user.id
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    # Keep enrollment within the teacher's institution.
    students = db.query(User).filter(
        User.role == "student",
        User.tenant_id == current_user.tenant_id,
    ).all()
    for student in students:
        db.add(Enrollment(course_id=new_course.id, student_id=student.id))
    db.commit()

    return new_course

@router.get("/", response_model=List[CourseResponse])
def get_courses(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role in ["teacher", "admin"]:
        courses = db.query(Course).filter(Course.teacher_id == current_user.id).all()
    else:
        # student courses
        enrollments = db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()
        course_ids = [e.course_id for e in enrollments]
        courses = db.query(Course).filter(Course.id.in_(course_ids)).all()
    return courses

@router.post("/enroll")
def enroll_student(
    enroll_in: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user)
):
    course = db.query(Course).filter(Course.id == enroll_in.course_id, Course.teacher_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or access denied")

    student = db.query(User).filter(
        User.id == enroll_in.student_id,
        User.role == "student",
        User.tenant_id == current_user.tenant_id,
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found in your institution")
    
    existing = db.query(Enrollment).filter(
        Enrollment.course_id == enroll_in.course_id, 
        Enrollment.student_id == enroll_in.student_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled")
        
    enrollment = Enrollment(course_id=enroll_in.course_id, student_id=enroll_in.student_id)
    db.add(enrollment)
    db.commit()
    return {"message": "Enrolled successfully"}

@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user)
):
    course = db.query(Course).filter(Course.id == course_id, Course.teacher_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or access denied")
    
    # Optional: We could manually cascade delete. For now, since foreign keys may not enforce strict deletion in some setups, we'll manually delete enrollments
    # Actually, SQLAlchemy without cascade might raise an IntegrityError.
    # Let's delete related objects
    from app.models.attendance import AttendanceSession, AttendanceRecord
    
    # 1. Delete Attendance Records
    sessions = db.query(AttendanceSession).filter(AttendanceSession.course_id == course.id).all()
    session_ids = [s.id for s in sessions]
    if session_ids:
        db.query(AttendanceRecord).filter(AttendanceRecord.session_id.in_(session_ids)).delete(synchronize_session=False)
    
    # 2. Delete Attendance Sessions
    db.query(AttendanceSession).filter(AttendanceSession.course_id == course.id).delete(synchronize_session=False)
    
    # 3. Delete Enrollments
    db.query(Enrollment).filter(Enrollment.course_id == course.id).delete(synchronize_session=False)
    
    # 4. Delete Course
    db.delete(course)
    db.commit()
    
    return {"message": "Course deleted successfully"}

@router.delete("/{course_id}/enrollment")
def drop_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can drop courses")

    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course_id, 
        Enrollment.student_id == current_user.id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
        
    db.delete(enrollment)
    db.commit()
    return {"message": "Course dropped successfully"}
