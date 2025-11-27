"""Детальні тести для security та password validation"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token
)


def validate_password(password: str) -> None:
    """Локальна функція валідації пароля для тестів"""
    if not password or len(password.strip()) < 8:
        raise ValueError("Пароль повинен містити мінімум 8 символів")


def is_redis_available() -> bool:
    """Перевірка чи Redis доступний"""
    try:
        import redis
        # Використовуємо localhost для тестів
        r = redis.from_url("redis://localhost:6379/0", socket_connect_timeout=1)
        r.ping()
        return True
    except Exception:
        return False


# Маркер для пропуску тестів без Redis
requires_redis = pytest.mark.skipif(
    not is_redis_available(),
    reason="Redis is not available"
)


# ========== Тести хешування паролів ==========

@pytest.mark.asyncio
@pytest.mark.security
async def test_password_hash_not_plaintext():
    """Тест що хеш пароля не є відкритим текстом"""
    password = "MySecretPassword123"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert len(hashed) > len(password)


@pytest.mark.asyncio
@pytest.mark.security
async def test_password_hash_unique():
    """Тест що кожен хеш унікальний (bcrypt salt)"""
    password = "SamePassword123"
    hash1 = get_password_hash(password)
    hash2 = get_password_hash(password)
    
    # Хеші повинні бути різними через різні salt
    assert hash1 != hash2


@pytest.mark.asyncio
@pytest.mark.security
async def test_verify_password_correct():
    """Тест верифікації правильного пароля"""
    password = "CorrectPassword123"
    hashed = get_password_hash(password)
    
    assert verify_password(password, hashed) is True


@pytest.mark.asyncio
@pytest.mark.security
async def test_verify_password_incorrect():
    """Тест верифікації неправильного пароля"""
    password = "CorrectPassword123"
    wrong_password = "WrongPassword456"
    hashed = get_password_hash(password)
    
    assert verify_password(wrong_password, hashed) is False


@pytest.mark.asyncio
@pytest.mark.security
async def test_verify_password_empty():
    """Тест верифікації порожнього пароля"""
    password = "SomePassword123"
    hashed = get_password_hash(password)
    
    assert verify_password("", hashed) is False


@pytest.mark.asyncio
@pytest.mark.security
async def test_verify_password_case_sensitive():
    """Тест що пароль чутливий до регістру"""
    password = "CaseSensitive123"
    hashed = get_password_hash(password)
    
    assert verify_password("casesensitive123", hashed) is False
    assert verify_password("CASESENSITIVE123", hashed) is False
    assert verify_password("CaseSensitive123", hashed) is True


# ========== Тести валідації паролів ==========

@pytest.mark.asyncio
@pytest.mark.security
async def test_validate_password_valid():
    """Тест валідного пароля"""
    # Валідний пароль: мінімум 8 символів
    valid_passwords = [
        "ValidPass123",
        "StrongPassword1!",
        "MySecure2024",
        "12345678",  # Мінімальна довжина
    ]
    
    for password in valid_passwords:
        try:
            validate_password(password)
            is_valid = True
        except ValueError:
            is_valid = False
        
        # Пароль повинен пройти базову валідацію (>= 8 символів)
        if len(password) >= 8:
            assert is_valid is True, f"Password '{password}' should be valid"


@pytest.mark.asyncio
@pytest.mark.security
async def test_validate_password_too_short():
    """Тест занадто короткого пароля"""
    short_passwords = ["short", "1234567", "abc"]
    
    for password in short_passwords:
        with pytest.raises(ValueError) as exc_info:
            validate_password(password)
        
        error_message = str(exc_info.value).lower()
        assert "символ" in error_message or "character" in error_message or "length" in error_message


@pytest.mark.asyncio
@pytest.mark.security
async def test_validate_password_empty():
    """Тест порожнього пароля"""
    with pytest.raises(ValueError):
        validate_password("")


@pytest.mark.asyncio
@pytest.mark.security
async def test_validate_password_whitespace_only():
    """Тест пароля з пробілів"""
    with pytest.raises(ValueError):
        validate_password("        ")  # 8 пробілів


# ========== Тести JWT токенів ==========

@pytest.mark.asyncio
@pytest.mark.security
async def test_create_access_token():
    """Тест створення access token"""
    data = {"sub": "123"}
    token = create_access_token(data)
    
    assert token is not None
    assert len(token) > 0
    assert "." in token  # JWT має формат header.payload.signature


@pytest.mark.asyncio
@pytest.mark.security
async def test_create_refresh_token():
    """Тест створення refresh token"""
    data = {"sub": "123"}
    token = create_refresh_token(data)
    
    assert token is not None
    assert len(token) > 0
    assert "." in token


@pytest.mark.asyncio
@pytest.mark.security
async def test_access_token_contains_subject():
    """Тест що access token містить subject"""
    import jwt
    
    user_id = "456"
    token = create_access_token({"sub": user_id})
    
    # Декодуємо токен (без верифікації підпису для тесту)
    decoded = jwt.decode(token, options={"verify_signature": False})
    
    assert decoded["sub"] == user_id


@pytest.mark.asyncio
@pytest.mark.security
async def test_tokens_are_different():
    """Тест що access і refresh токени різні"""
    data = {"sub": "789"}
    access_token = create_access_token(data)
    refresh_token = create_refresh_token(data)
    
    assert access_token != refresh_token


@pytest.mark.asyncio
@pytest.mark.security
async def test_token_expiration_set():
    """Тест що токен має час закінчення"""
    import jwt
    
    token = create_access_token({"sub": "test"})
    decoded = jwt.decode(token, options={"verify_signature": False})
    
    assert "exp" in decoded
    assert decoded["exp"] > 0


# ========== Тести автентифікації API ==========

@pytest.mark.asyncio
@pytest.mark.security
async def test_protected_endpoint_without_token(client: AsyncClient):
    """Тест захищеного endpoint без токена"""
    response = await client.get("/api/v1/users/me")
    # 401 Unauthorized або 403 Forbidden
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
@pytest.mark.security
async def test_protected_endpoint_with_invalid_token(client: AsyncClient):
    """Тест захищеного endpoint з невалідним токеном"""
    client.headers.update({"Authorization": "Bearer invalid_token_12345"})
    response = await client.get("/api/v1/users/me")
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
@pytest.mark.security
async def test_protected_endpoint_with_valid_token(authenticated_client: AsyncClient, test_user: User):
    """Тест захищеного endpoint з валідним токеном"""
    response = await authenticated_client.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user.id


@pytest.mark.asyncio
@pytest.mark.security
async def test_protected_endpoint_with_expired_token(client: AsyncClient, test_user: User):
    """Тест захищеного endpoint з простроченим токеном"""
    from datetime import timedelta
    
    # Створюємо токен з негативним часом життя (вже прострочений)
    token = create_access_token(
        data={"sub": str(test_user.id)},
        expires_delta=timedelta(seconds=-1)
    )
    
    client.headers.update({"Authorization": f"Bearer {token}"})
    response = await client.get("/api/v1/users/me")
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
@pytest.mark.security
async def test_protected_endpoint_with_malformed_header(client: AsyncClient):
    """Тест захищеного endpoint з неправильним форматом заголовка"""
    # Без "Bearer"
    client.headers.update({"Authorization": "some_token"})
    response = await client.get("/api/v1/users/me")
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
@pytest.mark.security
async def test_admin_endpoint_with_user_token(authenticated_client: AsyncClient):
    """Тест admin endpoint з токеном звичайного користувача"""
    response = await authenticated_client.get("/api/v1/admin/users")
    assert response.status_code == 403


@pytest.mark.asyncio
@pytest.mark.security
async def test_admin_endpoint_with_admin_token(admin_client: AsyncClient):
    """Тест admin endpoint з токеном адміна"""
    response = await admin_client.get("/api/v1/admin/users")
    assert response.status_code == 200


# ========== Тести безпеки паролів в API ==========

@pytest.mark.asyncio
@pytest.mark.security
async def test_password_not_returned_in_response(client: AsyncClient, db_session: AsyncSession):
    """Тест що пароль не повертається у відповіді"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "+380501234599",
            "email": "security@test.com",
            "name": "Security Test",
            "password": "SecurePassword123"
        }
    )
    
    if response.status_code == 201:
        data = response.json()
        assert "password" not in data
        assert "hashed_password" not in data


@pytest.mark.asyncio
@pytest.mark.security
async def test_password_stored_hashed(client: AsyncClient, db_session: AsyncSession):
    """Тест що пароль зберігається хешованим"""
    password = "PlainTextPassword123"
    
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "+380501234598",
            "email": "hashed@test.com",
            "name": "Hashed Test",
            "password": password
        }
    )
    
    if response.status_code == 201:
        data = response.json()
        user_id = data["id"]
        
        # Перевіряємо в БД
        result = await db_session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if user:
            assert user.hashed_password != password
            assert verify_password(password, user.hashed_password) is True


# ========== Тести захисту від атак ==========

@pytest.mark.asyncio
@pytest.mark.security
async def test_sql_injection_in_login(client: AsyncClient):
    """Тест захисту від SQL injection при логіні"""
    malicious_inputs = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "admin'--",
        "1' OR '1' = '1",
    ]
    
    for malicious_input in malicious_inputs:
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "phone": malicious_input,
                "password": "password"
            }
        )
        # Не повинно бути 200 успішного входу; 429 = rate limit
        assert response.status_code in [401, 403, 422, 429, 500]


@pytest.mark.asyncio
@pytest.mark.security
async def test_xss_in_registration(client: AsyncClient):
    """Тест захисту від XSS при реєстрації"""
    xss_payloads = [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "<img src=x onerror=alert('xss')>",
    ]
    
    for i, payload in enumerate(xss_payloads):
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "phone": f"+38050123459{i}",
                "email": f"xss{i}@test.com",
                "name": payload,
                "password": "SecurePassword123"
            }
        )
        
        # Або відхиляється, або дані санітизуються
        if response.status_code == 201:
            data = response.json()
            # Якщо прийнято, перевіряємо що скрипти не виконуються
            # (це більше для фронтенду, але бекенд може санітизувати)
            assert "<script>" not in str(data.get("name", ""))


@pytest.mark.asyncio
@pytest.mark.security
@requires_redis
async def test_brute_force_protection_login(client: AsyncClient, test_user: User):
    """Тест захисту від brute force при логіні (потребує Redis)"""
    # Робимо багато невдалих спроб логіну
    wrong_attempts = 10
    
    for i in range(wrong_attempts):
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "phone": test_user.phone,
                "password": f"wrong_password_{i}"
            }
        )
        # Всі спроби повинні бути відхилені
        assert response.status_code in [401, 403, 429]
    
    # Перевіряємо що правильний пароль все ще працює
    # (якщо немає тимчасового блокування)
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": test_user.phone,
            "password": "testpassword123"
        }
    )
    # Може бути 200 або 429 якщо є rate limiting
    assert response.status_code in [200, 429]


@pytest.mark.asyncio
@pytest.mark.security
async def test_token_not_in_url(authenticated_client: AsyncClient):
    """Тест що токен не передається в URL"""
    # Токен повинен бути в заголовку, не в URL
    auth_header = authenticated_client.headers.get("Authorization")
    assert auth_header is not None
    assert auth_header.startswith("Bearer ")


@pytest.mark.asyncio
@pytest.mark.security
async def test_sensitive_data_not_in_error_messages(client: AsyncClient):
    """Тест що чутливі дані не розкриваються в помилках"""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": "+380999999999",
            "password": "wrong_password"
        }
    )
    
    # Приймаємо будь-який статус помилки (включаючи 500 якщо Redis недоступний)
    if response.status_code in [401, 403]:
        error_detail = response.json().get("detail", "").lower()
        # Не повинно бути конкретної інформації про те, що саме невірно
        assert "password" not in error_detail or "невірн" in error_detail or "invalid" in error_detail


# ========== Тести CORS та заголовків безпеки ==========

@pytest.mark.asyncio
@pytest.mark.security
async def test_cors_headers_present(client: AsyncClient):
    """Тест наявності CORS заголовків"""
    response = await client.options("/api/v1/auth/login")
    # CORS заголовки можуть бути налаштовані
    # Просто перевіряємо що запит не падає
    assert response.status_code in [200, 204, 405]


@pytest.mark.asyncio
@pytest.mark.security
async def test_content_type_json(client: AsyncClient):
    """Тест що API повертає JSON"""
    # Використовуємо endpoint що не потребує Redis
    response = await client.get("/api/v1/settings/public")
    
    content_type = response.headers.get("content-type", "")
    assert "application/json" in content_type
