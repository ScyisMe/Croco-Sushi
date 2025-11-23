"""Admin endpoints для управління користувачами"""
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.database import get_db
from app.core.dependencies import get_current_admin_user
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.user import User
from app.schemas.user import UserUpdate, UserResponse

router = APIRouter()


class AddBonusRequest(BaseModel):
    """Запит на нарахування бонусів"""
    amount: int
    reason: Optional[str] = None


@router.get("", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_admin: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати список користувачів"""
    query = select(User)
    
    if search:
        query = query.where(
            (User.phone.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (User.name.ilike(f"%{search}%"))
        )
    
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
    if is_admin is not None:
        query = query.where(User.is_admin == is_admin)
    
    query = query.order_by(User.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Деталі користувача"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise NotFoundException("Користувач не знайдено")
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Оновити користувача"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise NotFoundException("Користувач не знайдено")
    
    # Перевірка email
    if user_data.email and user_data.email != user.email:
        result = await db.execute(
            select(User).where(
                User.email == user_data.email,
                User.id != user_id
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise BadRequestException("Email вже використовується")
    
    # Оновлення полів
    # БЕЗПЕКА: Використовуємо тільки дозволені поля зі схеми, щоб запобігти зміні критичних полів
    update_data = user_data.model_dump(exclude_unset=True)
    # Whitelist дозволених полів для оновлення (захист від зміни is_admin, hashed_password тощо)
    allowed_fields = {"email", "name", "phone", "newsletter_subscription"}
    for field, value in update_data.items():
        if field in allowed_fields and hasattr(user, field):
            setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.put("/{user_id}/block", response_model=UserResponse)
async def block_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Заблокувати користувача"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise NotFoundException("Користувач не знайдено")
    
    if user.id == current_user.id:
        raise BadRequestException("Не можна заблокувати самого себе")
    
    user.is_active = False
    await db.commit()
    await db.refresh(user)
    
    return user


@router.put("/{user_id}/unblock", response_model=UserResponse)
async def unblock_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Розблокувати користувача"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise NotFoundException("Користувач не знайдено")
    
    user.is_active = True
    await db.commit()
    await db.refresh(user)
    
    return user


@router.post("/{user_id}/add-bonus", response_model=UserResponse)
async def add_bonus(
    user_id: int,
    bonus_data: AddBonusRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Нарахувати бонуси користувачу"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise NotFoundException("Користувач не знайдено")
    
    # Валідація: перевірка що сума не від'ємна та не перевищує розумні межі
    if bonus_data.amount < 0:
        raise BadRequestException("Сума бонусів не може бути від'ємною")
    
    # Перевірка на переповнення (максимум 2,147,483,647 для Integer)
    max_bonus = 2_000_000_000  # Безпечний максимум
    if user.bonus_balance + bonus_data.amount > max_bonus:
        raise BadRequestException(f"Сума бонусів не може перевищувати {max_bonus}")
    
    user.bonus_balance += bonus_data.amount
    
    # TODO: Додати запис в історію лояльності
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.get("/export")
async def export_users(
    format: str = Query("csv", pattern="^(csv|excel)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Експорт бази користувачів"""
    # TODO: Реалізувати експорт в CSV/Excel
    
    return {"message": "Експорт буде реалізовано", "format": format}

