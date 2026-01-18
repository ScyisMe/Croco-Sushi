"""Admin endpoints для управління промокодами"""
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.core.dependencies import get_current_admin_user
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.user import User
from app.models.promo_code import PromoCode
from app.models.product import Product
from app.models.order import Order
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func


router = APIRouter()


class PromoCodeBase(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str  # percent, fixed, free_product
    discount_value: Decimal
    product_id: Optional[int] = None
    start_date: datetime
    end_date: datetime
    min_order_amount: Optional[Decimal] = None
    max_uses: Optional[int] = None
    max_uses_per_user: Optional[int] = None
    is_active: bool = True


class PromoCodeCreate(PromoCodeBase):
    pass


class PromoCodeUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    product_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    min_order_amount: Optional[Decimal] = None
    max_uses: Optional[int] = None
    max_uses_per_user: Optional[int] = None
    is_active: Optional[bool] = None


class PromoCodeResponse(PromoCodeBase):
    id: int
    current_uses: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


@router.get("", response_model=List[PromoCodeResponse])
async def get_promo_codes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати список промокодів"""
    query = select(PromoCode)
    
    if is_active is not None:
        query = query.where(PromoCode.is_active == is_active)
    
    query = query.order_by(PromoCode.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    promo_codes = result.scalars().all()
    
    return promo_codes


@router.post("", response_model=PromoCodeResponse, status_code=status.HTTP_201_CREATED)
async def create_promo_code(
    promo_code_data: PromoCodeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Створити промокод"""
    # Перевірка чи код вже існує
    result = await db.execute(
        select(PromoCode).where(PromoCode.code == promo_code_data.code)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise BadRequestException("Промокод з таким кодом вже існує")
    
    new_promo_code = PromoCode(**promo_code_data.model_dump())
    
    db.add(new_promo_code)
    await db.commit()
    await db.refresh(new_promo_code)
    
    return new_promo_code


@router.put("/{promo_code_id}", response_model=PromoCodeResponse)
async def update_promo_code(
    promo_code_id: int,
    promo_code_data: PromoCodeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Оновити промокод"""
    result = await db.execute(
        select(PromoCode).where(PromoCode.id == promo_code_id)
    )
    promo_code = result.scalar_one_or_none()
    
    if not promo_code:
        raise NotFoundException("Промокод не знайдено")
    
    # Перевірка коду, якщо змінюється
    if promo_code_data.code and promo_code_data.code != promo_code.code:
        result = await db.execute(
            select(PromoCode).where(
                PromoCode.code == promo_code_data.code,
                PromoCode.id != promo_code_id
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise BadRequestException("Промокод з таким кодом вже існує")
    
    update_data = promo_code_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(promo_code, field):
            setattr(promo_code, field, value)
    
    await db.commit()
    await db.refresh(promo_code)
    
    return promo_code


@router.delete("/{promo_code_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_promo_code(
    promo_code_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Видалити промокод"""
    result = await db.execute(
        select(PromoCode).where(PromoCode.id == promo_code_id)
    )
    promo_code = result.scalar_one_or_none()
    
    if not promo_code:
        raise NotFoundException("Промокод не знайдено")
    
    # Правильний спосіб видалення в SQLAlchemy 2.0 async
    try:
        await db.execute(delete(PromoCode).where(PromoCode.id == promo_code_id))
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise BadRequestException("Не можна видалити промокод, який вже використовувався в замовленнях. Ви можете деактивувати його.")
    
    return None

class PromoCodeStats(BaseModel):
    id: int
    code: str
    total_uses: int
    total_discount: Decimal
    product_name: Optional[str] = None
    product_price: Optional[Decimal] = None


@router.get("/stats/all", response_model=List[PromoCodeStats])
async def get_promo_code_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати статистику використання промокодів"""
    # Групуємо замовлення за промокодом
    query = (
        select(
            PromoCode.id,
            PromoCode.code,
            func.count(Order.id).label("total_uses"),
            func.sum(func.coalesce(Order.discount, 0)).label("total_discount"),
            Product.name.label("product_name"),
            Product.price.label("product_price")
        )
        .outerjoin(Order, Order.promo_code_id == PromoCode.id)
        .outerjoin(Product, PromoCode.product_id == Product.id)
        .group_by(PromoCode.id, PromoCode.code, Product.name, Product.price)
        .order_by(func.sum(func.coalesce(Order.discount, 0)).desc())
    )
    
    result = await db.execute(query)
    
    stats = []
    for row in result:
        stats.append(PromoCodeStats(
            id=row.id,
            code=row.code,
            total_uses=row.total_uses,
            total_discount=row.total_discount or Decimal("0.00"),
            product_name=row.product_name,
            product_price=row.product_price
        ))
        
    return stats


