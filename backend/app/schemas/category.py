from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from pydantic import field_validator
import os


class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    position: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    position: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    products_count: int = 0

    @field_validator('image_url')
    @classmethod
    def convert_image_to_webp(cls, v: Optional[str]) -> Optional[str]:
        if v and (v.lower().endswith('.png') or v.lower().endswith('.jpg') or v.lower().endswith('.jpeg')):
            base = os.path.splitext(v)[0]
            return f"{base}.webp"
        return v


    model_config = ConfigDict(from_attributes=True)


