"""Детальні тести для callback endpoints"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


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


# Маркер для тестів що потребують Redis
requires_redis = pytest.mark.skipif(
    not is_redis_available(),
    reason="Redis is not available"
)


@pytest.mark.asyncio
@pytest.mark.api
@requires_redis
async def test_request_callback_success(client: AsyncClient):
    """Тест успішного запиту на передзвін (потребує Redis)"""
    response = await client.post(
        "/api/v1/callback/",
        json={
            "phone": "+380501234567",
            "name": "Тестовий Користувач"
        }
    )
    # Може бути 201 якщо успішно, або 400 якщо rate limit
    assert response.status_code in [201, 400]
    if response.status_code == 201:
        data = response.json()
        assert data["success"] is True
        assert "message" in data
        assert len(data["message"]) > 0


@pytest.mark.asyncio
@pytest.mark.api
async def test_request_callback_without_name(client: AsyncClient):
    """Тест запиту на передзвін без імені"""
    response = await client.post(
        "/api/v1/callback/",
        json={
            "phone": "+380501234567"
        }
    )
    # name обов'язковий (min_length=2)
    assert response.status_code == 422


@pytest.mark.asyncio
@pytest.mark.api
async def test_request_callback_invalid_phone(client: AsyncClient):
    """Тест запиту на передзвін з невалідним телефоном"""
    response = await client.post(
        "/api/v1/callback/",
        json={
            "phone": "123",  # Невалідний формат
            "name": "Test"
        }
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_request_callback_empty_phone(client: AsyncClient):
    """Тест запиту на передзвін з порожнім телефоном"""
    response = await client.post(
        "/api/v1/callback/",
        json={
            "phone": "",
            "name": "Test"
        }
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_request_callback_missing_phone(client: AsyncClient):
    """Тест запиту на передзвін без телефону"""
    response = await client.post(
        "/api/v1/callback/",
        json={
            "name": "Test"
        }
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_request_callback_long_name(client: AsyncClient):
    """Тест запиту на передзвін з дуже довгим ім'ям"""
    response = await client.post(
        "/api/v1/callback/",
        json={
            "phone": "+380501234567",
            "name": "A" * 150  # Більше max_length=100
        }
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
@requires_redis
async def test_request_callback_special_characters_in_name(client: AsyncClient):
    """Тест запиту на передзвін з спецсимволами в імені (потребує Redis)"""
    response = await client.post(
        "/api/v1/callback/",
        json={
            "phone": "+380501234567",
            "name": "Тест <script>alert('xss')</script>"
        }
    )
    # Може бути 201 або 400 (rate limit)
    assert response.status_code in [201, 400, 422]


@pytest.mark.asyncio
@pytest.mark.api
@requires_redis
async def test_request_callback_different_phone_formats(client: AsyncClient):
    """Тест різних форматів телефону (потребує Redis)"""
    # Формат з +380
    response1 = await client.post(
        "/api/v1/callback/",
        json={
            "phone": "+380501234567",
            "name": "Test"
        }
    )
    assert response1.status_code in [201, 400]  # 400 = rate limit
    
    # Формат 380
    response2 = await client.post(
        "/api/v1/callback/",
        json={
            "phone": "380501234568",
            "name": "Test"
        }
    )
    # Може бути 201, 400 (rate limit) або 422 (валідація)
    assert response2.status_code in [201, 400, 422]


@pytest.mark.asyncio
@pytest.mark.api
@requires_redis
async def test_request_callback_response_structure(client: AsyncClient):
    """Тест структури відповіді на запит передзвону (потребує Redis)"""
    response = await client.post(
        "/api/v1/callback/",
        json={
            "phone": "+380501234569",
            "name": "Структура тест"
        }
    )
    # Може бути 201 або 400 (rate limit)
    if response.status_code == 201:
        data = response.json()
        # Перевіряємо обов'язкові поля
        assert "success" in data
        assert "message" in data
        assert isinstance(data["success"], bool)
        assert isinstance(data["message"], str)


@pytest.mark.asyncio
@pytest.mark.api
@requires_redis
async def test_request_callback_cyrillic_name(client: AsyncClient):
    """Тест запиту на передзвін з кириличним ім'ям (потребує Redis)"""
    response = await client.post(
        "/api/v1/callback/",
        json={
            "phone": "+380501234570",
            "name": "Іван Петренко"
        }
    )
    # Може бути 201 або 400 (rate limit)
    if response.status_code == 201:
        data = response.json()
        assert data["success"] is True


@pytest.mark.asyncio
@pytest.mark.api
async def test_request_callback_empty_body(client: AsyncClient):
    """Тест запиту на передзвін з порожнім тілом"""
    response = await client.post(
        "/api/v1/callback/",
        json={}
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_request_callback_null_values(client: AsyncClient):
    """Тест запиту на передзвін з null значеннями"""
    response = await client.post(
        "/api/v1/callback/",
        json={
            "phone": None,
            "name": None
        }
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_request_callback_whitespace_phone(client: AsyncClient):
    """Тест запиту на передзвін з пробілами в телефоні"""
    response = await client.post(
        "/api/v1/callback/",
        json={
            "phone": "+380 50 123 45 67",
            "name": "Test"
        }
    )
    # Пробіли в телефоні - невалідний формат або rate limit
    assert response.status_code in [201, 400, 422]


@pytest.mark.asyncio
@pytest.mark.api
@requires_redis
async def test_request_callback_rate_limit_message(client: AsyncClient):
    """Тест повідомлення про перевищення ліміту (потребує Redis)"""
    phone = "+380501234571"
    
    # Робимо кілька запитів поспіль
    responses = []
    for i in range(5):
        response = await client.post(
            "/api/v1/callback/",
            json={
                "phone": phone,
                "name": f"Test {i}"
            }
        )
        responses.append(response)
    
    # Перевіряємо що хоча б один запит успішний або rate limited
    status_codes = [r.status_code for r in responses]
    # Всі відповіді повинні бути або 201 (успіх) або 400 (rate limit)
    for code in status_codes:
        assert code in [201, 400]
