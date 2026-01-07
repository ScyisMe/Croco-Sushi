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

@router.get("/", response_model=List[CategoryResponse])
@cache_endpoint(ttl=300, prefix="categories_list")
async def get_categories(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Отримати список активних категорій"""
    result = await db.execute(
        select(Category)
        .where(Category.is_active == True)
        .order_by(Category.position, Category.name)
        .offset(skip)
        .limit(limit)
    )
    categories = result.scalars().all()
    return categories


@router.get("/{slug}", response_model=CategoryResponse)
@cache_endpoint(ttl=300, prefix="category_detail")
async def get_category_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Отримати категорію за slug"""
    result = await db.execute(
        select(Category).where(Category.slug == slug, Category.is_active == True)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise NotFoundException("Категорію не знайдено")
    return category


