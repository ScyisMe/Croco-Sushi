from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.exceptions import NotFoundException
from app.models.category import Category
from app.schemas.category import CategoryResponse

import json
import redis
from app.core.config import settings

router = APIRouter()

# Підключення до Redis
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception:
    redis_client = None


@router.get("/", response_model=List[CategoryResponse])
async def get_categories(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Отримати список активних категорій"""
    cache_key = f"categories:list:skip_{skip}:limit_{limit}"
    
    # Спроба отримати з кешу
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)

    result = await db.execute(
        select(Category)
        .where(Category.is_active == True)
        .order_by(Category.position, Category.name)
        .offset(skip)
        .limit(limit)
    )
    categories = result.scalars().all()
    
    # Збереження в кеш (TTL 1 година)
    if redis_client:
        from fastapi.encoders import jsonable_encoder
        categories_json = jsonable_encoder(categories)
        redis_client.setex(cache_key, 3600, json.dumps(categories_json))
        
    return categories


@router.get("/{slug}", response_model=CategoryResponse)
async def get_category_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Отримати категорію за slug"""
    cache_key = f"categories:slug:{slug}"
    
    # Спроба отримати з кешу
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)

    result = await db.execute(
        select(Category).where(Category.slug == slug, Category.is_active == True)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise NotFoundException("Категорію не знайдено")
    
    # Збереження в кеш
    if redis_client:
        from fastapi.encoders import jsonable_encoder
        category_json = jsonable_encoder(category)
        redis_client.setex(cache_key, 3600, json.dumps(category_json))
        
    return category
