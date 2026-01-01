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
    is_maintenance_mode: bool = False


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
    is_maintenance_mode: Optional[bool] = None


@router.get("", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати налаштування сайту"""
    
    # Отримуємо всі налаштування з БД
    from app.models.setting import Setting
    from sqlalchemy import select
    
    result = await db.execute(select(Setting))
    db_settings = result.scalars().all()
    
    settings_dict = {s.key: s.value for s in db_settings}
    
    # Формуємо відповідь, беручи значення з БД або дефолтні
    return SettingsResponse(
        project_name=settings_dict.get("project_name", settings.PROJECT_NAME),
        working_hours=settings_dict.get("working_hours", "10:00 - 22:00"),
        min_order_amount=float(settings_dict.get("min_order_amount", 200.0)),
        delivery_cost=float(settings_dict.get("delivery_cost", 0)),
        free_delivery_threshold=float(settings_dict.get("free_delivery_threshold", 500.0)),
        contact_phone=settings_dict.get("contact_phone"),
        contact_email=settings_dict.get("contact_email"),
        address=settings_dict.get("address"),
        sms_api_key=settings_dict.get("sms_api_key"),
        payment_liqpay_public_key=settings_dict.get("payment_liqpay_public_key"),
        payment_liqpay_private_key=settings_dict.get("payment_liqpay_private_key"),
        google_maps_api_key=settings_dict.get("google_maps_api_key"),
        google_analytics_id=settings_dict.get("google_analytics_id"),
        is_maintenance_mode=settings_dict.get("is_maintenance_mode") == "true"
    )


@router.put("", response_model=SettingsResponse)
async def update_settings(
    settings_data: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Оновити налаштування сайту"""
    from app.models.setting import Setting
    from sqlalchemy import select
    
    update_data = settings_data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        # Конвертуємо значення в стрічку для збереження
        str_value = str(value) if value is not None else ""
        if isinstance(value, bool):
            str_value = "true" if value else "false"
            
        # Шукаємо існуюче налаштування
        result = await db.execute(select(Setting).where(Setting.key == key))
        setting_item = result.scalar_one_or_none()
        
        if setting_item:
            setting_item.value = str_value
        else:
            setting_item = Setting(key=key, value=str_value, is_public=True) # Більшість налаштувань тут публічні
            db.add(setting_item)
            
    await db.commit()
    
    # Повертаємо оновлені дані
    return await get_settings(db, current_user)

