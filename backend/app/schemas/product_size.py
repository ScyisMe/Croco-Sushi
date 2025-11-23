from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from decimal import Decimal


class ProductSizeBase(BaseModel):
    name: str
    price: Decimal
    weight: Optional[int] = None
    is_default: bool = False


class ProductSizeCreate(ProductSizeBase):
    product_id: int


class ProductSizeUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[Decimal] = None
    weight: Optional[int] = None
    is_default: Optional[bool] = None


class ProductSizeResponse(ProductSizeBase):
    id: int
    product_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)







