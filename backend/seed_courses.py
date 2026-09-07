from app.db.session import engine
from sqlalchemy.orm import Session
from app.models.tenant import Tenant
from app.models.course import Course
from app.models.user import User

def seed():
    with Session(engine) as db:
        uet = db.query(Tenant).filter(Tenant.domain == "uetpeshawar.edu.pk").first()
        if not uet:
            print("Tenant not found.")
            return

        courses = [
            {"name": "Embedded System Design", "code": "ESD"},
            {"name": "Analysis of Algorithms", "code": "AOA"},
            {"name": "Artificial Intelligence", "code": "AI"},
            {"name": "Human Resource Management", "code": "HRM"},
            {"name": "Technical Writing and Presentation Skills", "code": "TW"},
            {"name": "Software Construction and Development", "code": "SCD"}
        ]
        
        for c in courses:
            existing = db.query(Course).filter(Course.name == c["name"], Course.tenant_id == uet.id).first()
            if not existing:
                course = Course(name=c["name"], code=c["code"], tenant_id=uet.id)
                db.add(course)
        
        db.commit()
        print("Courses added!")

seed()
