"""API endpoints для аутентифікації"""
from typing import Optional
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from app.database import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_2fa_secret,
    generate_2fa_qr_code,
    verify_2fa_token,
    generate_backup_codes,
    generate_sms_code
)
from app.core.dependencies import get_current_active_user
from app.core.exceptions import (
    UnauthorizedException,
    BadRequestException,
    ConflictException,
    NotFoundException
)
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    TokenData
)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Реєстрація нового користувача"""
    # Перевірка чи існує користувач з таким телефоном
    result = await db.execute(select(User).where(User.phone == user_data.phone))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise ConflictException("Користувач з таким телефоном вже існує")
    
    # Перевірка email, якщо вказано
    if user_data.email:
        result = await db.execute(select(User).where(User.email == user_data.email))
        existing_email = result.scalar_one_or_none()
        if existing_email:
            raise ConflictException("Користувач з таким email вже існує")
    
    # Створення користувача
    hashed_password = None
    if user_data.password:
        hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        phone=user_data.phone,
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        is_active=True,
        is_admin=False
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Вхід користувача"""
    # Пошук користувача
    result = await db.execute(select(User).where(User.phone == credentials.phone))
    user = result.scalar_one_or_none()
    
    if not user:
        raise UnauthorizedException("Невірний телефон або пароль")
    
    if not user.is_active:
        raise ForbiddenException("Користувач неактивний")
    
    # Перевірка пароля
    if not user.hashed_password:
        raise UnauthorizedException("Пароль не встановлено. Відновіть пароль")
    
    if not verify_password(credentials.password, user.hashed_password):
        raise UnauthorizedException("Невірний телефон або пароль")
    
    # Перевірка 2FA
    if user.two_factor_enabled:
        # Потрібно повернути спеціальний статус для 2FA
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="Потрібна 2FA автентифікація"
        )
    
    # Створення токенів
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token_str: str,
    db: AsyncSession = Depends(get_db)
):
    """Оновлення access токену через refresh токен"""
    payload = decode_refresh_token(refresh_token_str)
    
    if payload is None:
        raise UnauthorizedException("Невірний refresh токен")
    
    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("Невірний refresh токен")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise UnauthorizedException("Користувач не знайдено або неактивний")
    
    # Створення нових токенів
    access_token = create_access_token(data={"sub": user.id})
    new_refresh_token = create_refresh_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/2fa/enable")
async def enable_2fa(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Увімкнути 2FA"""
    if current_user.two_factor_enabled:
        raise BadRequestException("2FA вже увімкнено")
    
    # Генерація секрету
    secret = generate_2fa_secret()
    backup_codes = generate_backup_codes()
    
    # Збереження секрету (поки не підтверджено)
    current_user.two_factor_secret = secret
    current_user.two_factor_backup_codes = json.dumps(backup_codes)
    await db.commit()
    
    # Генерація QR-коду
    email = current_user.email or current_user.phone
    qr_code = generate_2fa_qr_code(secret, email)
    
    return {
        "secret": secret,
        "qr_code": qr_code,
        "backup_codes": backup_codes,
        "message": "Скануйте QR-код в Google Authenticator"
    }


@router.post("/2fa/verify")
async def verify_2fa_code(
    code: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Підтвердження 2FA коду та активація"""
    if not current_user.two_factor_secret:
        raise BadRequestException("2FA не налаштовано")
    
    if not verify_2fa_token(current_user.two_factor_secret, code):
        raise UnauthorizedException("Невірний 2FA код")
    
    # Активація 2FA
    current_user.two_factor_enabled = True
    await db.commit()
    
    return {"message": "2FA увімкнено успішно"}


@router.post("/2fa/disable")
async def disable_2fa(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Вимкнути 2FA"""
    if not current_user.two_factor_enabled:
        raise BadRequestException("2FA не увімкнено")
    
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    current_user.two_factor_backup_codes = None
    await db.commit()
    
    return {"message": "2FA вимкнено успішно"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Отримання інформації про поточного користувача"""
    return current_user



