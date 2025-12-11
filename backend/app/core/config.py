from pydantic_settings import BaseSettings
from pydantic import ConfigDict, model_validator
from typing import List, Optional


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
    ALLOWED_HOSTS: str = "*"
    
    # Парсимо рядок з комами в список автоматично
    # Використовуємо str як базовий тип, щоб уникнути JSON парсингу
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,https://crocosushi.com,https://www.crocosushi.com,https://api.crocosushi.com"
    
    @model_validator(mode='after')
    def parse_cors_origins(self) -> 'Settings':
        """Парсить CORS_ORIGINS з рядка, розділеного комами, в список"""
        if isinstance(self.CORS_ORIGINS, str):
            # Розділяємо по комі та очищаємо пробіли
            cors_list = [origin.strip() for origin in self.CORS_ORIGINS.split(',') if origin.strip()]
            # Замінюємо рядок на список
            object.__setattr__(self, 'CORS_ORIGINS', cors_list)
            
        if isinstance(self.ALLOWED_HOSTS, str):
            # Розділяємо по комі та очищаємо пробіли
            hosts_list = [host.strip() for host in self.ALLOWED_HOSTS.split(',') if host.strip()]
            # Замінюємо рядок на список
            object.__setattr__(self, 'ALLOWED_HOSTS', hosts_list)
            
        return self
    
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

