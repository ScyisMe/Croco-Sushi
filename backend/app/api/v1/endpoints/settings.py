"""API endpoints для публічних налаштувань"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
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
    is_maintenance_mode: bool = False


@router.get("/public", response_model=PublicSettingsResponse)
async def get_public_settings(
    db: AsyncSession = Depends(get_db)
):
    """Отримати публічні налаштування (графік роботи, контакти)"""
    from app.models.setting import Setting
    from sqlalchemy import select
    
    # Отримуємо всі налаштування
    # В майбутньому можна фільтрувати по is_public
    result = await db.execute(select(Setting))
    db_settings = result.scalars().all()
    
    settings_dict = {s.key: s.value for s in db_settings}
    
    return PublicSettingsResponse(
        project_name=settings_dict.get("project_name", settings.PROJECT_NAME),
        working_hours=settings_dict.get("working_hours", "10:00 - 22:00"),
        min_order_amount=float(settings_dict.get("min_order_amount", 200.0)),
        free_delivery_threshold=float(settings_dict.get("free_delivery_threshold", 500.0)),
        contact_phone=settings_dict.get("contact_phone"),
        contact_email=settings_dict.get("contact_email"),
        address=settings_dict.get("address"),
        is_maintenance_mode=settings_dict.get("is_maintenance_mode") == "true"
    )

