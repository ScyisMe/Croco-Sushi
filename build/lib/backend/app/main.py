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
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # Тільки необхідні методи
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],  # Тільки необхідні заголовки
    expose_headers=["Content-Type", "X-Total-Count"],  # Заголовки які клієнт може читати
    max_age=3600,  # Кешування preflight запитів на 1 годину
)

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


