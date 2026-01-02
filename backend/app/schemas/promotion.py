from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import field_validator
import os


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
    position: Optional[int] = None


class PromotionResponse(PromotionBase):
    id: int
    current_uses: int
    created_at: datetime
    updated_at: datetime

    @field_validator('image_url')
    @classmethod
    def convert_image_to_webp(cls, v: Optional[str]) -> Optional[str]:
        if v and (v.lower().endswith('.png') or v.lower().endswith('.jpg') or v.lower().endswith('.jpeg')):
            base = os.path.splitext(v)[0]
            return f"{base}.webp"
        return v


    model_config = ConfigDict(from_attributes=True)


class PromotionPublic(PromotionResponse):
    """Публічна версія акції (без технічних полів)"""
    is_available: bool = True  # Обчислюється: активна і не перевищено max_uses
    
    model_config = ConfigDict(from_attributes=True)







