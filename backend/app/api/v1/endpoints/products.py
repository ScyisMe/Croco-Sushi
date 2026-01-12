from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.core.cache import cache_endpoint
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import noload
from pydantic import BaseModel, Field

from app.database import get_db
from app.core.exceptions import NotFoundException
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductResponse
from sqlalchemy.orm import selectinload

router = APIRouter()


class ProductValidationRequest(BaseModel):
    product_ids: List[int] = Field(..., description="List of product IDs to validate")


@router.get("/", response_model=List[ProductResponse])
@cache_endpoint(ttl=300, prefix="products_list")
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None,
    category_slug: Optional[str] = None,
    search: Optional[str] = None,
    is_new: Optional[bool] = None,
    is_popular: Optional[bool] = None,
    is_spicy: Optional[bool] = None,
    is_vegan: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """Отримати список продуктів з фільтрацією"""
    query = select(Product).where(Product.is_available == True)
    
    if category_id:
        query = query.where(Product.category_id == category_id)

    if category_slug:
        query = query.join(Category).where(Category.slug == category_slug)
    
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

    if is_spicy is not None:
        query = query.where(Product.is_spicy == is_spicy)

    if is_vegan is not None:
        query = query.where(Product.is_vegan == is_vegan)
    
    query = query.options(
        noload(Product.reviews), 
        noload(Product.category),
        selectinload(Product.sizes)
    )
    query = query.order_by(Product.position, Product.name).offset(skip).limit(limit)
    
    result = await db.execute(query)
    products = result.scalars().all()
    return products


@router.get("/popular", response_model=List[ProductResponse])
@cache_endpoint(ttl=300, prefix="products_popular")
async def get_popular_products(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Отримати популярні товари"""
    result = await db.execute(
        select(Product)
        .where(Product.is_available == True, Product.is_popular == True)
        .options(
            noload(Product.reviews), 
            noload(Product.category),
            selectinload(Product.sizes)
        )
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
    ).options(selectinload(Product.sizes))
    
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
        select(Product)
        .where(Product.slug == slug, Product.is_available == True)
        .options(
            selectinload(Product.sizes)
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Товар не знайдено")
    return product


@router.post("/validate", response_model=List[ProductResponse])
async def validate_products(
    request: ProductValidationRequest,
    db: AsyncSession = Depends(get_db)
):
    """Validate a list of products and return their current details"""
    if not request.product_ids:
        return []
        
    result = await db.execute(
        select(Product).where(
            Product.id.in_(request.product_ids),
            Product.is_available == True
        ).options(selectinload(Product.sizes))
    )
    products = result.scalars().all()
    return products
