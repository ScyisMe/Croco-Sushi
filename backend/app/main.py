"""Main FastAPI application."""
from contextlib import asynccontextmanager
from pathlib import Path
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import redis.asyncio as redis  # Асинхронна версія Redis

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.api import api_router

# Налаштування логування
setup_logging()
logger = logging.getLogger(__name__)

# --- Redis & Lifespan ---
# Глобальний клієнт Redis, який буде ініціалізовано при старті
redis_client: redis.Redis | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup/shutdown events."""
    global redis_client
    
    # Startup: Підключення до Redis
    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        await redis_client.ping()
        logger.info("Connected to Redis for Rate Limiting")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}. Rate limiting disabled.")
        redis_client = None
    
    yield
    
    # Shutdown: Закриття з'єднання
    if redis_client:
        await redis_client.aclose()
        logger.info("Redis connection closed")


app = FastAPI(
    title="Croco Sushi API",
    description="API для сайту доставки суші",
    version="0.1.0",
    lifespan=lifespan  # Підключаємо lifespan для управління з'єднаннями
)

# --- Middlewares ---
# ВАЖЛИВО: В FastAPI middleware, який додано ОСТАННІМ, виконується ПЕРШИМ.
# Тому CORS ставимо в кінці, щоб він обгортав всі відповіді (включаючи 429).

# 1. Trusted Host (внутрішній - додаємо першим)
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=settings.ALLOWED_HOSTS or ["*"]
)


# 2. Rate Limiting (Async Middleware)
class RateLimitMiddleware(BaseHTTPMiddleware):
    """Async Rate Limiting Middleware using Redis."""
    
    def __init__(self, app, limit: int = 100, window: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window = window

    async def dispatch(self, request: Request, call_next):
        # Пропускаємо OPTIONS запити (CORS preflight) без лімітування
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Якщо Redis не підключено або це статичний файл/docs - пропускаємо
        if not redis_client or request.url.path.startswith(("/static", "/docs", "/redoc", "/openapi.json")):
            return await call_next(request)
        
        # Отримуємо IP (враховуючи proxy)
        # Якщо є X-Forwarded-For, беремо перший IP
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        
        key = f"rate_limit:{client_ip}"
        
        try:
            # АСИНХРОННИЙ PIPELINE (Atomic operation)
            async with redis_client.pipeline() as pipe:
                await pipe.incr(key)
                await pipe.expire(key, self.window, nx=True)  # nx=True: expire тільки якщо ключа не було
                results = await pipe.execute()
            
            request_count = results[0]
            
            if request_count > self.limit:
                return Response(
                    "Too Many Requests", 
                    status_code=429,
                    headers={"Retry-After": str(self.window)}
                )
        
        except Exception as e:
            # Якщо Redis впав під час запиту, не блокуємо користувача
            logger.error(f"Rate limiter error: {e}")
        
        return await call_next(request)


# Активуємо Rate Limit (1000 запитів за хвилину для комфортної розробки)
app.add_middleware(RateLimitMiddleware, limit=1000, window=60)


# 3. CORS (ОСТАННІМ - щоб виконувався ПЕРШИМ і обгортав всі відповіді)
# Це гарантує, що навіть 429 відповіді матимуть CORS-заголовки
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    expose_headers=["Content-Type", "X-Total-Count"],
    max_age=3600,
)


# --- Routing ---
app.include_router(api_router, prefix="/api/v1")


# --- Static Files ---
# КРИТИЧНО: Монтуємо тільки директорію uploads, щоб не виставити вихідний код
upload_dir = Path(settings.UPLOAD_DIR).resolve()
upload_dir.mkdir(parents=True, exist_ok=True)

try:
    app.mount("/static/uploads", StaticFiles(directory=str(upload_dir)), name="static_uploads")
except ValueError:
    # Якщо вже змонтовано - ігноруємо
    pass
except Exception as e:
    logger.warning(f"Не вдалося змонтувати статичні файли: {e}")


# --- Health & Root Endpoints ---

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Croco Sushi API", "version": "0.1.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint with Redis status."""
    redis_status = "ok" if redis_client else "down"
    return {
        "status": "ok",
        "redis": redis_status,
        "version": "0.1.0"
    }
