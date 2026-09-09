import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusCare — AI-Based Campus Complaint Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "campuscare-super-secret-jwt-key-cse-2026-evaluation-xyz")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'campuscare.db')}".replace("\\", "/"))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    ALLOWED_EXTENSIONS: set = {
        "png", "jpg", "jpeg", "webp", "gif", "pdf",
        "mp3", "wav", "webm", "ogg", "m4a", "aac"
    }
    MAX_FILE_SIZE: int = 25 * 1024 * 1024  # 25 MB
    
    # ML Models
    ML_ARTIFACTS_DIR: str = os.path.join(BASE_DIR, "ml", "model_artifacts")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
