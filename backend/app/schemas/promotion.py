from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from decimal import Decimal


class PromotionBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    discount_type: str = "percent"  # percent, fixed
    discount_value: Optional[Decimal] = None
    start_date: datetime
    end_date: datetime
    min_order_amount: Optional[Decimal] = None
    min_quantity: Optional[int] = None
    max_uses: Optional[int] = None
    category_id: Optional[int] = None
    product_id: Optional[int] = None
    is_active: bool = True
    show_discount_badge: bool = True
    position: int = 0


class PromotionCreate(PromotionBase):
    pass


class PromotionUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    min_order_amount: Optional[Decimal] = None
    min_quantity: Optional[int] = None
    max_uses: Optional[int] = None
    category_id: Optional[int] = None
    product_id: Optional[int] = None
    is_active: Optional[bool] = None
    show_discount_badge: Optional[bool] = None
    position: Optional[int] = None


class PromotionResponse(PromotionBase):
    id: int
    current_uses: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PromotionPublic(PromotionResponse):
    """Публічна версія акції (без технічних полів)"""
    is_available: bool = True  # Обчислюється: активна і не перевищено max_uses
    
    model_config = ConfigDict(from_attributes=True)







