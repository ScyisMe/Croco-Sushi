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


