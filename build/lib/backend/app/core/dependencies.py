"""Dependency injection для FastAPI"""
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.security import decode_access_token, get_token_data
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models.user import User
from sqlalchemy import select

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Отримання поточного користувача з токену"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise UnauthorizedException("Невірний токен")
    
    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("Невірний токен")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise UnauthorizedException("Користувач не знайдено")
    
    if not user.is_active:
        raise ForbiddenException("Користувач неактивний")
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Отримання активного користувача"""
    if not current_user.is_active:
        raise ForbiddenException("Користувач неактивний")
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Отримання адміна"""
    if not current_user.is_admin:
        raise ForbiddenException("Недостатньо прав доступу")
    return current_user


class OptionalHTTPBearer(HTTPBearer):
    """HTTPBearer з опціональним токеном"""
    async def __call__(self, request: Request):
        try:
            return await super().__call__(request)
        except HTTPException:
            return None

optional_security = OptionalHTTPBearer(auto_error=False)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Отримання користувача, якщо токен є (опціонально)"""
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        
        if payload is None:
            return None
        
        user_id: Optional[int] = payload.get("sub")
        if user_id is None:
            return None
        
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if user is None or not user.is_active:
            return None
        
        return user
    except Exception:
        return None

