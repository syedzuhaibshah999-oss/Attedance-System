from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Attendance SaaS"
    DATABASE_URL: str = "postgresql://admin:adminpassword@localhost:5432/attendancedb"
    SECRET_KEY: str = "supersecretkey_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Comma-separated list of allowed teacher emails.
    # Example: "prof.khan@uetpeshawar.edu.pk,dr.ali@uetpeshawar.edu.pk"
    # If empty, all emails are permitted to register as teacher (dev mode only).
    ALLOWED_TEACHER_EMAILS: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
