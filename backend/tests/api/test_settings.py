"""Детальні тести для settings endpoints"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_public_settings(client: AsyncClient):
    """Тест отримання публічних налаштувань"""
    response = await client.get("/api/v1/settings/public")
    assert response.status_code == 200
    data = response.json()
    
    # Перевіряємо обов'язкові поля
    assert "project_name" in data
    assert "working_hours" in data
    assert "min_order_amount" in data
    assert "free_delivery_threshold" in data


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_public_settings_project_name(client: AsyncClient):
    """Тест що project_name не порожній"""
    response = await client.get("/api/v1/settings/public")
    assert response.status_code == 200
    data = response.json()
    
    assert data["project_name"] is not None
    assert len(data["project_name"]) > 0


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_public_settings_working_hours_format(client: AsyncClient):
    """Тест формату робочих годин"""
    response = await client.get("/api/v1/settings/public")
    assert response.status_code == 200
    data = response.json()
    
    working_hours = data["working_hours"]
    if working_hours:
        # Перевіряємо що містить час (наприклад "10:00 - 22:00")
        assert ":" in working_hours or "-" in working_hours


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_public_settings_min_order_amount(client: AsyncClient):
    """Тест мінімальної суми замовлення"""
    response = await client.get("/api/v1/settings/public")
    assert response.status_code == 200
    data = response.json()
    
    min_order = data["min_order_amount"]
    if min_order is not None:
        assert isinstance(min_order, (int, float))
        assert min_order >= 0


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_public_settings_free_delivery_threshold(client: AsyncClient):
    """Тест порогу безкоштовної доставки"""
    response = await client.get("/api/v1/settings/public")
    assert response.status_code == 200
    data = response.json()
    
    threshold = data["free_delivery_threshold"]
    if threshold is not None:
        assert isinstance(threshold, (int, float))
        assert threshold >= 0
        
        # Поріг безкоштовної доставки повинен бути більшим за мінімальну суму
        min_order = data["min_order_amount"]
        if min_order is not None:
            assert threshold >= min_order


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_public_settings_optional_fields(client: AsyncClient):
    """Тест опціональних полів налаштувань"""
    response = await client.get("/api/v1/settings/public")
    assert response.status_code == 200
    data = response.json()
    
    # Ці поля можуть бути null
    optional_fields = ["contact_phone", "contact_email", "address"]
    for field in optional_fields:
        assert field in data
        # Значення може бути None або рядком
        if data[field] is not None:
            assert isinstance(data[field], str)


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_public_settings_no_auth_required(client: AsyncClient):
    """Тест що публічні налаштування не вимагають авторизації"""
    # Запит без токена
    response = await client.get("/api/v1/settings/public")
    assert response.status_code == 200


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_public_settings_response_type(client: AsyncClient):
    """Тест типу відповіді"""
    response = await client.get("/api/v1/settings/public")
    assert response.status_code == 200
    
    # Перевіряємо Content-Type
    content_type = response.headers.get("content-type", "")
    assert "application/json" in content_type


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_public_settings_cache_headers(client: AsyncClient):
    """Тест заголовків кешування (якщо є)"""
    response = await client.get("/api/v1/settings/public")
    assert response.status_code == 200
    
    # Перевіряємо наявність заголовків (можуть бути відсутні)
    # Cache-Control, ETag, Last-Modified - опціональні
    headers = response.headers
    # Просто перевіряємо що відповідь успішна
    assert "content-type" in headers


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_public_settings_consistency(client: AsyncClient):
    """Тест консистентності відповіді при повторних запитах"""
    response1 = await client.get("/api/v1/settings/public")
    response2 = await client.get("/api/v1/settings/public")
    
    assert response1.status_code == 200
    assert response2.status_code == 200
    
    data1 = response1.json()
    data2 = response2.json()
    
    # Дані повинні бути однаковими
    assert data1["project_name"] == data2["project_name"]
    assert data1["min_order_amount"] == data2["min_order_amount"]
    assert data1["free_delivery_threshold"] == data2["free_delivery_threshold"]



