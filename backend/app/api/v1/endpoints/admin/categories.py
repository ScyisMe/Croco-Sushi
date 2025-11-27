"""Admin endpoints для управління категоріями"""
from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from pydantic import BaseModel

from app.database import get_db
from app.core.dependencies import get_current_admin_user
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter()


class BulkDeleteRequest(BaseModel):
    """Запит на масове видалення"""
    ids: List[int]


class ReorderRequest(BaseModel):
    """Запит на зміну порядку"""
    items: List[dict]  # [{"id": 1, "position": 0}, ...]


@router.get("", response_model=List[CategoryResponse])
async def get_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: bool = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати список категорій (адмін)"""
    query = select(Category)
    
    if is_active is not None:
        query = query.where(Category.is_active == is_active)
    
    query = query.order_by(Category.position, Category.name).offset(skip).limit(limit)
    
    result = await db.execute(query)
    categories = result.scalars().all()
    return categories


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Створити категорію"""
    # Перевірка чи slug вже існує
    result = await db.execute(select(Category).where(Category.slug == category_data.slug))
    existing = result.scalar_one_or_none()
    
    if existing:
        raise BadRequestException("Категорія з таким slug вже існує")
    
    # Отримання максимальної позиції якщо не вказано
    category_dict = category_data.model_dump(exclude_unset=True)
    if "position" not in category_dict or category_dict.get("position") == 0:
        result = await db.execute(select(func.max(Category.position)))
        max_position = result.scalar_one_or_none()
        category_dict["position"] = (max_position + 1) if max_position is not None else 0
    
    new_category = Category(**category_dict)
    
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)
    
    return new_category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Оновити категорію"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise NotFoundException("Категорія не знайдена")
    
    # Перевірка slug, якщо змінюється
    if category_data.slug and category_data.slug != category.slug:
        result = await db.execute(
            select(Category).where(
                Category.slug == category_data.slug,
                Category.id != category_id
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise BadRequestException("Категорія з таким slug вже існує")
    
    # Оновлення полів
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    await db.commit()
    await db.refresh(category)
    
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Видалити категорію"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise NotFoundException("Категорія не знайдена")
    
    # Перевірка чи є товари в категорії
    # TODO: Додати перевірку через relationship
    
    # Правильний спосіб видалення в SQLAlchemy 2.0 async
    await db.execute(delete(Category).where(Category.id == category_id))
    await db.commit()
    
    return None


@router.put("/bulk-delete", status_code=status.HTTP_204_NO_CONTENT)
async def bulk_delete_categories(
    request: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Масове видалення категорій"""
    # Валідація: обмежуємо кількість категорій для безпеки
    if not request.ids:
        raise BadRequestException("Список ID не може бути порожнім")
    
    if len(request.ids) > 100:
        raise BadRequestException("Максимальна кількість категорій для масового видалення: 100")
    
    # Валідація: перевірка що всі ID - це числа
    if not all(isinstance(id, int) and id > 0 for id in request.ids):
        raise BadRequestException("Всі ID повинні бути додатніми числами")
    
    result = await db.execute(
        select(Category).where(Category.id.in_(request.ids))
    )
    categories = result.scalars().all()
    
    # Правильний спосіб видалення в SQLAlchemy 2.0 async
    if categories:
        category_ids = [c.id for c in categories]
        await db.execute(delete(Category).where(Category.id.in_(category_ids)))
    
    await db.commit()
    
    return None


@router.put("/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_categories(
    request: ReorderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Зміна порядку категорій"""
    for item in request.items:
        category_id = item.get("id")
        position = item.get("position")
        
        if category_id and position is not None:
            result = await db.execute(
                select(Category).where(Category.id == category_id)
            )
            category = result.scalar_one_or_none()
            
            if category:
                category.position = position
    
    await db.commit()
    
    return None

