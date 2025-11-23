"""Модель для зон доставки"""
from __future__ import annotations

from datetime import datetime, time
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Text, Integer, DateTime, Numeric, Time, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class DeliveryZone(Base):
    """Зони доставки з тарифами"""
    __tablename__ = "delivery_zones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Координати зони (GeoJSON або полігон)
    coordinates: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Тариф доставки
    delivery_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    # Мінімальна сума для безкоштовної доставки
    free_delivery_threshold: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    # Мінімальна сума замовлення
    min_order_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    # Графік роботи
    working_hours_start: Mapped[Optional[time]] = mapped_column(Time, nullable=True)  # 10:00
    working_hours_end: Mapped[Optional[time]] = mapped_column(Time, nullable=True)  # 22:00
    # Час доставки (в хвилинах)
    delivery_time_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

