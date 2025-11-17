"""API endpoints для акцій"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database import get_db
from app.core.exceptions import NotFoundException
from app.models.promotion import Promotion
from app.schemas.promotion import PromotionResponse, PromotionPublic

router = APIRouter()


@router.get("/", response_model=List[PromotionPublic])
async def get_promotions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None,
    product_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Отримання активних акцій"""
    now = datetime.utcnow()
    
    query = select(Promotion).where(
        and_(
            Promotion.is_active == True,
            Promotion.start_date <= now,
            Promotion.end_date >= now
        )
    )
    
    if category_id:
        query = query.where(Promotion.category_id == category_id)
    
    if product_id:
        query = query.where(Promotion.product_id == product_id)
    
    query = query.order_by(Promotion.position, Promotion.start_date.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    promotions = result.scalars().all()
    
    # Додаємо поле is_available
    promotions_public = []
    for promo in promotions:
        promo_dict = promo.__dict__.copy()
        # Перевірка чи не перевищено max_uses
        is_available = True
        if promo.max_uses and promo.current_uses >= promo.max_uses:
            is_available = False
        promo_dict["is_available"] = is_available
        promotions_public.append(PromotionPublic(**promo_dict))
    
    return promotions_public


@router.get("/{slug}", response_model=PromotionPublic)
async def get_promotion_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Отримання акції за slug"""
    now = datetime.utcnow()
    
    result = await db.execute(
        select(Promotion).where(
            and_(
                Promotion.slug == slug,
                Promotion.is_active == True,
                Promotion.start_date <= now,
                Promotion.end_date >= now
            )
        )
    )
    promotion = result.scalar_one_or_none()
    
    if not promotion:
        raise NotFoundException("Акцію не знайдено")
    
    promo_dict = promotion.__dict__.copy()
    is_available = True
    if promotion.max_uses and promotion.current_uses >= promotion.max_uses:
        is_available = False
    promo_dict["is_available"] = is_available
    
    return PromotionPublic(**promo_dict)


