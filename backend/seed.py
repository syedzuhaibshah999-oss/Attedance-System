import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import engine
from app.models.tenant import Tenant
from app.models.user import User
from app.models.course import Course, Enrollment
from app.core.security import get_password_hash

def seed():
    with Session(engine) as db:
        # Create Tenant
        tenant = db.query(Tenant).filter_by(name="Test University").first()
        if not tenant:
            tenant = Tenant(name="Test University", domain="test.edu")
            db.add(tenant)
            db.commit()
            db.refresh(tenant)

        # Create Teacher
        teacher = db.query(User).filter_by(email="teacher@test.edu").first()
        if not teacher:
            teacher = User(
                email="teacher@test.edu",
                hashed_password=get_password_hash("password123"),
                full_name="Dr. Smith",
                role="teacher",
                tenant_id=tenant.id
            )
            db.add(teacher)
            db.commit()
            db.refresh(teacher)

        # Create Student
        student = db.query(User).filter_by(email="student@test.edu").first()
        if not student:
            student = User(
                email="student@test.edu",
                hashed_password=get_password_hash("student123"),
                full_name="Alex Johnson",
                role="student",
                tenant_id=tenant.id
            )
            db.add(student)
            db.commit()
            db.refresh(student)

        # Create Courses
        courses_data = [
            {"name": "Data Structures & Algorithms", "code": "CS-301"},
            {"name": "Database Management Systems", "code": "CS-402"},
            {"name": "Web Engineering", "code": "CS-501"},
            {"name": "Artificial Intelligence", "code": "CS-601"}
        ]
        
        for c in courses_data:
            course = db.query(Course).filter_by(code=c["code"]).first()
            if not course:
                course = Course(
                    name=c["name"],
                    code=c["code"],
                    tenant_id=tenant.id,
                    teacher_id=teacher.id
                )
                db.add(course)
                db.commit()
                db.refresh(course)
                
                # Enroll student
                db.add(Enrollment(course_id=course.id, student_id=student.id))
                db.commit()

        print("Database seeded successfully with beautiful demo data!")

if __name__ == "__main__":
    seed()
