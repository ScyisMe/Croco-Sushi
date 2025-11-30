from __future__ import annotations

from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.address import Address
    from app.models.order import Order
    from app.models.review import Review
    from app.models.favorite import Favorite


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # 2FA поля
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    two_factor_secret: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    two_factor_backup_codes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON список
    # Додаткові поля
    newsletter_subscription: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    referral_code: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True, index=True)
    # Програма лояльності
    bonus_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Бонусні бали
    loyalty_status: Mapped[str] = mapped_column(String(20), default="new", nullable=False)  # new, silver, gold
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
    addresses: Mapped[List["Address"]] = relationship(
        "Address", 
        back_populates="user", 
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    orders: Mapped[List["Order"]] = relationship(
        "Order", 
        back_populates="user",
        lazy="selectin"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    favorites: Mapped[List["Favorite"]] = relationship(
        "Favorite",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

