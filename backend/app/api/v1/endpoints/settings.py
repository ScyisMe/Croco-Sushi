"""API endpoints для публічних налаштувань"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.core.config import settings

router = APIRouter()


class PublicSettingsResponse(BaseModel):
    """Публічні налаштування сайту"""
    project_name: str
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    working_hours: Optional[str] = None
    min_order_amount: Optional[float] = None
    free_delivery_threshold: Optional[float] = None


@router.get("/public", response_model=PublicSettingsResponse)
async def get_public_settings():
    """Отримання публічних налаштувань (графік роботи, контакти)"""
    # TODO: В майбутньому ці дані будуть братися з БД або конфігурації
    # Поки що повертаємо базові налаштування
    return PublicSettingsResponse(
        project_name=settings.PROJECT_NAME,
        working_hours="10:00 - 22:00",
        min_order_amount=200.0,
        free_delivery_threshold=500.0,
    )

