from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    CLIENT = "client"
    MANAGER = "manager"
    ADMIN = "admin"
    COURIER = "courier"


class UserBase(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    name: Optional[str] = None


class UserCreate(UserBase):
    password: Optional[str] = Field(None, min_length=8, description="Пароль (мін 8 символів)")
    role: UserRole = UserRole.CLIENT


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[UserRole] = None


class UserLogin(BaseModel):
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    role: UserRole
    bonus_balance: int = 0  # Бонусні бали
    loyalty_status: str = "new"  # Статус лояльності
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


class SendSMSRequest(BaseModel):
    """Запит на відправку SMS коду"""
    phone: str = Field(..., min_length=10, max_length=20, description="Номер телефону")


class VerifySMSRequest(BaseModel):
    """Запит на підтвердження SMS коду"""
    phone: str = Field(..., min_length=10, max_length=20, description="Номер телефону")
    code: str = Field(..., min_length=6, max_length=6, description="SMS код підтвердження (6 цифр)")


class ResetPasswordRequest(BaseModel):
    """Запит на відновлення пароля"""
    phone: str = Field(..., min_length=10, max_length=20, description="Номер телефону")


class ChangePasswordRequest(BaseModel):
    """Запит на зміну пароля (для авторизованих або через код відновлення)"""
    new_password: str = Field(..., min_length=8, description="Новий пароль (мін 8 символів)")
    old_password: Optional[str] = Field(None, description="Старий пароль (для авторизованих користувачів)")
    reset_code: Optional[str] = Field(None, min_length=6, max_length=6, description="SMS код відновлення (якщо відновлюєте пароль без авторизації)")


class SMSResponse(BaseModel):
    """Відповідь на SMS запити"""
    message: str


class RefreshTokenRequest(BaseModel):
    """Запит на оновлення токену"""
    refresh_token: str = Field(..., description="Refresh токен для оновлення access токену")





class PreAuthToken(BaseModel):
    """Тимчасовий токен для 2FA"""
    pre_auth_token: str
    message: str = "Потрібна 2FA автентифікація"


class Login2FAResponse(BaseModel):
    """Відповідь при 2FA"""
    pre_auth_token: str
    message: str


class Verify2FARequest(BaseModel):
    """Запит на перевірку 2FA з pre-auth токеном"""
    code: str = Field(..., min_length=6, max_length=6, description="Code 2FA")
    pre_auth_token: str = Field(..., description="Pre-auth token received from login")
