from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional
import secrets
import io

from app.db.session import get_db
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.course import Course, Enrollment
from app.models.user import User
from app.schemas.attendance import (
    AttendanceSessionCreate,
    AttendanceSessionResponse,
    MarkAttendanceRequest,
    ManualMarkRequest,
)
from app.api.deps import get_current_teacher_user, get_current_active_user

router = APIRouter()


# ─── Shared helper (avoids calling route handlers directly) ─────────────────

def _build_attendance_report(course_id: int, db: Session) -> dict:
    """Build attendance report dict for a given course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return {"course": "Unknown", "report": []}

    total_sessions = db.query(AttendanceSession).filter(
        AttendanceSession.course_id == course_id
    ).count()

    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    report = []

    for e in enrollments:
        student = db.query(User).filter(User.id == e.student_id).first()
        if not student:
            continue
        attended_count = (
            db.query(AttendanceRecord)
            .join(AttendanceSession)
            .filter(
                AttendanceSession.course_id == course_id,
                AttendanceRecord.student_id == student.id,
            )
            .count()
        )
        percentage = (attended_count / total_sessions * 100) if total_sessions > 0 else 0
        report.append(
            {
                "student_id": student.id,
                "student_name": student.full_name,
                "student_email": student.email,
                "attended_sessions": attended_count,
                "total_sessions": total_sessions,
                "attendance_percentage": round(percentage, 2),
            }
        )

    return {"course": course.name, "report": report}


# ─── Start attendance session ────────────────────────────────────────────────

@router.post("/start", response_model=AttendanceSessionResponse)
def start_attendance_session(
    session_in: AttendanceSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user),
):
    course = db.query(Course).filter(
        Course.id == session_in.course_id,
        Course.teacher_id == current_user.id,
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or access denied")

    token = secrets.token_urlsafe(16)
    now_utc = datetime.now(timezone.utc)
    from datetime import timedelta
    expires_at = now_utc + timedelta(minutes=session_in.duration_minutes)

    new_session = AttendanceSession(
        course_id=course.id,
        qr_token=token,
        expires_at=expires_at,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

# ─── Rotate QR token ────────────────────────────────────────────────────────
@router.post("/session/{session_id}/rotate-qr")
def rotate_qr_token(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user),
):
    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    course = db.query(Course).filter(
        Course.id == session.course_id,
        Course.teacher_id == current_user.id
    ).first()
    if not course:
        raise HTTPException(status_code=403, detail="Not authorized to manage this session")
        
    new_token = secrets.token_urlsafe(16)
    session.qr_token = new_token
    db.commit()
    
    return {"qr_token": new_token}

# ─── Student self-mark via QR token ─────────────────────────────────────────

@router.post("/mark")
def mark_attendance(
    req: MarkAttendanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can self-mark attendance via QR")

    session = db.query(AttendanceSession).filter(
        AttendanceSession.qr_token == req.qr_token
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Invalid QR code")

    # Fix: proper UTC-aware comparison
    now_utc = datetime.now(timezone.utc)
    session_expires = session.expires_at
    if session_expires.tzinfo is None:
        # Make naive datetimes timezone-aware (treat stored value as UTC)
        session_expires = session_expires.replace(tzinfo=timezone.utc)
    if now_utc > session_expires:
        raise HTTPException(status_code=400, detail="QR code has expired")

    # Auto-enroll if needed
    is_enrolled = db.query(Enrollment).filter(
        Enrollment.course_id == session.course_id,
        Enrollment.student_id == current_user.id,
    ).first()

    if not is_enrolled:
        course = db.query(Course).filter(Course.id == session.course_id).first()
        if course and course.tenant_id == current_user.tenant_id:
            db.add(Enrollment(course_id=session.course_id, student_id=current_user.id))
            db.commit()
        else:
            raise HTTPException(status_code=403, detail="Not enrolled in this course")

    # Prevent duplicate records
    existing_record = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session.id,
        AttendanceRecord.student_id == current_user.id,
    ).first()
    if existing_record:
        raise HTTPException(status_code=400, detail="Attendance already marked")

    record = AttendanceRecord(session_id=session.id, student_id=current_user.id)
    db.add(record)
    db.commit()
    return {"message": "Attendance marked successfully"}


# ─── Teacher manual mark ─────────────────────────────────────────────────────

@router.post("/mark-manual")
def mark_attendance_manually(
    req: ManualMarkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user),
):
    """Teacher manually marks a specific student's attendance for a session."""
    # Verify teacher owns the session's course
    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == req.session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    course = db.query(Course).filter(
        Course.id == session.course_id,
        Course.teacher_id == current_user.id,
    ).first()
    if not course:
        raise HTTPException(status_code=403, detail="You do not own this session's course")

    # Check student exists
    student = db.query(User).filter(
        User.id == req.student_id,
        User.role == "student",
        User.tenant_id == current_user.tenant_id,
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found in your institution")

    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == session.course_id,
        Enrollment.student_id == student.id,
    ).first()
    if not enrollment:
        raise HTTPException(status_code=400, detail="Student is not enrolled in this course")

    # Prevent duplicate
    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == req.session_id,
        AttendanceRecord.student_id == req.student_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already marked for this student")

    record = AttendanceRecord(session_id=req.session_id, student_id=req.student_id)
    db.add(record)
    db.commit()
    return {"message": f"Attendance marked for {student.full_name}"}


# ─── Teacher: unmark attendance ──────────────────────────────────────────────

@router.delete("/mark-manual")
def unmark_attendance_manually(
    req: ManualMarkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user),
):
    """Teacher removes a student's attendance record for a session."""
    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == req.session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    course = db.query(Course).filter(
        Course.id == session.course_id,
        Course.teacher_id == current_user.id,
    ).first()
    if not course:
        raise HTTPException(status_code=403, detail="Access denied")

    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == req.session_id,
        AttendanceRecord.student_id == req.student_id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="No attendance record found")

    db.delete(record)
    db.commit()
    return {"message": "Attendance record removed"}


# ─── FastAPI QR image decode ─────────────────────────────────────────────────

@router.post("/scan-qr")
async def scan_qr_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Accepts a QR code image upload.
    FastAPI decodes the QR using pyzbar/PIL and returns the embedded token.
    The student can then use the token to mark attendance via /mark.
    """
    try:
        from pyzbar.pyzbar import decode as pyzbar_decode
        from PIL import Image as PILImage
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="QR decode library not installed. Run: pip install pyzbar Pillow"
        )

    contents = await file.read()
    try:
        image = PILImage.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    decoded_objects = pyzbar_decode(image)
    if not decoded_objects:
        raise HTTPException(status_code=422, detail="No QR code found in image")

    qr_data = decoded_objects[0].data.decode("utf-8")

    # Extract token from URL if full URL was encoded, else use raw value
    token = qr_data
    if "token=" in qr_data:
        token = qr_data.split("token=")[-1].split("&")[0]

    return {"decoded_token": token, "raw_qr_data": qr_data}


# ─── Get enrolled students for a session (for manual marking UI) ─────────────

@router.get("/session/{session_id}/students")
def get_session_students(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user),
):
    """Returns enrolled students and their attendance status for a session."""
    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    course = db.query(Course).filter(
        Course.id == session.course_id,
        Course.teacher_id == current_user.id,
    ).first()
    if not course:
        raise HTTPException(status_code=403, detail="Access denied")

    enrollments = db.query(Enrollment).filter(
        Enrollment.course_id == session.course_id
    ).all()

    students_data = []
    for e in enrollments:
        student = db.query(User).filter(User.id == e.student_id).first()
        if not student:
            continue
        record = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == session_id,
            AttendanceRecord.student_id == student.id,
        ).first()
        students_data.append(
            {
                "student_id": student.id,
                "student_name": student.full_name,
                "student_email": student.email,
                "is_present": record is not None,
            }
        )

    return {
        "session_id": session_id,
        "course": course.name,
        "students": students_data,
    }


# ─── Attendance report ───────────────────────────────────────────────────────

@router.get("/report/{course_id}")
def get_attendance_report(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user),
):
    course = db.query(Course).filter(
        Course.id == course_id, Course.teacher_id == current_user.id
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return _build_attendance_report(course_id, db)


@router.get("/summary")
def get_teacher_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user),
):
    """Dashboard totals for the signed-in teacher's courses."""
    course_ids = [course_id for (course_id,) in db.query(Course.id).filter(
        Course.teacher_id == current_user.id
    ).all()]
    if not course_ids:
        return {"courses": 0, "students": 0, "sessions": 0, "active_sessions": 0}

    now_utc = datetime.now(timezone.utc)
    sessions = db.query(AttendanceSession).filter(
        AttendanceSession.course_id.in_(course_ids)
    ).all()
    enrolled_students = db.query(Enrollment.student_id).filter(
        Enrollment.course_id.in_(course_ids)
    ).distinct().count()
    active_sessions = sum(
        1 for attendance_session in sessions
        if (attendance_session.expires_at.replace(tzinfo=timezone.utc)
            if attendance_session.expires_at.tzinfo is None
            else attendance_session.expires_at) > now_utc
    )
    return {"courses": len(course_ids), "students": enrolled_students,
            "sessions": len(sessions), "active_sessions": active_sessions}


@router.get("/student-summary")
def get_student_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Attendance percentages and risk signals for the signed-in student."""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view this summary")
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()
    courses, total_sessions, total_attended = [], 0, 0
    for enrollment in enrollments:
        course = db.query(Course).filter(Course.id == enrollment.course_id).first()
        if not course:
            continue
        sessions = db.query(AttendanceSession).filter(AttendanceSession.course_id == course.id).count()
        attended = db.query(AttendanceRecord).join(AttendanceSession).filter(
            AttendanceSession.course_id == course.id, AttendanceRecord.student_id == current_user.id).count()
        percentage = round((attended / sessions * 100) if sessions else 0, 1)
        courses.append({"course_id": course.id, "course_name": course.name, "course_code": course.code,
                        "sessions": sessions, "attended": attended, "percentage": percentage,
                        "at_risk": sessions > 0 and percentage < 75})
        total_sessions += sessions
        total_attended += attended
    overall = round((total_attended / total_sessions * 100) if total_sessions else 0, 1)
    return {"overall_percentage": overall, "total_sessions": total_sessions,
            "attended_sessions": total_attended,
            "at_risk_courses": [course for course in courses if course["at_risk"]], "courses": courses}


@router.get("/admin-overview")
def get_admin_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Institution-wide course and teacher activity for administrators."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Administrator access required")
    courses = db.query(Course).filter(Course.tenant_id == current_user.tenant_id).all()
    course_data = []
    for course in courses:
        teacher = db.query(User).filter(User.id == course.teacher_id).first()
        sessions = db.query(AttendanceSession).filter(AttendanceSession.course_id == course.id).count()
        students = db.query(Enrollment).filter(Enrollment.course_id == course.id).count()
        course_data.append({"id": course.id, "name": course.name, "code": course.code,
                            "teacher_name": teacher.full_name if teacher else "Unassigned",
                            "teacher_email": teacher.email if teacher else None,
                            "sessions": sessions, "students": students})
    return {"courses": course_data, "total_courses": len(course_data),
            "total_sessions": sum(course["sessions"] for course in course_data)}


# ─── Defaulters ─────────────────────────────────────────────────────────────

@router.get("/defaulters/{course_id}")
def get_defaulters(
    course_id: int,
    threshold: float = 75.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user),
):
    course = db.query(Course).filter(
        Course.id == course_id, Course.teacher_id == current_user.id
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Use the shared helper (fixes the bug of calling route handler directly)
    report_data = _build_attendance_report(course_id, db)
    defaulters = [r for r in report_data["report"] if r["attendance_percentage"] < threshold]
    return {"course": report_data["course"], "threshold": threshold, "defaulters": defaulters}
