from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.courses import router as courses_router
from app.api.attendance import router as attendance_router
from app.db.init_db import init_db

app = FastAPI(
    title="Attendance SaaS API",
    description="Backend API for the multi-tenant Attendance Management System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(courses_router, prefix="/api/courses", tags=["Courses"])
app.include_router(attendance_router, prefix="/api/attendance", tags=["Attendance"])


@app.get("/")
def read_root():
    return {"message": "Welcome to the Attendance SaaS API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
