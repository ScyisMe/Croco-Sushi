from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.api import api_router
import logging

# Налаштування логування
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Croco Sushi API",
    description="API для сайту доставки суші",
    version="0.1.0",
)

# CORS middleware
# БЕЗПЕКА: Обмежуємо методи та заголовки для зменшення поверхні атаки
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    expose_headers=["Content-Type", "X-Total-Count"],
    max_age=3600,
)

from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import time
import redis

# Trusted Host Middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=settings.ALLOWED_HOSTS or ["*"]
)

# Rate Limiting Middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 100, window: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window = window
        try:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception:
            self.redis = None

    async def dispatch(self, request: Request, call_next):
        if not self.redis:
            return await call_next(request)
            
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        key = f"rate_limit:{client_ip}"
        
        # Check rate limit
        current = self.redis.get(key)
        if current and int(current) >= self.limit:
            return Response("Too Many Requests", status_code=429)
            
        # Increment and set expiry
        pipe = self.redis.pipeline()
        pipe.incr(key)
        if not current:
            pipe.expire(key, self.window)
        pipe.execute()
        
        response = await call_next(request)
        return response

# Add Rate Limiting (100 requests per minute)
app.add_middleware(RateLimitMiddleware, limit=100, window=60)

# Підключення роутерів
app.include_router(api_router, prefix="/api/v1")

# Обслуговування статичних файлів (завантажені файли)
# КРИТИЧНО: Монтуємо тільки директорію uploads, щоб не виставити вихідний код
upload_dir = Path(settings.UPLOAD_DIR).resolve()  # Використовуємо абсолютний шлях
upload_dir.mkdir(parents=True, exist_ok=True)

# Монтуємо саму директорію uploads на /static/uploads/
# URL: /static/uploads/... -> файли з uploads/...
try:
    app.mount("/static/uploads", StaticFiles(directory=str(upload_dir)), name="static_uploads")
except ValueError:
    # Якщо вже змонтовано - ігноруємо
    pass
except Exception as e:
    logger.warning(f"Не вдалося змонтувати статичні файли: {e}")


@app.get("/")
async def root():
    return {"message": "Croco Sushi API", "version": "0.1.0"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


