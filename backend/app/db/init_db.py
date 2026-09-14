from app.db.session import engine
from app.db.base import Base
from app.models.tenant import Tenant
from app.models.user import User
from app.models.course import Course, Enrollment
from app.models.attendance import AttendanceSession, AttendanceRecord
from sqlalchemy.orm import Session

from sqlalchemy import text

def init_db():
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR;"))
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Migration skip: {e}")

        uet = db.query(Tenant).filter(Tenant.domain == "uetpeshawar.edu.pk").first()
        if not uet:
            db.add(Tenant(name="UET Peshawar", domain="uetpeshawar.edu.pk"))
            db.commit()

if __name__ == "__main__":
    init_db()
    print("Database tables created successfully.")
