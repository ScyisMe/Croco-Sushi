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
from app.core.dependencies import get_current_admin_user, get_current_manager_user
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.order_history import OrderHistory
from app.schemas.order import OrderResponse, OrderStatusUpdate, OrderHistoryLogResponse

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
    status_filter: Optional[List[str]] = Query(None, alias="status"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    user_id: Optional[int] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user)
):
    """Отримати список замовлень з фільтрацією"""
    query = select(Order).options(
        selectinload(Order.items).selectinload(OrderItem.product),
        selectinload(Order.address),
        selectinload(Order.user),
        selectinload(Order.history)
    )
    
    conditions = []
    
    if status_filter:
        # Check if it's a list with one item that is a comma-separated string (common frontend behavior)
        if len(status_filter) == 1 and "," in status_filter[0]:
             status_filter = status_filter[0].split(",")
             
        conditions.append(Order.status.in_(status_filter))
    
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


@router.get("/history-log", response_model=List[OrderHistoryLogResponse])
async def get_history_log(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user)
):
    """
    Отримати повний журнал змін статусів (Audit Log).
    """
    query = select(OrderHistory).options(
        selectinload(OrderHistory.order)
    ).join(OrderHistory.order)

    if search:
        query = query.where(
            (Order.order_number.ilike(f"%{search}%")) |
            (Order.customer_name.ilike(f"%{search}%")) |
            (OrderHistory.manager_name.ilike(f"%{search}%"))
        )

    query = query.order_by(OrderHistory.changed_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    history_items = result.scalars().all()

    # Map to schema manually or let Pydantic handle it if structure matches
    # We need to flattened structure so we construct it
    response = []
    for item in history_items:
        response.append({
            "id": item.id,
            "order_id": item.order_id,
            "manager_name": item.manager_name,
            "previous_status": item.previous_status,
            "new_status": item.new_status,
            "comment": item.comment,
            "changed_at": item.changed_at,
            "order_number": item.order.order_number,
            "customer_name": item.order.customer_name,
            "total_amount": item.order.total_amount
        })

    return response


@router.get("/export", status_code=status.HTTP_200_OK)
async def export_orders(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    format: str = Query("csv", pattern="^(csv|excel)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user)
):
    """Експорт замовлень"""
    # TODO: Реалізувати експорт в CSV/Excel
    # Поки що повертаємо пустий список
    
    return {"message": "Експорт буде реалізовано", "format": format}


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user)
):
    """Детальний перегляд замовлення"""
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.address),
            selectinload(Order.user),
            selectinload(Order.history)  # Already here, but ensuring it's used
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Замовлення не знайдено")
    
    return order


@router.put("/{order_id}/status", response_model=OrderResponse)
@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user)
):
    """Змінити статус замовлення"""
    """Змінити статус замовлення"""
    try:
        # Use joinload for history if we return it? 
        # Actually we return OrderResponse which includes history, so better load it.
        result = await db.execute(
            select(Order)
            .where(Order.id == order_id)
            .options(
                selectinload(Order.history),
                selectinload(Order.items).selectinload(OrderItem.product),
                selectinload(Order.address),
                selectinload(Order.user)
            )
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise NotFoundException("Замовлення не знайдено")
        
        old_status = order.status
        
        # Validation: Reason required for cancellation
        comment_text = status_data.reason or status_data.comment
        
        if status_data.status == "cancelled" and not comment_text:
            raise BadRequestException("Причина скасування є обов'язковою! Вкажіть 'reason'.")

        order.status = status_data.status
        
        # 3. ЗАПИСУЄМО В ІСТОРІЮ (Audit Log)
        # Ensure manager_name is not None
        manager_name = current_user.name or current_user.email or f"Manager #{current_user.id}"
        
        log_entry = OrderHistory(
            order_id=order.id,
            manager_id=current_user.id,
            manager_name=manager_name,
            previous_status=old_status,
            new_status=status_data.status,
            comment=comment_text # Save reason as comment
        )
        db.add(log_entry)
        
        # Legacy updates
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
        # Reload with full options to ensure relationships (like items.product) are loaded for Pydantic
        result = await db.execute(
            select(Order)
            .where(Order.id == order_id)
            .options(
                selectinload(Order.history),
                selectinload(Order.items).selectinload(OrderItem.product),
                selectinload(Order.address),
                selectinload(Order.user)
            )
        )
        order = result.scalar_one_or_none()
        
        # Відправка сповіщень клієнту через Celery (асинхронно)
        # TEMPORARILY DISABLED FOR DEBUGGING
        # try:
        #     # Email сповіщення
        #     if order.customer_email:
        #         from app.tasks.email import schedule_order_status_update
        #         status_names = {
        #             "pending": "Очікує підтвердження",
        #             "confirmed": "Підтверджено",
        #             "preparing": "Готується",
        #             "delivering": "Доставляється",
        #             "completed": "Завершено",
        #             "cancelled": "Скасовано"
        #         }
        #         status_name = status_names.get(status_data.status, status_data.status)
        #         schedule_order_status_update(order_id, order.customer_email, status_name)
        #     
        #     # SMS сповіщення
        #     if order.customer_phone:
        #         from app.tasks.sms import send_order_notification
        #         send_order_notification.delay(
        #             order.customer_phone,
        #             order.order_number,
        #             status_data.status
        #         )
        # except Exception as e:
        #     # Log error but don't fail the request
        #     import logging
        #     logger = logging.getLogger(__name__)
        #     logger.error(f"Failed to send notifications for order {order_id}: {e}")
        
        return order
    except Exception as e:
        import traceback
        print(f"ERROR UPDATING ORDER STATUS: {e}")
        traceback.print_exc()
        # Return the error detail to the client for debugging
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Update Error: {str(e)}")





@router.post("/{order_id}/comment", status_code=status.HTTP_204_NO_CONTENT)
async def add_order_comment(
    order_id: int,
    comment_data: OrderCommentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user)
):
    """Додати внутрішній коментар до замовлення"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Замовлення не знайдено")
    
    # Додаємо коментар до існуючого
    existing_comment = order.internal_comment or ""
    new_comment = f"[{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}] {current_user.name or 'Manager'}: {comment_data.comment}\n"
    order.internal_comment = existing_comment + new_comment
    
    await db.commit()
    
    return None


@router.put("/{order_id}/assign-courier", response_model=OrderResponse)
async def assign_courier(
    order_id: int,
    courier_data: AssignCourierRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager_user)
):
    """Призначити кур'єра до замовлення"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Замовлення не знайдено")
    
    # TODO: Перевірити чи кур'єр існує та активний
    
    order.courier_id = courier_data.courier_id
    await db.commit()
    
    # Reload with full options for response
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.history),
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.address),
            selectinload(Order.user)
        )
    )
    order = result.scalar_one_or_none()
    
    return order




