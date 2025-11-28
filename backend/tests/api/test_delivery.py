"""Детальні тести для delivery endpoints"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal

from app.models.delivery_zone import DeliveryZone


@pytest.mark.asyncio
@pytest.mark.api
async def test_calculate_delivery_cost_default(client: AsyncClient):
    """Тест розрахунку вартості доставки (стандартні тарифи)"""
    response = await client.post(
        "/api/v1/delivery/calculate",
        json={
            "city": "Невідоме місто",
            "order_amount": "300.00"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "delivery_cost" in data
    assert "min_order_amount" in data
    assert "free_delivery_threshold" in data
    assert float(data["delivery_cost"]) >= 0


@pytest.mark.asyncio
@pytest.mark.api
async def test_calculate_delivery_cost_with_zone(client: AsyncClient, db_session: AsyncSession):
    """Тест розрахунку вартості доставки з зоною"""
    # Створюємо зону доставки
    zone = DeliveryZone(
        name="Київ центр",
        delivery_cost=Decimal("40.00"),
        min_order_amount=Decimal("150.00"),
        free_delivery_threshold=Decimal("400.00"),
        delivery_time_minutes=45,
        is_active=True,
        position=1
    )
    db_session.add(zone)
    await db_session.commit()
    
    response = await client.post(
        "/api/v1/delivery/calculate",
        json={
            "city": "Київ центр",
            "street": "Хрещатик",
            "house": "1",
            "order_amount": "200.00"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["zone_name"] == "Київ центр"
    assert float(data["delivery_cost"]) == 40.00
    assert float(data["min_order_amount"]) == 150.00
    assert data["delivery_time_minutes"] == 45


@pytest.mark.asyncio
@pytest.mark.api
async def test_calculate_delivery_free_delivery(client: AsyncClient, db_session: AsyncSession):
    """Тест безкоштовної доставки при досягненні порогу"""
    # Створюємо зону доставки
    zone = DeliveryZone(
        name="Київ тест",
        delivery_cost=Decimal("50.00"),
        min_order_amount=Decimal("100.00"),
        free_delivery_threshold=Decimal("500.00"),
        delivery_time_minutes=60,
        is_active=True,
        position=1
    )
    db_session.add(zone)
    await db_session.commit()
    
    # Замовлення >= 500 грн
    response = await client.post(
        "/api/v1/delivery/calculate",
        json={
            "city": "Київ тест",
            "order_amount": "600.00"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert float(data["delivery_cost"]) == 0.00  # Безкоштовно


@pytest.mark.asyncio
@pytest.mark.api
async def test_calculate_delivery_below_minimum(client: AsyncClient, db_session: AsyncSession):
    """Тест замовлення нижче мінімальної суми"""
    # Створюємо зону доставки
    zone = DeliveryZone(
        name="Київ мінімум",
        delivery_cost=Decimal("50.00"),
        min_order_amount=Decimal("200.00"),
        free_delivery_threshold=Decimal("500.00"),
        delivery_time_minutes=60,
        is_active=True,
        position=1
    )
    db_session.add(zone)
    await db_session.commit()
    
    # Замовлення < 200 грн
    response = await client.post(
        "/api/v1/delivery/calculate",
        json={
            "city": "Київ мінімум",
            "order_amount": "100.00"
        }
    )
    assert response.status_code == 400
    detail = response.json()["detail"].lower()
    assert "мінімальн" in detail or "minimum" in detail


@pytest.mark.asyncio
@pytest.mark.api
async def test_calculate_delivery_inactive_zone(client: AsyncClient, db_session: AsyncSession):
    """Тест що неактивна зона не використовується"""
    # Створюємо неактивну зону
    zone = DeliveryZone(
        name="Неактивна зона",
        delivery_cost=Decimal("100.00"),
        min_order_amount=Decimal("500.00"),
        free_delivery_threshold=Decimal("1000.00"),
        delivery_time_minutes=120,
        is_active=False,
        position=1
    )
    db_session.add(zone)
    await db_session.commit()
    
    response = await client.post(
        "/api/v1/delivery/calculate",
        json={
            "city": "Неактивна зона",
            "order_amount": "300.00"
        }
    )
    assert response.status_code == 200
    data = response.json()
    # Повинні використовуватись стандартні тарифи
    assert data["zone_name"] is None


@pytest.mark.asyncio
@pytest.mark.api
async def test_calculate_delivery_multiple_zones(client: AsyncClient, db_session: AsyncSession):
    """Тест вибору зони з кількох"""
    # Створюємо кілька зон
    zone1 = DeliveryZone(
        name="Київ район 1",
        delivery_cost=Decimal("30.00"),
        min_order_amount=Decimal("100.00"),
        free_delivery_threshold=Decimal("400.00"),
        delivery_time_minutes=30,
        is_active=True,
        position=1
    )
    zone2 = DeliveryZone(
        name="Київ район 2",
        delivery_cost=Decimal("60.00"),
        min_order_amount=Decimal("150.00"),
        free_delivery_threshold=Decimal("600.00"),
        delivery_time_minutes=60,
        is_active=True,
        position=2
    )
    db_session.add_all([zone1, zone2])
    await db_session.commit()
    
    # Запит для району 1
    response = await client.post(
        "/api/v1/delivery/calculate",
        json={
            "city": "Київ район 1",
            "order_amount": "200.00"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["zone_name"] == "Київ район 1"
    assert float(data["delivery_cost"]) == 30.00


@pytest.mark.asyncio
@pytest.mark.api
async def test_calculate_delivery_invalid_amount(client: AsyncClient):
    """Тест з невалідною сумою замовлення"""
    response = await client.post(
        "/api/v1/delivery/calculate",
        json={
            "city": "Київ",
            "order_amount": "-100.00"
        }
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_calculate_delivery_missing_city(client: AsyncClient):
    """Тест без обов'язкового поля city"""
    response = await client.post(
        "/api/v1/delivery/calculate",
        json={
            "order_amount": "300.00"
        }
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_calculate_delivery_zero_amount(client: AsyncClient):
    """Тест з нульовою сумою замовлення"""
    response = await client.post(
        "/api/v1/delivery/calculate",
        json={
            "city": "Київ",
            "order_amount": "0.00"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "delivery_cost" in data


@pytest.mark.asyncio
@pytest.mark.api
async def test_calculate_delivery_with_full_address(client: AsyncClient, db_session: AsyncSession):
    """Тест з повною адресою"""
    zone = DeliveryZone(
        name="Повна адреса тест",
        delivery_cost=Decimal("45.00"),
        min_order_amount=Decimal("100.00"),
        free_delivery_threshold=Decimal("500.00"),
        delivery_time_minutes=50,
        is_active=True,
        position=1
    )
    db_session.add(zone)
    await db_session.commit()
    
    response = await client.post(
        "/api/v1/delivery/calculate",
        json={
            "city": "Повна адреса тест",
            "street": "Вулиця Тестова",
            "house": "123А",
            "order_amount": "350.00"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["zone_name"] == "Повна адреса тест"
    assert float(data["delivery_cost"]) == 45.00
    assert data["delivery_time_minutes"] == 50


@pytest.mark.asyncio
@pytest.mark.api
async def test_calculate_delivery_boundary_free_delivery(client: AsyncClient, db_session: AsyncSession):
    """Тест граничного значення для безкоштовної доставки"""
    zone = DeliveryZone(
        name="Граничне значення",
        delivery_cost=Decimal("50.00"),
        min_order_amount=Decimal("100.00"),
        free_delivery_threshold=Decimal("500.00"),
        delivery_time_minutes=60,
        is_active=True,
        position=1
    )
    db_session.add(zone)
    await db_session.commit()
    
    # Рівно 500 грн - повинна бути безкоштовна доставка
    response = await client.post(
        "/api/v1/delivery/calculate",
        json={
            "city": "Граничне значення",
            "order_amount": "500.00"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert float(data["delivery_cost"]) == 0.00
    
    # 499.99 грн - платна доставка
    response2 = await client.post(
        "/api/v1/delivery/calculate",
        json={
            "city": "Граничне значення",
            "order_amount": "499.99"
        }
    )
    assert response2.status_code == 200
    data2 = response2.json()
    assert float(data2["delivery_cost"]) == 50.00



