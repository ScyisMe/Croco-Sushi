"""Admin endpoints для управління зонами доставки"""
from typing import List, Optional
from datetime import time, datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.core.dependencies import get_current_admin_user
from app.core.exceptions import NotFoundException
from app.models.user import User
from app.models.delivery_zone import DeliveryZone
from pydantic import BaseModel, ConfigDict

router = APIRouter()


class DeliveryZoneBase(BaseModel):
    name: str
    description: Optional[str] = None
    coordinates: Optional[dict] = None
    delivery_cost: Decimal
    free_delivery_threshold: Optional[Decimal] = None
    min_order_amount: Decimal
    working_hours_start: Optional[time] = None
    working_hours_end: Optional[time] = None
    delivery_time_minutes: Optional[int] = None
    is_active: bool = True
    position: int = 0


class DeliveryZoneCreate(DeliveryZoneBase):
    pass


class DeliveryZoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    coordinates: Optional[dict] = None
    delivery_cost: Optional[Decimal] = None
    free_delivery_threshold: Optional[Decimal] = None
    min_order_amount: Optional[Decimal] = None
    working_hours_start: Optional[time] = None
    working_hours_end: Optional[time] = None
    delivery_time_minutes: Optional[int] = None
    is_active: Optional[bool] = None
    position: Optional[int] = None


class DeliveryZoneResponse(DeliveryZoneBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


@router.get("", response_model=List[DeliveryZoneResponse])
async def get_delivery_zones(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати список зон доставки"""
    query = select(DeliveryZone)
    
    if is_active is not None:
        query = query.where(DeliveryZone.is_active == is_active)
    
    query = query.order_by(DeliveryZone.position, DeliveryZone.name).offset(skip).limit(limit)
    
    result = await db.execute(query)
    zones = result.scalars().all()
    
    return zones


@router.post("", response_model=DeliveryZoneResponse, status_code=status.HTTP_201_CREATED)
async def create_delivery_zone(
    zone_data: DeliveryZoneCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Створити зону доставки"""
    new_zone = DeliveryZone(**zone_data.model_dump())
    
    db.add(new_zone)
    await db.commit()
    await db.refresh(new_zone)
    
    return new_zone


@router.put("/{zone_id}", response_model=DeliveryZoneResponse)
async def update_delivery_zone(
    zone_id: int,
    zone_data: DeliveryZoneUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Оновити зону доставки"""
    result = await db.execute(
        select(DeliveryZone).where(DeliveryZone.id == zone_id)
    )
    zone = result.scalar_one_or_none()
    
    if not zone:
        raise NotFoundException("Зона доставки не знайдена")
    
    update_data = zone_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(zone, field):
            setattr(zone, field, value)
    
    await db.commit()
    await db.refresh(zone)
    
    return zone


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_delivery_zone(
    zone_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Видалити зону доставки"""
    result = await db.execute(
        select(DeliveryZone).where(DeliveryZone.id == zone_id)
    )
    zone = result.scalar_one_or_none()
    
    if not zone:
        raise NotFoundException("Зона доставки не знайдена")
    
    # Правильний спосіб видалення в SQLAlchemy 2.0 async
    await db.execute(delete(DeliveryZone).where(DeliveryZone.id == zone_id))
    await db.commit()
    
    return None

