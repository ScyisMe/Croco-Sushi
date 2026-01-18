"""Модель для промокодів"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Text, Integer, DateTime, Numeric, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class PromoCode(Base):
    """Промокоди для знижок"""
    __tablename__ = "promo_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Тип знижки
    discount_type: Mapped[str] = mapped_column(String(20), default="percent", nullable=False)  # percent, fixed, free_product
    discount_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    product_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # ID товару для free_product
    # Період дії
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # Обмеження
    min_order_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    max_uses: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Загальна кількість використань
    max_uses_per_user: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # На одного користувача
    current_uses: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

