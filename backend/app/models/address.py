from __future__ import annotations

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Address(Base):
    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    city: Mapped[str] = mapped_column(String(100), default="Бровари", nullable=False)
    street: Mapped[str] = mapped_column(String(255), nullable=False)
    house: Mapped[str] = mapped_column(String(50), nullable=False)
    apartment: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    entrance: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    floor: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    intercom: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User", 
        back_populates="addresses",
        lazy="selectin"
    )

