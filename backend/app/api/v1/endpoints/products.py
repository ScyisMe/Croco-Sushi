from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.database import get_db
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductResponse

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    is_new: Optional[bool] = None,
    is_popular: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """Отримати список продуктів з фільтрацією"""
    query = select(Product).where(Product.is_available == True)
    
    if category_id:
        query = query.where(Product.category_id == category_id)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term)
            )
        )
    
    if is_new is not None:
        query = query.where(Product.is_new == is_new)
    
    if is_popular is not None:
        query = query.where(Product.is_popular == is_popular)
    
    query = query.order_by(Product.position, Product.name).offset(skip).limit(limit)
    
    result = await db.execute(query)
    products = result.scalars().all()
    return products


@router.get("/{slug}", response_model=ProductResponse)
async def get_product_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Отримати продукт за slug"""
    result = await db.execute(
        select(Product).where(Product.slug == slug, Product.is_available == True)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


