from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.exceptions import NotFoundException
from app.models.category import Category
from app.schemas.category import CategoryResponse

router = APIRouter()


from app.core.cache import cache_endpoint

from sqlalchemy import func
from app.models.product import Product

@router.get("/", response_model=List[CategoryResponse])
@cache_endpoint(ttl=300, prefix="categories_list")
async def get_categories(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Отримати список активних категорій"""
    stmt = (
        select(Category, func.count(Product.id).label("products_count"))
        .outerjoin(Product, Product.category_id == Category.id)
        .where(Category.is_active == True)
        .group_by(Category.id)
        .order_by(Category.position, Category.name)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    categories = []
    for cat, count in rows:
        cat.products_count = count
        categories.append(cat)
        
    return categories


@router.get("/{slug}", response_model=CategoryResponse)
@cache_endpoint(ttl=300, prefix="category_detail")
async def get_category_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Отримати категорію за slug"""
    stmt = (
        select(Category, func.count(Product.id).label("products_count"))
        .outerjoin(Product, Product.category_id == Category.id)
        .where(Category.slug == slug, Category.is_active == True)
        .group_by(Category.id)
    )
    result = await db.execute(stmt)
    row = result.first()
    
    if not row:
        raise NotFoundException("Категорію не знайдено")
        
    category, count = row
    category.products_count = count
    
    return category


