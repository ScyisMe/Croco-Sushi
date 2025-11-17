from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class OrderItemBase(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    quantity: int = Field(..., gt=0)
    price: Decimal


class OrderItemCreate(OrderItemBase):
    size_id: Optional[int] = None  # ID розміру порції


class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int
    
    model_config = ConfigDict(from_attributes=True)


class OrderBase(BaseModel):
    customer_name: str = Field(..., min_length=2)
    customer_phone: str = Field(..., min_length=10, max_length=20)
    customer_email: Optional[str] = None
    address_id: Optional[int] = None
    payment_method: Optional[str] = None  # cash, card, online
    comment: Optional[str] = Field(None, max_length=500)
    items: List[OrderItemCreate]


class OrderCreate(OrderBase):
    """Створення замовлення"""
    # Додатково для неавторизованих користувачів
    city: Optional[str] = None
    street: Optional[str] = None
    house: Optional[str] = None
    apartment: Optional[str] = None
    address_comment: Optional[str] = None


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_method: Optional[str] = None
    comment: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    order_number: str
    user_id: Optional[int]
    address_id: Optional[int]
    status: str
    total_amount: Decimal
    delivery_cost: Decimal
    discount: Decimal
    payment_method: Optional[str]
    delivery_time: Optional[datetime]
    customer_name: Optional[str]
    customer_phone: str
    comment: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|confirmed|preparing|delivering|completed|cancelled)$")
    comment: Optional[str] = None


class OrderTrack(BaseModel):
    """Публічна інформація для відстеження замовлення"""
    order_number: str
    status: str
    created_at: datetime
    total_amount: Decimal
    
    model_config = ConfigDict(from_attributes=True)


