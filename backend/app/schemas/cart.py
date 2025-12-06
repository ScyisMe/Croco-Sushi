from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class CartItemBase(BaseModel):
    product_id: int
    size_id: Optional[int] = None
    quantity: int = Field(..., ge=1)


class CartSave(BaseModel):
    items: List[CartItemBase]


class CartItemResponse(BaseModel):
    product_id: int
    product_name: str
    product_slug: str
    product_image: Optional[str] = None
    size_id: Optional[int] = None
    size_name: Optional[str] = None
    price: float
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    id: int
    items: List[CartItemResponse]
    total_amount: float
    total_items: int
    
    model_config = ConfigDict(from_attributes=True)
