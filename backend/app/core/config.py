from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator
from typing import List, Optional
import json
import os
import secrets


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Croco Sushi"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development, production, testing
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/croco_sushi"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Security - додаткові налаштування
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_MAX_LENGTH: int = 128
    MAX_LOGIN_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    ECHO_SQL: bool = False  # Логування SQL запитів (тільки для розробки, False в production)
    
    # Email
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: Optional[str] = None
    EMAIL_FROM_NAME: str = "Croco Sushi"
    
    # SMS
    SMS_PROVIDER: Optional[str] = None  # "twilio", "smsru", тощо
    SMS_API_KEY: Optional[str] = None
    SMS_API_SECRET: Optional[str] = None
    SMS_FROM_NUMBER: Optional[str] = None
    
    model_config = ConfigDict(
        env_file=".env" if os.getenv("ENVIRONMENT") != "test" else None,
        env_file_encoding="utf-8",
        case_sensitive=True,
        env_ignore_empty=True,
        extra="ignore"  # Ігноруємо додаткові змінні середовища, які не визначені в класі (наприклад, POSTGRES_USER, GF_SECURITY_ADMIN_USER тощо)
    )
    
    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # Спробуємо розпарсити як JSON
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                # Якщо не JSON, розділимо по комі
                return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v
    
    @field_validator('SECRET_KEY', mode='after')
    @classmethod
    def validate_secret_key(cls, v, info):
        """Перевірка що SECRET_KEY не є дефолтним в production"""
        env = info.data.get('ENVIRONMENT', 'development')
        if env == 'production' and v == "your-secret-key-change-in-production":
            raise ValueError("SECRET_KEY повинен бути змінений в production!")
        if len(v) < 32:
            raise ValueError("SECRET_KEY повинен бути мінімум 32 символи")
        return v


settings = Settings()

