from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, DateTime, Numeric, ForeignKey, CheckConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.address import Address
    from app.models.review import Review
    from app.models.product import Product


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("users.id"), 
        nullable=True, 
        index=True
    )
    address_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("addresses.id"), 
        nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(50), 
        default="pending", 
        nullable=False, 
        index=True
    )
    # Статуси: pending, confirmed, preparing, delivering, completed, cancelled
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    delivery_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    discount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    # Зв'язок з промокодом
    promo_code_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("promo_codes.id"), nullable=True)
    promo_code_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # Зберігаємо код для історії
    payment_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # cash, card, online
    delivery_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    customer_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    customer_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Внутрішній коментар (для адмінів)
    internal_comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Кур'єр
    courier_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    # Історія статусів (JSON зі списком змін)
    status_history: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(),
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        "User", 
        back_populates="orders",
        lazy="selectin"
    )
    address: Mapped[Optional["Address"]] = relationship(
        "Address",
        lazy="selectin"
    )
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem", 
        back_populates="order", 
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review",
        back_populates="order",
        lazy="selectin"
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled')",
            name="check_order_status"
        ),
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("orders.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    product_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("products.id"), 
        nullable=True
    )
    size_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("product_sizes.id"),
        nullable=True
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)  # Копія на момент замовлення
    size_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Копія назви розміру
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)  # Ціна на момент замовлення

    # Relationships
    order: Mapped["Order"] = relationship(
        "Order", 
        back_populates="items",
        lazy="selectin"
    )
    product: Mapped[Optional["Product"]] = relationship(
        "Product",
        lazy="selectin"
    )

    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_quantity_positive"),
    )

