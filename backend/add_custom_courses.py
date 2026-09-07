import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import engine
from app.models.tenant import Tenant
from app.models.user import User
from app.models.course import Course, Enrollment

def seed_custom_courses():
    with Session(engine) as db:
        # Get existing teacher and student
        teacher = db.query(User).filter_by(email="teacher@test.edu").first()
        student = db.query(User).filter_by(email="student@test.edu").first()
        
        if not teacher or not student:
            print("Teacher or student not found. Please run seed.py first.")
            return

        # New courses requested by user
        new_courses = [
            {"name": "Artificial Intelligence", "code": "CS-601"},
            {"name": "Embedded Systems", "code": "CS-415"},
            {"name": "Software Construction and Development", "code": "CS-310"},
            {"name": "Design and Analysis of Algorithms", "code": "CS-302"}
        ]
        
        for c in new_courses:
            course = db.query(Course).filter_by(name=c["name"], teacher_id=teacher.id).first()
            if not course:
                course = Course(
                    name=c["name"],
                    code=c["code"],
                    tenant_id=teacher.tenant_id,
                    teacher_id=teacher.id
                )
                db.add(course)
                db.commit()
                db.refresh(course)
                
                # Enroll the student in these courses so they can be scanned
                existing_enroll = db.query(Enrollment).filter_by(course_id=course.id, student_id=student.id).first()
                if not existing_enroll:
                    db.add(Enrollment(course_id=course.id, student_id=student.id))
                    db.commit()

        print("Successfully added new custom courses and enrolled the student!")

if __name__ == "__main__":
    seed_custom_courses()
