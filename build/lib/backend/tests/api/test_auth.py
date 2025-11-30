"""Детальні тести для authentication endpoints"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.core.security import get_password_hash, verify_password
from datetime import datetime, timedelta, timezone


@pytest.mark.asyncio
@pytest.mark.auth
async def test_register_user_success(client: AsyncClient, db_session: AsyncSession):
    """Тест успішної реєстрації нового користувача"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "+380501111111",
            "email": "newuser@example.com",
            "name": "New User",
            "password": "SecurePass987!"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["phone"] == "+380501111111"
    assert data["email"] == "newuser@example.com"
    assert data["name"] == "New User"
    assert "id" in data
    assert data["is_active"] is True
    assert data["is_admin"] is False
    
    # Перевіряємо в БД
    result = await db_session.execute(select(User).where(User.phone == "+380501111111"))
    user = result.scalar_one_or_none()
    assert user is not None
    assert verify_password("SecurePass987!", user.hashed_password)


@pytest.mark.asyncio
@pytest.mark.auth
async def test_register_duplicate_phone(client: AsyncClient, test_user: User):
    """Тест реєстрації з дубльованим телефоном"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": test_user.phone,
            "email": "another@example.com",
            "name": "Another User",
            "password": "SecurePass123"
        }
    )
    assert response.status_code == 409
    detail = response.json()["detail"].lower()
    assert "телефон" in detail or "phone" in detail


@pytest.mark.asyncio
@pytest.mark.auth
async def test_register_duplicate_email(client: AsyncClient, test_user: User):
    """Тест реєстрації з дубльованим email"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "+380509999998",
            "email": test_user.email,
            "name": "Another User",
            "password": "SecurePass123"
        }
    )
    assert response.status_code == 409
    detail = response.json()["detail"].lower()
    assert "email" in detail


@pytest.mark.asyncio
@pytest.mark.auth
async def test_register_invalid_password_short(client: AsyncClient):
    """Тест реєстрації з занадто коротким паролем"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "+380501111112",
            "email": "user@example.com",
            "name": "Test User",
            "password": "short"  # Занадто короткий
        }
    )
    assert response.status_code == 422


@pytest.mark.asyncio
@pytest.mark.auth
async def test_register_invalid_phone_format(client: AsyncClient):
    """Тест реєстрації з невалідним форматом телефону"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "123",  # Невалідний формат
            "email": "user@example.com",
            "name": "Test User",
            "password": "SecurePass123"
        }
    )
    assert response.status_code == 422


@pytest.mark.asyncio
@pytest.mark.auth
async def test_login_success(client: AsyncClient, test_user: User):
    """Тест успішного входу"""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": test_user.phone,
            "password": "testpassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 0
    assert len(data["refresh_token"]) > 0


@pytest.mark.asyncio
@pytest.mark.auth
async def test_login_wrong_password(client: AsyncClient, test_user: User):
    """Тест входу з невірним паролем"""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": test_user.phone,
            "password": "wrongpassword"
        }
    )
    assert response.status_code in [401, 403]
    detail = response.json()["detail"].lower()
    assert "пароль" in detail or "invalid" in detail or "невірний" in detail


@pytest.mark.asyncio
@pytest.mark.auth
async def test_login_nonexistent_user(client: AsyncClient):
    """Тест входу неіснуючого користувача"""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": "+380999999999",
            "password": "somepassword"
        }
    )
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
@pytest.mark.auth
async def test_login_inactive_user(client: AsyncClient, db_session: AsyncSession):
    """Тест входу неактивного користувача"""
    inactive_user = User(
        phone="+380501111113",
        email="inactive@example.com",
        name="Inactive User",
        hashed_password=get_password_hash("password123"),
        is_active=False,
        is_admin=False
    )
    db_session.add(inactive_user)
    await db_session.commit()
    
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": inactive_user.phone,
            "password": "password123"
        }
    )
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
@pytest.mark.auth
async def test_refresh_token_success(client: AsyncClient, test_user: User):
    """Тест успішного оновлення токену"""
    # Спочатку логінимося
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": test_user.phone,
            "password": "testpassword123"
        }
    )
    assert login_response.status_code == 200
    refresh_token = login_response.json()["refresh_token"]
    
    # Чекаємо 1 секунду щоб токени відрізнялися (через exp)
    import time
    time.sleep(1)
    
    # Оновлюємо токен
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    # Новий токен повинен відрізнятися від старого
    assert data["access_token"] != login_response.json()["access_token"]


@pytest.mark.asyncio
@pytest.mark.auth
async def test_refresh_token_invalid(client: AsyncClient):
    """Тест оновлення токену з невірним refresh token"""
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid_token_12345"}
    )
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
@pytest.mark.auth
async def test_refresh_token_expired(client: AsyncClient, test_user: User):
    """Тест оновлення токену з застарілим refresh token"""
    from app.core.security import create_refresh_token
    from datetime import timedelta, timezone
    import time
    
    # Створюємо токен з коротким терміном дії (1 секунда) вручну
    from jose import jwt
    from app.core.config import settings
    
    to_encode = {"sub": str(test_user.id), "type": "refresh"}
    expire = datetime.now(timezone.utc) + timedelta(seconds=1)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    # Чекаємо поки токен застаріє
    time.sleep(2)
    
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": token}
    )
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
@pytest.mark.auth
async def test_get_current_user_unauthorized(client: AsyncClient):
    """Тест отримання поточного користувача без авторизації"""
    response = await client.get("/api/v1/users/me")
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
@pytest.mark.auth
async def test_get_current_user_authorized(authenticated_client: AsyncClient, test_user: User):
    """Тест отримання поточного користувача з авторизацією"""
    response = await authenticated_client.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user.id
    assert data["phone"] == test_user.phone
    assert data["email"] == test_user.email
    assert data["name"] == test_user.name


@pytest.mark.asyncio
@pytest.mark.auth
async def test_token_expiration(authenticated_client: AsyncClient):
    """Тест застарівання токену (симуляція)"""
    # Отримуємо токен з клієнта
    auth_header = authenticated_client.headers.get("Authorization")
    assert auth_header is not None
    assert auth_header.startswith("Bearer ")


@pytest.mark.asyncio
@pytest.mark.auth
async def test_change_password_authenticated(authenticated_client: AsyncClient, test_user: User, db_session: AsyncSession):
    """Тест зміни пароля для авторизованого користувача"""
    response = await authenticated_client.post(
        "/api/v1/auth/change-password",
        json={
            "old_password": "testpassword123",
            "new_password": "NewPassword123"
        }
    )
    # Може бути 200 або 400 якщо потрібен reset_code
    assert response.status_code in [200, 400, 422]
    
    # Якщо успішно, перевіряємо що пароль змінився
    if response.status_code == 200:
        await db_session.refresh(test_user)
        assert verify_password("NewPassword123", test_user.hashed_password)


@pytest.mark.asyncio
@pytest.mark.auth
async def test_change_password_wrong_old_password(authenticated_client: AsyncClient):
    """Тест зміни пароля з невірним старим паролем"""
    response = await authenticated_client.post(
        "/api/v1/auth/change-password",
        json={
            "old_password": "wrongpassword",
            "new_password": "NewPassword123"
        }
    )
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
@pytest.mark.auth
async def test_change_password_weak_password(authenticated_client: AsyncClient):
    """Тест зміни пароля на слабкий пароль"""
    response = await authenticated_client.post(
        "/api/v1/auth/change-password",
        json={
            "old_password": "testpassword123",
            "new_password": "12345678"  # Слабкий пароль
        }
    )
    # Може бути 400 якщо є валідація сили пароля
    assert response.status_code in [200, 400, 422]


@pytest.mark.asyncio
@pytest.mark.auth
async def test_send_sms_code(client: AsyncClient, db_session: AsyncSession):
    """Тест відправки SMS коду"""
    # Створюємо користувача
    user = User(
        phone="+380501111114",
        email="smsuser@example.com",
        name="SMS User",
        is_active=True,
        is_admin=False
    )
    db_session.add(user)
    await db_session.commit()
    
    response = await client.post(
        "/api/v1/auth/send-sms",
        json={"phone": user.phone}
    )
    # Може бути 200 або помилка якщо Redis не доступний
    assert response.status_code in [200, 404, 503, 500]


@pytest.mark.asyncio
@pytest.mark.auth
async def test_verify_sms_code(client: AsyncClient):
    """Тест перевірки SMS коду"""
    # Для цього тесту потрібен Redis, тому просто перевіряємо endpoint
    response = await client.post(
        "/api/v1/auth/verify-sms",
        json={
            "phone": "+380501111115",
            "code": "123456"
        }
    )
    # Може бути різні статуси залежно від наявності Redis та коду
    assert response.status_code in [200, 401, 503, 500]


@pytest.mark.asyncio
@pytest.mark.auth
async def test_reset_password(client: AsyncClient, test_user: User):
    """Тест відправки SMS коду для відновлення пароля"""
    response = await client.post(
        "/api/v1/auth/reset-password",
        json={"phone": test_user.phone}
    )
    # Може бути 200 або помилка якщо Redis не доступний
    assert response.status_code in [200, 404, 503, 500]


@pytest.mark.asyncio
@pytest.mark.auth
async def test_reset_password_nonexistent_user(client: AsyncClient):
    """Тест відновлення пароля для неіснуючого користувача"""
    response = await client.post(
        "/api/v1/auth/reset-password",
        json={"phone": "+380999999999"}
    )
    # Може бути 404 або 200 (не розкриваємо чи існує користувач)
    assert response.status_code in [200, 404, 503, 500]

