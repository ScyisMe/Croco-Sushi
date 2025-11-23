"""API endpoints для доставки"""
from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from app.database import get_db
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.delivery_zone import DeliveryZone

router = APIRouter()


class DeliveryCalculateRequest(BaseModel):
    """Запит на розрахунок вартості доставки"""
    city: str
    street: Optional[str] = None
    house: Optional[str] = None
    order_amount: Decimal = Field(..., ge=0)


class DeliveryCalculateResponse(BaseModel):
    """Відповідь з вартістю доставки"""
    delivery_cost: Decimal
    free_delivery_threshold: Optional[Decimal] = None
    min_order_amount: Decimal
    delivery_time_minutes: Optional[int] = None
    zone_name: Optional[str] = None


@router.post("/calculate", response_model=DeliveryCalculateResponse)
async def calculate_delivery_cost(
    request: DeliveryCalculateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Розрахунок вартості доставки"""
    # Перевірка мінімальної суми замовлення
    # TODO: В майбутньому визначити зону доставки по адресі
    # Поки що використовуємо першу активну зону
    
    result = await db.execute(
        select(DeliveryZone)
        .where(DeliveryZone.is_active == True)
        .where(DeliveryZone.name.ilike(f"%{request.city}%"))
        .order_by(DeliveryZone.position)
        .limit(1)
    )
    zone = result.scalar_one_or_none()
    
    # Якщо зона не знайдена, використовуємо стандартні тарифи
    if not zone:
        # Стандартні тарифи (з налаштувань)
        delivery_cost = Decimal("50.00")
        min_order_amount = Decimal("200.00")
        free_delivery_threshold = Decimal("500.00")
        delivery_time_minutes = 60
        zone_name = None
    else:
        delivery_cost = zone.delivery_cost
        min_order_amount = zone.min_order_amount
        free_delivery_threshold = zone.free_delivery_threshold
        delivery_time_minutes = zone.delivery_time_minutes
        zone_name = zone.name
        
        # Перевірка мінімальної суми
        if request.order_amount < min_order_amount:
            raise BadRequestException(
                f"Мінімальна сума замовлення: {min_order_amount} грн"
            )
        
        # Безкоштовна доставка
        if free_delivery_threshold and request.order_amount >= free_delivery_threshold:
            delivery_cost = Decimal("0.00")
    
    return DeliveryCalculateResponse(
        delivery_cost=delivery_cost,
        free_delivery_threshold=free_delivery_threshold,
        min_order_amount=min_order_amount,
        delivery_time_minutes=delivery_time_minutes,
        zone_name=zone_name
    )

