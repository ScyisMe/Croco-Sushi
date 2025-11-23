from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.database import get_db
from app.core.exceptions import NotFoundException
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


@router.get("/popular", response_model=List[ProductResponse])
async def get_popular_products(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Отримати популярні товари"""
    result = await db.execute(
        select(Product)
        .where(Product.is_available == True, Product.is_popular == True)
        .order_by(Product.position, Product.name)
        .limit(limit)
    )
    products = result.scalars().all()
    return products


@router.get("/{product_id}/recommendations", response_model=List[ProductResponse])
async def get_product_recommendations(
    product_id: int,
    limit: int = Query(4, ge=1, le=20),
    db: AsyncSession = Depends(get_db)
):
    """Отримати рекомендації товарів (похожі товари)"""
    # Знаходимо товар
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise NotFoundException("Товар не знайдено")
    
    # Знаходимо товари з тієї ж категорії (або випадкові, якщо категорії немає)
    query = select(Product).where(
        Product.is_available == True,
        Product.id != product_id
    )
    
    if product.category_id:
        query = query.where(Product.category_id == product.category_id)
    
    query = query.order_by(Product.position, Product.name).limit(limit)
    
    result = await db.execute(query)
    recommended_products = result.scalars().all()
    
    return recommended_products


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
        raise NotFoundException("Товар не знайдено")
    return product


