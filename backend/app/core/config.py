from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator
from typing import List, Optional, Any, Union


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Croco Sushi"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development, production, testing
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/croco_sushi"
    
    # Database Connection Settings
    POSTGRES_POOL_SIZE: int = 5
    POSTGRES_MAX_OVERFLOW: int = 10
    POSTGRES_POOL_TIMEOUT: int = 30
    POSTGRES_CONNECT_TIMEOUT: int = 10
    POSTGRES_COMMAND_TIMEOUT: int = 30
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # CORS
    ALLOWED_HOSTS: Union[List[str], str] = ["*"]
    
    # Парсимо рядок з комами в список автоматично
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://crocosushi.com",
        "https://www.crocosushi.com",
        "https://api.crocosushi.com"
    ]
    
    @field_validator("CORS_ORIGINS", "ALLOWED_HOSTS", mode="before")
    @classmethod
    def parse_list_from_str(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        if isinstance(v, list):
            return v
        return []
    
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
        env_file=".env",
        case_sensitive=True,
        extra='ignore'  # Ігноруємо додаткові поля з .env (POSTGRES_*, GF_* тощо)
    )


settings = Settings()

