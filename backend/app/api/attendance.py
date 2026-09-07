from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from app.db.session import get_db
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.course import Course, Enrollment
from app.models.user import User
from app.schemas.attendance import AttendanceSessionCreate, AttendanceSessionResponse, MarkAttendanceRequest
from app.api.deps import get_current_teacher_user, get_current_active_user

router = APIRouter()

@router.post("/start", response_model=AttendanceSessionResponse)
def start_attendance_session(
    session_in: AttendanceSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user)
):
    course = db.query(Course).filter(Course.id == session_in.course_id, Course.teacher_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    token = secrets.token_urlsafe(16)
    expires_at = datetime.utcnow() + timedelta(minutes=session_in.duration_minutes)

    new_session = AttendanceSession(
        course_id=course.id,
        qr_token=token,
        expires_at=expires_at
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.post("/mark")
def mark_attendance(
    req: MarkAttendanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can mark attendance")

    session = db.query(AttendanceSession).filter(AttendanceSession.qr_token == req.qr_token).first()
    if not session:
        raise HTTPException(status_code=404, detail="Invalid QR code")

    # The issue here is the timezone awareness for expires_at, simplifying for now
    if datetime.utcnow() > session.expires_at.replace(tzinfo=None):
        raise HTTPException(status_code=400, detail="QR code has expired")

    is_enrolled = db.query(Enrollment).filter(
        Enrollment.course_id == session.course_id,
        Enrollment.student_id == current_user.id
    ).first()
    if not is_enrolled:
        course = db.query(Course).filter(Course.id == session.course_id).first()
        if course and course.tenant_id == current_user.tenant_id:
            auto_enrollment = Enrollment(course_id=session.course_id, student_id=current_user.id)
            db.add(auto_enrollment)
            db.commit()
        else:
            raise HTTPException(status_code=403, detail="Not enrolled in this course")

    existing_record = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session.id,
        AttendanceRecord.student_id == current_user.id
    ).first()
    if existing_record:
        raise HTTPException(status_code=400, detail="Attendance already marked")

    record = AttendanceRecord(
        session_id=session.id,
        student_id=current_user.id
    )
    db.add(record)
    db.commit()
    return {"message": "Attendance marked successfully"}

@router.get("/report/{course_id}")
def get_attendance_report(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user)
):
    course = db.query(Course).filter(Course.id == course_id, Course.teacher_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    total_sessions = db.query(AttendanceSession).filter(AttendanceSession.course_id == course_id).count()
    
    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    report = []
    
    for e in enrollments:
        student = db.query(User).filter(User.id == e.student_id).first()
        attended_count = db.query(AttendanceRecord).join(AttendanceSession).filter(
            AttendanceSession.course_id == course_id,
            AttendanceRecord.student_id == student.id
        ).count()
        
        percentage = (attended_count / total_sessions * 100) if total_sessions > 0 else 0
        report.append({
            "student_id": student.id,
            "student_name": student.full_name,
            "student_email": student.email,
            "attended_sessions": attended_count,
            "total_sessions": total_sessions,
            "attendance_percentage": round(percentage, 2)
        })
        
    return {"course": course.name, "report": report}

@router.get("/defaulters/{course_id}")
def get_defaulters(
    course_id: int,
    threshold: float = 75.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user)
):
    report_data = get_attendance_report(course_id, db, current_user)
    defaulters = [r for r in report_data["report"] if r["attendance_percentage"] < threshold]
    return {"course": report_data["course"], "threshold": threshold, "defaulters": defaulters}


