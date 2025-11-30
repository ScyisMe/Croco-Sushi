from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

from app.schemas.product_size import ProductSizeResponse


class ProductBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    ingredients: Optional[str] = None
    price: Decimal
    old_price: Optional[Decimal] = None
    weight: Optional[int] = None
    calories: Optional[int] = None
    category_id: Optional[int] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None  # Список URL зображень
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    is_available: bool = True
    is_new: bool = False
    is_popular: bool = False
    position: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    ingredients: Optional[str] = None
    price: Optional[Decimal] = None
    old_price: Optional[Decimal] = None
    weight: Optional[int] = None
    calories: Optional[int] = None
    category_id: Optional[int] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    is_available: Optional[bool] = None
    is_new: Optional[bool] = None
    is_popular: Optional[bool] = None
    position: Optional[int] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    sizes: List[ProductSizeResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProductValidationRequest(BaseModel):
    product_ids: List[int]


