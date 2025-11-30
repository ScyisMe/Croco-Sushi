from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Boolean, Integer, DateTime, Numeric, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from typing import List, Optional as OptionalType

from app.database import Base

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.product_size import ProductSize
    from app.models.review import Review


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_id: Mapped[OptionalType[int]] = mapped_column(
        Integer, 
        ForeignKey("categories.id"), 
        nullable=True, 
        index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[OptionalType[str]] = mapped_column(Text, nullable=True)
    ingredients: Mapped[OptionalType[str]] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    old_price: Mapped[OptionalType[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    weight: Mapped[OptionalType[int]] = mapped_column(Integer, nullable=True)  # в грамах
    calories: Mapped[OptionalType[int]] = mapped_column(Integer, nullable=True)
    image_url: Mapped[OptionalType[str]] = mapped_column(String(500), nullable=True)
    images: Mapped[OptionalType[list]] = mapped_column(JSON, nullable=True)  # Список URL зображень
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_new: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_popular: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # SEO поля
    meta_title: Mapped[OptionalType[str]] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[OptionalType[str]] = mapped_column(Text, nullable=True)
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

    # Relationships
    category: Mapped[OptionalType["Category"]] = relationship(
        "Category", 
        back_populates="products",
        lazy="selectin"
    )
    sizes: Mapped[List["ProductSize"]] = relationship(
        "ProductSize",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

