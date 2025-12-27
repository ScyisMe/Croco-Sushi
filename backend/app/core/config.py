from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator
from typing import List, Optional, Any, Union


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Croco Sushi"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development, production, testing
    
    # Internal: Detect if running in Docker
    import os
    _IN_DOCKER: bool = os.path.exists("/.dockerenv") or os.path.exists("/proc/self/cgroup")
    
    # Database
    # Logic: If in Docker, default to production service names and credentials (admin_croco).
    # If Local, default to localhost and standard credentials.
    # explicit ENV vars (if present and correct) will still override due to Pydantic behavior,
    # but we provide the correct defaults for the VPS context.
    
    DATABASE_URL: str = (
        "postgresql+asyncpg://admin_croco:Spicy-Tuna-Roll-2025-Tasty!@postgres:5432/croco_sushi"
        if _IN_DOCKER
        else "postgresql+asyncpg://postgres:postgres@localhost:5432/croco_sushi"
    )
    
    # Remove the previous complex validator as this default is safer
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v: Optional[str], info: Any) -> Any:
        # If a value is provided (from env), use it, UNLESS it looks like the broken default
        # injected by some VPS environments (postgres user on production host)
        
        # Check for context
        import os
        in_docker = os.path.exists("/.dockerenv") or os.path.exists("/proc/self/cgroup")
        
        if in_docker and v and "postgres:postgres" in v:
            # Dangerous default detected in Docker.
            # We suspect this is WRONG for this specific VPS.
            # Override with the known good production URI.
            return "postgresql+asyncpg://admin_croco:Spicy-Tuna-Roll-2025-Tasty!@postgres:5432/croco_sushi"
            
        return v

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
    # Use "redis" host if in Docker, "localhost" if not.
    REDIS_URL: str = "redis://redis:6379/0" if _IN_DOCKER else "redis://localhost:6379/0"
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    
    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/0" if _IN_DOCKER else "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0" if _IN_DOCKER else "redis://localhost:6379/0"
    
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

