from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

from app.schemas.product_size import ProductSizeResponse
from pydantic import field_validator
import os



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
    is_spicy: bool = False
    is_vegan: bool = False
    is_top_seller: bool = False
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
    is_spicy: Optional[bool] = None
    is_vegan: Optional[bool] = None
    is_top_seller: Optional[bool] = None
    position: Optional[int] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    sizes: List[ProductSizeResponse] = []

    @field_validator('image_url')
    @classmethod
    def convert_image_to_webp(cls, v: Optional[str]) -> Optional[str]:
        if v and (v.lower().endswith('.png') or v.lower().endswith('.jpg') or v.lower().endswith('.jpeg')):
            # Replace extension with .webp
            # Handle mixed case if needed, but assuming standard.
            base = os.path.splitext(v)[0]
            return f"{base}.webp"
        return v

    @field_validator('images')
    @classmethod
    def convert_images_list_to_webp(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v:
            new_list = []
            for img in v:
                if img and (img.lower().endswith('.png') or img.lower().endswith('.jpg') or img.lower().endswith('.jpeg')):
                    base = os.path.splitext(img)[0]
                    new_list.append(f"{base}.webp")
                else:
                    new_list.append(img)
            return new_list
        return v


    model_config = ConfigDict(from_attributes=True)


class ProductValidationRequest(BaseModel):
    product_ids: List[int]


