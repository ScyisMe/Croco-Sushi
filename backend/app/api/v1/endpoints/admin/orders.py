"""Admin endpoints для управління замовленнями"""
from typing import List, Optional
from datetime import datetime, date, timezone
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
import json

from app.database import get_db
from app.core.dependencies import get_current_admin_user
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.user import User
from app.models.order import Order, OrderItem
from app.schemas.order import OrderResponse, OrderStatusUpdate

router = APIRouter()


class OrderCommentRequest(BaseModel):
    """Запит на додавання коментаря"""
    comment: str


class AssignCourierRequest(BaseModel):
    """Запит на призначення кур'єра"""
    courier_id: int


@router.get("", response_model=List[OrderResponse])
async def get_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status_filter: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    user_id: Optional[int] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати список замовлень з фільтрацією"""
    query = select(Order).options(
        selectinload(Order.items),
        selectinload(Order.address),
        selectinload(Order.user)
    )
    
    conditions = []
    
    if status_filter:
        conditions.append(Order.status == status_filter)
    
    if date_from:
        conditions.append(func.date(Order.created_at) >= date_from)
    
    if date_to:
        conditions.append(func.date(Order.created_at) <= date_to)
    
    if search:
        conditions.append(
            (Order.order_number.ilike(f"%{search}%")) |
            (Order.customer_name.ilike(f"%{search}%")) |
            (Order.customer_phone.ilike(f"%{search}%"))
        )
    
    if user_id is not None:
        conditions.append(Order.user_id == user_id)
    
    if min_amount is not None:
        conditions.append(Order.total_amount >= min_amount)
    
    if max_amount is not None:
        conditions.append(Order.total_amount <= max_amount)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(Order.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Детальний перегляд замовлення"""
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items),
            selectinload(Order.address),
            selectinload(Order.user)
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Замовлення не знайдено")
    
    return order


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Змінити статус замовлення"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Замовлення не знайдено")
    
    old_status = order.status
    order.status = status_data.status
    
    # Оновлення історії статусів
    history = order.status_history or []
    history.append({
        "old_status": old_status,
        "new_status": status_data.status,
        "changed_by": current_user.id,
        "changed_at": datetime.now(timezone.utc).isoformat(),
        "comment": status_data.comment
    })
    order.status_history = history
    
    await db.commit()
    await db.refresh(order)
    
    # Відправка сповіщень клієнту через Celery (асинхронно)
    # Email сповіщення
    if order.customer_email:
        from app.tasks.email import send_order_status_update
        status_names = {
            "pending": "Очікує підтвердження",
            "confirmed": "Підтверджено",
            "preparing": "Готується",
            "delivering": "Доставляється",
            "completed": "Завершено",
            "cancelled": "Скасовано"
        }
        status_name = status_names.get(status_data.status, status_data.status)
        send_order_status_update.delay(order_id, order.customer_email, status_name)
    
    # SMS сповіщення
    if order.customer_phone:
        from app.tasks.sms import send_order_notification
        send_order_notification.delay(
            order.customer_phone,
            order.order_number,
            status_data.status
        )
    
    return order


@router.post("/{order_id}/comment", status_code=status.HTTP_204_NO_CONTENT)
async def add_order_comment(
    order_id: int,
    comment_data: OrderCommentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Додати внутрішній коментар до замовлення"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Замовлення не знайдено")
    
    # Додаємо коментар до існуючого
    existing_comment = order.internal_comment or ""
    new_comment = f"[{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}] {current_user.name or 'Admin'}: {comment_data.comment}\n"
    order.internal_comment = existing_comment + new_comment
    
    await db.commit()
    
    return None


@router.put("/{order_id}/assign-courier", response_model=OrderResponse)
async def assign_courier(
    order_id: int,
    courier_data: AssignCourierRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Призначити кур'єра до замовлення"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Замовлення не знайдено")
    
    # TODO: Перевірити чи кур'єр існує та активний
    
    order.courier_id = courier_data.courier_id
    await db.commit()
    await db.refresh(order)
    
    return order


@router.get("/export", status_code=status.HTTP_200_OK)
async def export_orders(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    format: str = Query("csv", pattern="^(csv|excel)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Експорт замовлень"""
    # TODO: Реалізувати експорт в CSV/Excel
    # Поки що повертаємо пустий список
    
    return {"message": "Експорт буде реалізовано", "format": format}

