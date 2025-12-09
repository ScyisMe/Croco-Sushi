"""Admin endpoints для статистики та аналітики"""
from typing import Optional, List
from datetime import datetime, date, timedelta, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
import csv
import io

from app.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.category import Category

router = APIRouter()


class DashboardStats(BaseModel):
    """Статистика для дашборду"""
    orders_today: int
    orders_week: int
    orders_month: int
    orders_year: int
    revenue_today: Decimal
    revenue_week: Decimal
    revenue_month: Decimal
    revenue_year: Decimal
    average_check: Decimal
    new_customers_today: int
    new_customers_month: int


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати ключові метрики для дашборду.
    
    Оптимізовано: всі дані отримуються за 2 запити замість 11+
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    # ЄДИНИЙ запит для всіх метрик замовлень (замість 9 окремих)
    order_stats_query = select(
        # Кількість замовлень за періодами
        func.count(case((Order.created_at >= today_start, Order.id))).label("orders_today"),
        func.count(case((Order.created_at >= week_start, Order.id))).label("orders_week"),
        func.count(case((Order.created_at >= month_start, Order.id))).label("orders_month"),
        func.count(case((Order.created_at >= year_start, Order.id))).label("orders_year"),
        
        # Виручка (тільки не скасовані замовлення)
        func.sum(case(
            (and_(Order.created_at >= today_start, Order.status != "cancelled"), Order.total_amount),
            else_=Decimal("0")
        )).label("rev_today"),
        func.sum(case(
            (and_(Order.created_at >= week_start, Order.status != "cancelled"), Order.total_amount),
            else_=Decimal("0")
        )).label("rev_week"),
        func.sum(case(
            (and_(Order.created_at >= month_start, Order.status != "cancelled"), Order.total_amount),
            else_=Decimal("0")
        )).label("rev_month"),
        func.sum(case(
            (and_(Order.created_at >= year_start, Order.status != "cancelled"), Order.total_amount),
            else_=Decimal("0")
        )).label("rev_year"),
        
        # Середній чек за місяць
        func.avg(case(
            (and_(Order.created_at >= month_start, Order.status != "cancelled"), Order.total_amount)
        )).label("avg_check")
    )
    
    order_result = await db.execute(order_stats_query)
    order_stats = order_result.one()

    # Окремий запит для користувачів (інша таблиця)
    user_stats_query = select(
        func.count(case((User.created_at >= today_start, User.id))).label("new_today"),
        func.count(case((User.created_at >= month_start, User.id))).label("new_month")
    )
    
    user_result = await db.execute(user_stats_query)
    user_stats = user_result.one()

    return DashboardStats(
        orders_today=order_stats.orders_today or 0,
        orders_week=order_stats.orders_week or 0,
        orders_month=order_stats.orders_month or 0,
        orders_year=order_stats.orders_year or 0,
        revenue_today=order_stats.rev_today or Decimal("0"),
        revenue_week=order_stats.rev_week or Decimal("0"),
        revenue_month=order_stats.rev_month or Decimal("0"),
        revenue_year=order_stats.rev_year or Decimal("0"),
        average_check=order_stats.avg_check or Decimal("0"),
        new_customers_today=user_stats.new_today or 0,
        new_customers_month=user_stats.new_month or 0,
    )


class OrderStatistics(BaseModel):
    """Статистика замовлень за період"""
    total_orders: int
    completed_orders: int
    cancelled_orders: int
    pending_orders: int
    total_revenue: Decimal
    average_check: Decimal
    orders: List[dict]


@router.get("/orders")
async def get_orders_statistics(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Статистика по замовленнях за період"""
    # Встановлюємо дати за замовчуванням (останні 30 днів)
    if not date_to:
        date_to = datetime.now(timezone.utc).date()
    if not date_from:
        date_from = date_to - timedelta(days=30)
    
    # Базові умови
    conditions = [
        func.date(Order.created_at) >= date_from,
        func.date(Order.created_at) <= date_to
    ]
    
    # Агрегована статистика одним запитом
    stats_query = select(
        func.count(Order.id).label("total"),
        func.count(case((Order.status == "completed", Order.id))).label("completed"),
        func.count(case((Order.status == "cancelled", Order.id))).label("cancelled"),
        func.count(case((Order.status == "pending", Order.id))).label("pending"),
        func.sum(case((Order.status != "cancelled", Order.total_amount), else_=Decimal("0"))).label("revenue"),
        func.avg(case((Order.status != "cancelled", Order.total_amount))).label("avg_check")
    ).where(and_(*conditions))
    
    stats_result = await db.execute(stats_query)
    stats = stats_result.one()
    
    # Список замовлень
    orders_query = (
        select(Order)
        .where(and_(*conditions))
        .order_by(Order.created_at.desc())
        .limit(limit)
    )
    
    orders_result = await db.execute(orders_query)
    orders = orders_result.scalars().all()
    
    return {
        "total_orders": stats.total or 0,
        "completed_orders": stats.completed or 0,
        "cancelled_orders": stats.cancelled or 0,
        "pending_orders": stats.pending or 0,
        "total_revenue": stats.revenue or Decimal("0"),
        "average_check": stats.avg_check or Decimal("0"),
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "status": o.status,
                "total_amount": o.total_amount,
                "created_at": o.created_at.isoformat() if o.created_at else None
            }
            for o in orders
        ]
    }


@router.get("/products")
async def get_products_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Top 5 продуктів за кількістю продажів"""
    query = (
        select(
            Product.id,
            Product.name,
            Product.image_url,
            func.sum(OrderItem.quantity).label("sales"),
            func.sum(OrderItem.price * OrderItem.quantity).label("revenue")
        )
        .join(OrderItem.product)
        .join(OrderItem.order)
        .where(Order.status != "cancelled")
        .group_by(Product.id, Product.name, Product.image_url)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        {
            "id": row.id,
            "name": row.name,
            "image_url": row.image_url,
            "sales": row.sales or 0,
            "revenue": float(row.revenue or 0)
        }
        for row in rows
    ]


@router.get("/customers")
async def get_customers_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Статистика по клієнтах"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Агрегована статистика одним запитом
    stats_query = select(
        func.count(User.id).label("total"),
        func.count(case((User.created_at >= today_start, User.id))).label("new_today"),
        func.count(case((User.created_at >= month_start, User.id))).label("new_month"),
        func.count(case((User.is_active == True, User.id))).label("active")
    )
    
    result = await db.execute(stats_query)
    stats = result.one()
    
    # Топ клієнтів за сумою замовлень
    top_customers_query = (
        select(
            User.id,
            User.name,
            User.phone,
            func.count(Order.id).label("orders_count"),
            func.sum(Order.total_amount).label("total_spent")
        )
        .join(Order, Order.user_id == User.id)
        .where(Order.status != "cancelled")
        .group_by(User.id, User.name, User.phone)
        .order_by(func.sum(Order.total_amount).desc())
        .limit(10)
    )
    
    top_result = await db.execute(top_customers_query)
    top_customers = top_result.all()
    
    return {
        "total_customers": stats.total or 0,
        "new_today": stats.new_today or 0,
        "new_month": stats.new_month or 0,
        "active_customers": stats.active or 0,
        "top_customers": [
            {
                "id": c.id,
                "name": c.name or "Без імені",
                "phone": c.phone,
                "orders_count": c.orders_count,
                "total_spent": float(c.total_spent or 0)
            }
            for c in top_customers
        ]
    }


@router.get("/revenue")
async def get_revenue_statistics(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Статистика по виручці (останні 7 днів за замовчуванням)"""
    if not date_to:
        date_to = datetime.now(timezone.utc).date()
    if not date_from:
        date_from = date_to - timedelta(days=6)
        
    # Generate date range list to fill missing days with 0
    date_list = []
    current_date = date_from
    while current_date <= date_to:
        date_list.append(current_date)
        current_date += timedelta(days=1)
        
    query = (
        select(
            func.date(Order.created_at).label("date"),
            func.sum(Order.total_amount).label("sales"),
            func.count(Order.id).label("orders")
        )
        .where(
            and_(
                func.date(Order.created_at) >= date_from,
                func.date(Order.created_at) <= date_to,
                Order.status != "cancelled"
            )
        )
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    # Create a dict for easier lookup
    data_map = {row.date: {"sales": row.sales, "orders": row.orders} for row in rows}
    
    chart_data = []
    for d in date_list:
        day_data = data_map.get(d, {"sales": Decimal("0"), "orders": 0})
        chart_data.append({
            "date": d.strftime("%d.%m"),
            "sales": float(day_data["sales"] or 0),
            "orders": day_data["orders"] or 0
        })
        
    return chart_data


@router.get("/export")
async def export_statistics(
    format: str = Query("csv", pattern="^(csv)$"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Експорт статистики в CSV"""
    if not date_to:
        date_to = datetime.now(timezone.utc).date()
    if not date_from:
        date_from = date_to - timedelta(days=30)
    
    # Отримуємо замовлення
    query = (
        select(Order)
        .where(
            and_(
                func.date(Order.created_at) >= date_from,
                func.date(Order.created_at) <= date_to
            )
        )
        .order_by(Order.created_at.desc())
        .limit(1000)
    )
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    # Генеруємо CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Заголовки
    writer.writerow([
        "ID", "Номер замовлення", "Статус", "Сума", 
        "Клієнт", "Телефон", "Дата створення"
    ])
    
    # Дані
    for order in orders:
        writer.writerow([
            order.id,
            order.order_number,
            order.status,
            float(order.total_amount),
            order.customer_name or "",
            order.customer_phone or "",
            order.created_at.strftime("%Y-%m-%d %H:%M") if order.created_at else ""
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=orders_{date_from}_{date_to}.csv"
        }
    )
