from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List


class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Рейтинг від 1 до 5")
    comment: Optional[str] = None
    images: Optional[List[str]] = None


class ReviewCreate(ReviewBase):
    order_id: Optional[int] = None
    product_id: Optional[int] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None
    images: Optional[List[str]] = None


class ReviewResponse(ReviewBase):
    id: int
    user_id: Optional[int]
    order_id: Optional[int]
    product_id: Optional[int]
    is_published: bool
    admin_reply: Optional[str] = None
    reply_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewWithUser(ReviewResponse):
    """Відгук з інформацією про користувача"""
    user_name: Optional[str] = None
    user_phone: Optional[str] = None


