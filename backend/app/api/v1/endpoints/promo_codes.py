"""Публічні API endpoints для промокодів"""
from typing import Optional
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db
from app.models.promo_code import PromoCode
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter()


class PromoCodeVerifyRequest(BaseModel):
    code: str
    order_amount: Optional[Decimal] = None


class PromoCodeVerifyResponse(BaseModel):
    valid: bool
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    message: Optional[str] = None


@router.post("/verify", response_model=PromoCodeVerifyResponse)
async def verify_promo_code(
    data: PromoCodeVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """Перевірка промокоду"""
    # Нормалізація коду (видалення пробілів, верхній регістр)
    code = data.code.strip()
    
    query = select(PromoCode).where(PromoCode.code == code)
    result = await db.execute(query)
    promo = result.scalar_one_or_none()
    
    if not promo:
        return PromoCodeVerifyResponse(valid=False, message="Промокод не знайдено")
        
    if not promo.is_active:
        return PromoCodeVerifyResponse(valid=False, message="Промокод неактивний")
        
    now = datetime.now(promo.start_date.tzinfo)
    
    if now < promo.start_date:
        return PromoCodeVerifyResponse(valid=False, message="Термін дії промокоду ще не настав")
        
    if now > promo.end_date:
        return PromoCodeVerifyResponse(valid=False, message="Термін дії промокоду закінчився")
        
    if promo.max_uses is not None and promo.current_uses >= promo.max_uses:
        return PromoCodeVerifyResponse(valid=False, message="Ліміт використання промокоду вичерпано")
        
    if data.order_amount is not None and promo.min_order_amount is not None:
        if data.order_amount < promo.min_order_amount:
            return PromoCodeVerifyResponse(
                valid=False, 
                message=f"Мінімальна сума замовлення для цього промокоду: {promo.min_order_amount} грн"
            )

    return PromoCodeVerifyResponse(
        valid=True,
        code=promo.code,
        discount_type=promo.discount_type,
        discount_value=promo.discount_value,
        message="Промокод успішно застосовано"
    )
