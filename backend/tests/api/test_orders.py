"""Детальні тести для orders endpoints"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal

from app.models.order import Order, OrderItem
from app.models.address import Address


@pytest.mark.asyncio
@pytest.mark.api
async def test_create_order_authenticated(authenticated_client: AsyncClient, test_product, test_user, db_session: AsyncSession):
    """Тест створення замовлення з авторизацією"""
    # Створюємо адресу для користувача
    address = Address(
        user_id=test_user.id,
        street="Test Street",
        house="123",
        city="Kyiv",
        is_default=True
    )
    db_session.add(address)
    await db_session.commit()
    await db_session.refresh(address)
    
    response = await authenticated_client.post(
        "/api/v1/orders",
        json={
            "items": [
                {
                    "product_id": test_product.id,
                    "quantity": 2
                }
            ],
            "address_id": address.id,
            "payment_method": "cash"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "order_number" in data
    assert "total_amount" in data
    assert float(data["total_amount"]) > 0
    assert data["status"] == "pending"
    assert data["payment_method"] == "cash"
    assert "items" in data
    assert len(data["items"]) == 1


@pytest.mark.asyncio
@pytest.mark.api
async def test_create_order_empty_cart(authenticated_client: AsyncClient):
    """Тест створення замовлення з порожнім кошиком"""
    response = await authenticated_client.post(
        "/api/v1/orders",
        json={
            "items": [],
            "payment_method": "cash"
        }
    )
    assert response.status_code == 400
    detail = response.json()["detail"].lower()
    assert "кошик" in detail or "empty" in detail or "порожній" in detail


@pytest.mark.asyncio
@pytest.mark.api
async def test_create_order_invalid_product(authenticated_client: AsyncClient):
    """Тест створення замовлення з неіснуючим продуктом"""
    response = await authenticated_client.post(
        "/api/v1/orders",
        json={
            "items": [
                {
                    "product_id": 99999,
                    "quantity": 1
                }
            ],
            "payment_method": "cash"
        }
    )
    assert response.status_code in [400, 404]


@pytest.mark.asyncio
@pytest.mark.api
async def test_create_order_unavailable_product(authenticated_client: AsyncClient, db_session: AsyncSession, test_category):
    """Тест створення замовлення з недоступним продуктом"""
    from app.models.product import Product
    
    unavailable_product = Product(
        name="Unavailable Product",
        slug="unavailable-product",
        description="Unavailable",
        price=Decimal("100.00"),
        category_id=test_category.id,
        is_available=False
    )
    db_session.add(unavailable_product)
    await db_session.commit()
    await db_session.refresh(unavailable_product)
    
    response = await authenticated_client.post(
        "/api/v1/orders",
        json={
            "items": [
                {
                    "product_id": unavailable_product.id,
                    "quantity": 1
                }
            ],
            "payment_method": "cash"
        }
    )
    assert response.status_code == 400
    detail = response.json()["detail"].lower()
    assert "недоступн" in detail or "unavailable" in detail


@pytest.mark.asyncio
@pytest.mark.api
async def test_create_order_with_size(authenticated_client: AsyncClient, test_product, test_user, db_session: AsyncSession):
    """Тест створення замовлення з розміром порції"""
    from app.models.product_size import ProductSize
    
    # Створюємо адресу
    address = Address(
        user_id=test_user.id,
        street="Test Street",
        house="123",
        city="Kyiv"
    )
    db_session.add(address)
    await db_session.flush()
    
    # Створюємо розмір порції
    product_size = ProductSize(
        product_id=test_product.id,
        name="Велика",
        price=Decimal("150.00")
    )
    db_session.add(product_size)
    await db_session.commit()
    await db_session.refresh(product_size)
    
    response = await authenticated_client.post(
        "/api/v1/orders",
        json={
            "items": [
                {
                    "product_id": test_product.id,
                    "size_id": product_size.id,
                    "quantity": 2
                }
            ],
            "address_id": address.id,
            "payment_method": "cash"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert float(data["total_amount"]) >= float(product_size.price * 2)
    assert len(data["items"]) == 1
    assert data["items"][0]["size_id"] == product_size.id


@pytest.mark.asyncio
@pytest.mark.api
async def test_create_order_free_delivery(authenticated_client: AsyncClient, test_product, test_user, db_session: AsyncSession):
    """Тест створення замовлення з безкоштовною доставкою (сума >= 500)"""
    from app.models.address import Address
    
    # Створюємо адресу
    address = Address(
        user_id=test_user.id,
        street="Test Street",
        house="123",
        city="Kyiv"
    )
    db_session.add(address)
    await db_session.commit()
    await db_session.refresh(address)
    
    # Створюємо замовлення на суму >= 500
    response = await authenticated_client.post(
        "/api/v1/orders",
        json={
            "items": [
                {
                    "product_id": test_product.id,
                    "quantity": 6  # 6 * 100 = 600 грн
                }
            ],
            "address_id": address.id,
            "payment_method": "cash"
        }
    )
    assert response.status_code == 201
    data = response.json()
    # Доставка повинна бути безкоштовною
    assert float(data["delivery_cost"]) == 0.00
    assert float(data["total_amount"]) >= 500.00


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_my_orders(authenticated_client: AsyncClient, test_user, db_session: AsyncSession, test_product):
    """Тест отримання замовлень користувача"""
    from app.models.address import Address
    
    # Створюємо тестове замовлення
    address = Address(
        user_id=test_user.id,
        street="Test Street",
        house="123",
        city="Kyiv"
    )
    db_session.add(address)
    await db_session.flush()
    
    order = Order(
        user_id=test_user.id,
        address_id=address.id,
        order_number="TEST-001",
        status="pending",
        total_amount=Decimal("200.00"),
        delivery_cost=Decimal("50.00"),
        customer_phone=test_user.phone,
        payment_method="cash"
    )
    db_session.add(order)
    await db_session.flush()
    
    order_item = OrderItem(
        order_id=order.id,
        product_id=test_product.id,
        product_name=test_product.name,
        quantity=2,
        price=Decimal("100.00")
    )
    db_session.add(order_item)
    await db_session.commit()
    
    response = await authenticated_client.get("/api/v1/users/me/orders")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["order_number"] == "TEST-001"
    assert data[0]["user_id"] == test_user.id


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_order_by_id(authenticated_client: AsyncClient, test_user, db_session: AsyncSession, test_product):
    """Тест отримання замовлення за ID"""
    from app.models.address import Address
    
    address = Address(
        user_id=test_user.id,
        street="Test Street",
        house="123",
        city="Kyiv"
    )
    db_session.add(address)
    await db_session.flush()
    
    order = Order(
        user_id=test_user.id,
        address_id=address.id,
        order_number="TEST-002",
        status="pending",
        total_amount=Decimal("200.00"),
        delivery_cost=Decimal("50.00"),
        customer_phone=test_user.phone,
        payment_method="cash"
    )
    db_session.add(order)
    await db_session.flush()
    
    order_item = OrderItem(
        order_id=order.id,
        product_id=test_product.id,
        product_name=test_product.name,
        quantity=2,
        price=Decimal("100.00")
    )
    db_session.add(order_item)
    await db_session.commit()
    
    response = await authenticated_client.get(f"/api/v1/users/me/orders/{order.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == order.id
    assert data["order_number"] == "TEST-002"
    assert "items" in data
    assert len(data["items"]) > 0


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_order_not_found(authenticated_client: AsyncClient):
    """Тест отримання неіснуючого замовлення"""
    response = await authenticated_client.get("/api/v1/users/me/orders/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_order_by_another_user(authenticated_client: AsyncClient, db_session: AsyncSession):
    """Тест отримання замовлення іншого користувача"""
    from app.models.user import User
    from app.models.address import Address
    from app.core.security import get_password_hash
    
    # Створюємо іншого користувача
    other_user = User(
        phone="+380509999998",
        email="other@example.com",
        name="Other User",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        is_admin=False
    )
    db_session.add(other_user)
    await db_session.flush()
    
    # Створюємо адресу для іншого користувача
    address = Address(
        user_id=other_user.id,
        street="Other Street",
        house="456",
        city="Kyiv"
    )
    db_session.add(address)
    await db_session.flush()
    
    # Створюємо замовлення для іншого користувача
    order = Order(
        user_id=other_user.id,
        address_id=address.id,
        order_number="OTHER-001",
        status="pending",
        total_amount=Decimal("100.00"),
        delivery_cost=Decimal("50.00"),
        customer_phone=other_user.phone,
        payment_method="cash"
    )
    db_session.add(order)
    await db_session.commit()
    
    # Спробуємо отримати замовлення іншого користувача
    response = await authenticated_client.get(f"/api/v1/users/me/orders/{order.id}")
    assert response.status_code == 404  # Не знайдено (бо це не наш замовлення)


@pytest.mark.asyncio
@pytest.mark.api
async def test_cancel_order(authenticated_client: AsyncClient, test_user, db_session: AsyncSession, test_product):
    """Тест скасування замовлення"""
    from app.models.address import Address
    
    address = Address(
        user_id=test_user.id,
        street="Test Street",
        house="123",
        city="Kyiv"
    )
    db_session.add(address)
    await db_session.flush()
    
    order = Order(
        user_id=test_user.id,
        address_id=address.id,
        order_number="TEST-CANCEL",
        status="pending",
        total_amount=Decimal("200.00"),
        delivery_cost=Decimal("50.00"),
        customer_phone=test_user.phone,
        payment_method="cash"
    )
    db_session.add(order)
    await db_session.commit()
    await db_session.refresh(order)
    
    response = await authenticated_client.put(f"/api/v1/users/me/orders/{order.id}/cancel")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "cancelled"
    
    # Перевіряємо в БД
    await db_session.refresh(order)
    assert order.status == "cancelled"


@pytest.mark.asyncio
@pytest.mark.api
async def test_cancel_completed_order(authenticated_client: AsyncClient, test_user, db_session: AsyncSession, test_product):
    """Тест скасування завершеного замовлення (не повинно працювати)"""
    from app.models.address import Address
    
    address = Address(
        user_id=test_user.id,
        street="Test Street",
        house="123",
        city="Kyiv"
    )
    db_session.add(address)
    await db_session.flush()
    
    order = Order(
        user_id=test_user.id,
        address_id=address.id,
        order_number="TEST-COMPLETED",
        status="completed",
        total_amount=Decimal("200.00"),
        delivery_cost=Decimal("50.00"),
        customer_phone=test_user.phone,
        payment_method="cash"
    )
    db_session.add(order)
    await db_session.commit()
    await db_session.refresh(order)
    
    response = await authenticated_client.put(f"/api/v1/users/me/orders/{order.id}/cancel")
    assert response.status_code == 400  # Не можна скасувати завершене замовлення


@pytest.mark.asyncio
@pytest.mark.api
async def test_reorder(authenticated_client: AsyncClient, test_user, db_session: AsyncSession, test_product):
    """Тест повторного замовлення"""
    from app.models.address import Address
    
    address = Address(
        user_id=test_user.id,
        street="Test Street",
        house="123",
        city="Kyiv"
    )
    db_session.add(address)
    await db_session.flush()
    
    # Створюємо старе замовлення
    old_order = Order(
        user_id=test_user.id,
        address_id=address.id,
        order_number="OLD-001",
        status="completed",
        total_amount=Decimal("200.00"),
        delivery_cost=Decimal("50.00"),
        customer_phone=test_user.phone,
        payment_method="cash"
    )
    db_session.add(old_order)
    await db_session.flush()
    
    old_order_item = OrderItem(
        order_id=old_order.id,
        product_id=test_product.id,
        product_name=test_product.name,
        quantity=2,
        price=Decimal("100.00")
    )
    db_session.add(old_order_item)
    await db_session.commit()
    
    # Повторюємо замовлення
    response = await authenticated_client.post(f"/api/v1/users/me/orders/{old_order.id}/reorder")
    assert response.status_code == 201
    data = response.json()
    assert data["order_number"] != old_order.order_number
    assert data["status"] == "pending"
    assert "items" in data
    assert len(data["items"]) > 0


@pytest.mark.asyncio
@pytest.mark.api
async def test_create_order_min_amount(client: AsyncClient, db_session: AsyncSession, test_category):
    """Тест мінімальної суми замовлення"""
    from app.models.product import Product
    from app.models.user import User
    from app.core.security import get_password_hash, create_access_token
    
    # Створюємо дешевий продукт
    cheap_product = Product(
        name="Cheap Product",
        slug="cheap-product",
        description="Cheap",
        price=Decimal("50.00"),  # Менше мінімальної суми (100 грн)
        category_id=test_category.id,
        is_available=True
    )
    db_session.add(cheap_product)
    await db_session.commit()
    
    # Створюємо користувача та авторизуємо
    user = User(
        phone="+380501234568",
        email="user2@example.com",
        name="Test User 2",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        is_admin=False
    )
    db_session.add(user)
    await db_session.commit()
    
    token = create_access_token(data={"sub": str(user.id)})
    client.headers.update({"Authorization": f"Bearer {token}"})
    
    # Спробуємо створити замовлення менше мінімальної суми
    response = await client.post(
        "/api/v1/orders",
        json={
            "items": [
                {
                    "product_id": cheap_product.id,
                    "quantity": 1  # 50 грн < 100 грн мінімум
                }
            ],
            "payment_method": "cash"
        }
    )
    assert response.status_code == 400
    detail = response.json()["detail"].lower()
    assert "мінімальн" in detail or "minimum" in detail

