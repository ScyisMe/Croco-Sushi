"""Admin endpoints для управління акціями"""
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.core.dependencies import get_current_admin_user
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.user import User
from app.models.promotion import Promotion
from app.schemas.promotion import PromotionCreate, PromotionUpdate, PromotionResponse

router = APIRouter()


@router.get("", response_model=List[PromotionResponse])
async def get_promotions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_active: Optional[bool] = None,
    category_id: Optional[int] = None,
    product_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати список акцій"""
    query = select(Promotion)
    
    if is_active is not None:
        query = query.where(Promotion.is_active == is_active)
    
    if category_id:
        query = query.where(Promotion.category_id == category_id)
    
    if product_id:
        query = query.where(Promotion.product_id == product_id)
    
    query = query.order_by(Promotion.position, Promotion.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    promotions = result.scalars().all()
    
    return promotions


@router.post("", response_model=PromotionResponse, status_code=status.HTTP_201_CREATED)
async def create_promotion(
    promotion_data: PromotionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Створити акцію"""
    # Перевірка чи slug вже існує
    result = await db.execute(
        select(Promotion).where(Promotion.slug == promotion_data.slug)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise BadRequestException("Акція з таким slug вже існує")
    
    new_promotion = Promotion(**promotion_data.model_dump())
    
    db.add(new_promotion)
    await db.commit()
    await db.refresh(new_promotion)
    
    return new_promotion



@router.get("/{promotion_id}", response_model=PromotionResponse)
async def get_promotion(
    promotion_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати деталі акції"""
    result = await db.execute(
        select(Promotion).where(Promotion.id == promotion_id)
    )
    promotion = result.scalar_one_or_none()
    
    if not promotion:
        raise NotFoundException("Акцію не знайдено")
    
    return promotion


@router.put("/{promotion_id}", response_model=PromotionResponse)
async def update_promotion(
    promotion_id: int,
    promotion_data: PromotionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Оновити акцію"""
    result = await db.execute(
        select(Promotion).where(Promotion.id == promotion_id)
    )
    promotion = result.scalar_one_or_none()
    
    if not promotion:
        raise NotFoundException("Акція не знайдена")
    
    # Перевірка slug, якщо змінюється
    if promotion_data.slug and promotion_data.slug != promotion.slug:
        result = await db.execute(
            select(Promotion).where(
                Promotion.slug == promotion_data.slug,
                Promotion.id != promotion_id
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise BadRequestException("Акція з таким slug вже існує")
    
    update_data = promotion_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(promotion, field):
            setattr(promotion, field, value)
    
    await db.commit()
    await db.refresh(promotion)
    
    return promotion


@router.delete("/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_promotion(
    promotion_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Видалити акцію"""
    result = await db.execute(
        select(Promotion).where(Promotion.id == promotion_id)
    )
    promotion = result.scalar_one_or_none()
    
    if not promotion:
        raise NotFoundException("Акція не знайдена")
    
    # Правильний спосіб видалення в SQLAlchemy 2.0 async
    await db.execute(delete(Promotion).where(Promotion.id == promotion_id))
    await db.commit()
    
    return None

