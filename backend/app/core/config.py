import os
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusCare — AI-Based Campus Complaint Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # JWT / Auth — reads SECRET_KEY or JWT_SECRET_KEY from env
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        os.getenv("JWT_SECRET_KEY", "campuscare-super-secret-jwt-key-cse-2026-evaluation-xyz")
    )
    ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Database
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'campuscare.db')}".replace("\\", "/"))

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    ALLOWED_EXTENSIONS: set = {
        "png", "jpg", "jpeg", "webp", "gif", "pdf",
        "mp3", "wav", "webm", "ogg", "m4a", "aac"
    }
    MAX_FILE_SIZE: int = 25 * 1024 * 1024  # 25 MB
    
    # ML Models
    ML_ARTIFACTS_DIR: str = os.path.join(BASE_DIR, "ml", "model_artifacts")
    
    # CORS — comma-separated list via env var, e.g. "https://myapp.onrender.com,http://localhost:5173"
    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        raw = os.getenv("CORS_ORIGINS", "")
        if raw.strip() == "*":
            return ["*"]
        origins = [o.strip() for o in raw.split(",") if o.strip()]
        if not origins:
            # Local dev defaults
            origins = [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ]
        return origins

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

