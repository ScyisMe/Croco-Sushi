"""Admin endpoints для статистики та аналітики"""
from typing import Optional
from datetime import datetime, date, timedelta, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

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


@router.get("/dashboard")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати ключові метрики для дашборду"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Замовлення
    result = await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= today_start)
    )
    orders_today = result.scalar_one_or_none() or 0
    
    result = await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= week_start)
    )
    orders_week = result.scalar_one_or_none() or 0
    
    result = await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= month_start)
    )
    orders_month = result.scalar_one_or_none() or 0
    
    result = await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= year_start)
    )
    orders_year = result.scalar_one_or_none() or 0
    
    # Виручка
    result = await db.execute(
        select(func.sum(Order.total_amount)).where(
            and_(
                Order.created_at >= today_start,
                Order.status != "cancelled"
            )
        )
    )
    revenue_today = result.scalar_one_or_none() or Decimal("0")
    
    result = await db.execute(
        select(func.sum(Order.total_amount)).where(
            and_(
                Order.created_at >= week_start,
                Order.status != "cancelled"
            )
        )
    )
    revenue_week = result.scalar_one_or_none() or Decimal("0")
    
    result = await db.execute(
        select(func.sum(Order.total_amount)).where(
            and_(
                Order.created_at >= month_start,
                Order.status != "cancelled"
            )
        )
    )
    revenue_month = result.scalar_one_or_none() or Decimal("0")
    
    result = await db.execute(
        select(func.sum(Order.total_amount)).where(
            and_(
                Order.created_at >= year_start,
                Order.status != "cancelled"
            )
        )
    )
    revenue_year = result.scalar_one_or_none() or Decimal("0")
    
    # Середній чек
    result = await db.execute(
        select(func.avg(Order.total_amount)).where(
            and_(
                Order.created_at >= month_start,
                Order.status != "cancelled"
            )
        )
    )
    average_check = result.scalar_one_or_none() or Decimal("0")
    
    # Нові клієнти
    result = await db.execute(
        select(func.count(User.id)).where(User.created_at >= today_start)
    )
    new_customers_today = result.scalar_one_or_none() or 0
    
    result = await db.execute(
        select(func.count(User.id)).where(User.created_at >= month_start)
    )
    new_customers_month = result.scalar_one_or_none() or 0
    
    return DashboardStats(
        orders_today=orders_today,
        orders_week=orders_week,
        orders_month=orders_month,
        orders_year=orders_year,
        revenue_today=revenue_today,
        revenue_week=revenue_week,
        revenue_month=revenue_month,
        revenue_year=revenue_year,
        average_check=average_check,
        new_customers_today=new_customers_today,
        new_customers_month=new_customers_month,
    )


@router.get("/orders")
async def get_orders_statistics(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Статистика по замовленнях"""
    query = select(Order)
    
    if date_from:
        query = query.where(func.date(Order.created_at) >= date_from)
    
    if date_to:
        query = query.where(func.date(Order.created_at) <= date_to)
    
    # TODO: Додати детальну статистику (по статусах, днях, тощо)
    
    return {"message": "Статистика по замовленнях", "date_from": date_from, "date_to": date_to}


@router.get("/products")
async def get_products_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    # Top 5 products by sales quantity
    # Join OrderItem with Order to filter by status if needed
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
    
    products_data = []
    for row in rows:
        products_data.append({
            "id": row.id,
            "name": row.name,
            "image_url": row.image_url,
            "sales": row.sales,
            "revenue": row.revenue
        })
        
    return products_data


@router.get("/customers")
async def get_customers_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Статистика по клієнтах"""
    # TODO: Реалізувати статистику по клієнтах
    return {"message": "Статистика по клієнтах"}


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
            "sales": day_data["sales"],
            "orders": day_data["orders"]
        })
        
    return chart_data


@router.post("/export")
async def export_statistics(
    format: str = Query("excel", pattern="^(csv|excel|pdf)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Експорт статистики"""
    # TODO: Реалізувати експорт статистики
    return {"message": "Експорт статистики", "format": format}

