from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    name: Optional[str] = None


class UserCreate(UserBase):
    password: Optional[str] = Field(None, min_length=8, description="Пароль (мін 8 символів)")


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None


class UserLogin(BaseModel):
    phone: str
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPublic(UserBase):
    """Публічна інформація про користувача (без конфіденційних даних)"""
    id: int
    name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


