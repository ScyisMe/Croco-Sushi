"""Admin endpoints для налаштувань сайту"""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.core.dependencies import get_current_admin_user
from app.core.config import settings
from app.models.user import User

router = APIRouter()


class SettingsResponse(BaseModel):
    """Налаштування сайту"""
    project_name: str
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    working_hours: Optional[str] = None
    min_order_amount: Optional[float] = None
    delivery_cost: Optional[float] = None
    free_delivery_threshold: Optional[float] = None
    # SMS налаштування
    sms_api_key: Optional[str] = None
    # Платежі
    payment_liqpay_public_key: Optional[str] = None
    payment_liqpay_private_key: Optional[str] = None
    # Google Maps
    google_maps_api_key: Optional[str] = None
    # Analytics
    google_analytics_id: Optional[str] = None
    yandex_metrika_id: Optional[str] = None


class SettingsUpdate(BaseModel):
    """Оновлення налаштувань"""
    project_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    working_hours: Optional[str] = None
    min_order_amount: Optional[float] = None
    delivery_cost: Optional[float] = None
    free_delivery_threshold: Optional[float] = None
    sms_api_key: Optional[str] = None
    payment_liqpay_public_key: Optional[str] = None
    payment_liqpay_private_key: Optional[str] = None
    google_maps_api_key: Optional[str] = None
    google_analytics_id: Optional[str] = None
    yandex_metrika_id: Optional[str] = None


@router.get("", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати налаштування сайту"""
    # TODO: В майбутньому зберігати налаштування в БД
    # Поки що повертаємо з config
    return SettingsResponse(
        project_name=settings.PROJECT_NAME,
        working_hours="10:00 - 22:00",
        min_order_amount=200.0,
        free_delivery_threshold=500.0,
    )


@router.put("", response_model=SettingsResponse)
async def update_settings(
    settings_data: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Оновити налаштування сайту"""
    # TODO: Зберігати налаштування в БД
    # Поки що повертаємо оновлені дані
    
    current_settings = SettingsResponse(
        project_name=settings.PROJECT_NAME,
        working_hours="10:00 - 22:00",
        min_order_amount=200.0,
        free_delivery_threshold=500.0,
    )
    
    update_data = settings_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(current_settings, field):
            setattr(current_settings, field, value)
    
    return current_settings

