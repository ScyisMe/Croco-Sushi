"""Детальні тести для users endpoints"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal

from app.models.user import User
from app.models.address import Address
from app.models.favorite import Favorite
from app.models.product import Product
from app.core.security import get_password_hash


# ========== Тести профілю користувача ==========

@pytest.mark.asyncio
@pytest.mark.users
async def test_get_my_profile(authenticated_client: AsyncClient, test_user: User):
    """Тест отримання профілю авторизованого користувача"""
    response = await authenticated_client.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user.id
    assert data["phone"] == test_user.phone
    assert data["email"] == test_user.email
    assert data["name"] == test_user.name
    assert data["is_active"] is True
    assert "hashed_password" not in data  # Пароль не повертається


@pytest.mark.asyncio
@pytest.mark.users
async def test_get_profile_unauthorized(client: AsyncClient):
    """Тест отримання профілю без авторизації"""
    response = await client.get("/api/v1/users/me")
    # 401 Unauthorized або 403 Forbidden
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
@pytest.mark.users
async def test_update_my_profile_name(authenticated_client: AsyncClient, test_user: User, db_session: AsyncSession):
    """Тест оновлення імені користувача"""
    response = await authenticated_client.put(
        "/api/v1/users/me",
        json={"name": "Updated Name"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    
    # Перевіряємо в БД
    await db_session.refresh(test_user)
    assert test_user.name == "Updated Name"


@pytest.mark.asyncio
@pytest.mark.users
async def test_update_my_profile_email(authenticated_client: AsyncClient, test_user: User, db_session: AsyncSession):
    """Тест оновлення email користувача"""
    response = await authenticated_client.put(
        "/api/v1/users/me",
        json={"email": "newemail@example.com"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newemail@example.com"
    
    # Перевіряємо в БД
    await db_session.refresh(test_user)
    assert test_user.email == "newemail@example.com"


@pytest.mark.asyncio
@pytest.mark.users
async def test_update_profile_duplicate_email(authenticated_client: AsyncClient, db_session: AsyncSession):
    """Тест оновлення email на вже зайнятий"""
    # Створюємо іншого користувача з email
    other_user = User(
        phone="+380509999996",
        email="existing@example.com",
        name="Other User",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        is_admin=False
    )
    db_session.add(other_user)
    await db_session.commit()
    
    # Спробуємо оновити email на вже зайнятий
    response = await authenticated_client.put(
        "/api/v1/users/me",
        json={"email": "existing@example.com"}
    )
    assert response.status_code == 400
    detail = response.json()["detail"].lower()
    assert "email" in detail


@pytest.mark.asyncio
@pytest.mark.users
async def test_delete_my_account(authenticated_client: AsyncClient, test_user: User, db_session: AsyncSession):
    """Тест деактивації акаунту"""
    response = await authenticated_client.delete("/api/v1/users/me")
    assert response.status_code == 204
    
    # Перевіряємо що акаунт деактивовано
    await db_session.refresh(test_user)
    assert test_user.is_active is False


# ========== Тести адрес ==========

@pytest.mark.asyncio
@pytest.mark.users
async def test_get_my_addresses_empty(authenticated_client: AsyncClient):
    """Тест отримання порожнього списку адрес"""
    response = await authenticated_client.get("/api/v1/users/me/addresses")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


@pytest.mark.asyncio
@pytest.mark.users
async def test_create_address(authenticated_client: AsyncClient, test_user: User, db_session: AsyncSession):
    """Тест створення нової адреси"""
    response = await authenticated_client.post(
        "/api/v1/users/me/addresses",
        json={
            "city": "Київ",
            "street": "Хрещатик",
            "house": "1",
            "apartment": "10",
            "entrance": "2",
            "floor": "5",
            "comment": "Біля метро",
            "is_default": True
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["city"] == "Київ"
    assert data["street"] == "Хрещатик"
    assert data["house"] == "1"
    assert data["is_default"] is True
    assert data["user_id"] == test_user.id


@pytest.mark.asyncio
@pytest.mark.users
async def test_create_multiple_addresses(authenticated_client: AsyncClient, test_user: User, db_session: AsyncSession):
    """Тест створення кількох адрес"""
    # Створюємо першу адресу (default)
    response1 = await authenticated_client.post(
        "/api/v1/users/me/addresses",
        json={
            "city": "Київ",
            "street": "Хрещатик",
            "house": "1",
            "is_default": True
        }
    )
    assert response1.status_code == 201
    address1 = response1.json()
    assert address1["is_default"] is True
    
    # Створюємо другу адресу (default)
    response2 = await authenticated_client.post(
        "/api/v1/users/me/addresses",
        json={
            "city": "Київ",
            "street": "Бессарабська площа",
            "house": "5",
            "is_default": True
        }
    )
    assert response2.status_code == 201
    address2 = response2.json()
    assert address2["is_default"] is True
    
    # Перевіряємо що перша адреса більше не default
    response = await authenticated_client.get("/api/v1/users/me/addresses")
    addresses = response.json()
    assert len(addresses) == 2
    
    # Знаходимо адреси
    addr1 = next((a for a in addresses if a["id"] == address1["id"]), None)
    addr2 = next((a for a in addresses if a["id"] == address2["id"]), None)
    
    assert addr1 is not None
    assert addr2 is not None
    assert addr1["is_default"] is False
    assert addr2["is_default"] is True


@pytest.mark.asyncio
@pytest.mark.users
async def test_update_address(authenticated_client: AsyncClient, test_user: User, db_session: AsyncSession):
    """Тест оновлення адреси"""
    # Створюємо адресу
    address = Address(
        user_id=test_user.id,
        city="Київ",
        street="Стара вулиця",
        house="10"
    )
    db_session.add(address)
    await db_session.commit()
    await db_session.refresh(address)
    
    # Оновлюємо
    response = await authenticated_client.put(
        f"/api/v1/users/me/addresses/{address.id}",
        json={
            "street": "Нова вулиця",
            "house": "20"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["street"] == "Нова вулиця"
    assert data["house"] == "20"


@pytest.mark.asyncio
@pytest.mark.users
async def test_update_address_not_found(authenticated_client: AsyncClient):
    """Тест оновлення неіснуючої адреси"""
    response = await authenticated_client.put(
        "/api/v1/users/me/addresses/99999",
        json={"street": "Test"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.users
async def test_delete_address(authenticated_client: AsyncClient, test_user: User, db_session: AsyncSession):
    """Тест видалення адреси"""
    # Створюємо адресу
    address = Address(
        user_id=test_user.id,
        city="Київ",
        street="Для видалення",
        house="1"
    )
    db_session.add(address)
    await db_session.commit()
    await db_session.refresh(address)
    
    address_id = address.id
    
    # Видаляємо
    response = await authenticated_client.delete(f"/api/v1/users/me/addresses/{address_id}")
    assert response.status_code == 204
    
    # Перевіряємо що видалено
    result = await db_session.execute(select(Address).where(Address.id == address_id))
    deleted_address = result.scalar_one_or_none()
    assert deleted_address is None


@pytest.mark.asyncio
@pytest.mark.users
async def test_delete_address_not_found(authenticated_client: AsyncClient):
    """Тест видалення неіснуючої адреси"""
    response = await authenticated_client.delete("/api/v1/users/me/addresses/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.users
async def test_set_default_address(authenticated_client: AsyncClient, test_user: User, db_session: AsyncSession):
    """Тест встановлення адреси за замовчуванням"""
    # Створюємо дві адреси
    address1 = Address(
        user_id=test_user.id,
        city="Київ",
        street="Перша",
        house="1",
        is_default=True
    )
    address2 = Address(
        user_id=test_user.id,
        city="Київ",
        street="Друга",
        house="2",
        is_default=False
    )
    db_session.add_all([address1, address2])
    await db_session.commit()
    await db_session.refresh(address1)
    await db_session.refresh(address2)
    
    # Встановлюємо другу адресу як default
    response = await authenticated_client.put(f"/api/v1/users/me/addresses/{address2.id}/default")
    assert response.status_code == 200
    data = response.json()
    assert data["is_default"] is True
    
    # Перевіряємо що перша більше не default
    await db_session.refresh(address1)
    assert address1.is_default is False


@pytest.mark.asyncio
@pytest.mark.users
async def test_update_others_address(authenticated_client: AsyncClient, db_session: AsyncSession):
    """Тест оновлення адреси іншого користувача"""
    # Створюємо іншого користувача з адресою
    other_user = User(
        phone="+380509999995",
        email="other3@example.com",
        name="Other User",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        is_admin=False
    )
    db_session.add(other_user)
    await db_session.flush()
    
    other_address = Address(
        user_id=other_user.id,
        city="Київ",
        street="Чужа вулиця",
        house="1"
    )
    db_session.add(other_address)
    await db_session.commit()
    await db_session.refresh(other_address)
    
    # Спробуємо оновити чужу адресу
    response = await authenticated_client.put(
        f"/api/v1/users/me/addresses/{other_address.id}",
        json={"street": "Hacked"}
    )
    assert response.status_code == 404


# ========== Тести обраного (Favorites) ==========

@pytest.mark.asyncio
@pytest.mark.users
async def test_get_favorites_empty(authenticated_client: AsyncClient):
    """Тест отримання порожнього списку обраного"""
    response = await authenticated_client.get("/api/v1/users/me/favorites")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


@pytest.mark.asyncio
@pytest.mark.users
async def test_add_to_favorites(authenticated_client: AsyncClient, test_product, test_user: User, db_session: AsyncSession):
    """Тест додавання товару в обране"""
    response = await authenticated_client.post(f"/api/v1/users/me/favorites/{test_product.id}")
    assert response.status_code == 201
    data = response.json()
    assert "favorite_id" in data
    assert data["message"] == "Товар додано в обране"
    
    # Перевіряємо в БД
    result = await db_session.execute(
        select(Favorite).where(
            Favorite.user_id == test_user.id,
            Favorite.product_id == test_product.id
        )
    )
    favorite = result.scalar_one_or_none()
    assert favorite is not None


@pytest.mark.asyncio
@pytest.mark.users
async def test_add_to_favorites_duplicate(authenticated_client: AsyncClient, test_product, test_user: User, db_session: AsyncSession):
    """Тест повторного додавання товару в обране"""
    # Додаємо в обране
    favorite = Favorite(
        user_id=test_user.id,
        product_id=test_product.id
    )
    db_session.add(favorite)
    await db_session.commit()
    
    # Спробуємо додати знову
    response = await authenticated_client.post(f"/api/v1/users/me/favorites/{test_product.id}")
    assert response.status_code == 400
    detail = response.json()["detail"].lower()
    assert "вже" in detail or "already" in detail


@pytest.mark.asyncio
@pytest.mark.users
async def test_add_nonexistent_product_to_favorites(authenticated_client: AsyncClient):
    """Тест додавання неіснуючого товару в обране"""
    response = await authenticated_client.post("/api/v1/users/me/favorites/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.users
async def test_remove_from_favorites(authenticated_client: AsyncClient, test_product, test_user: User, db_session: AsyncSession):
    """Тест видалення товару з обраного"""
    # Додаємо в обране
    favorite = Favorite(
        user_id=test_user.id,
        product_id=test_product.id
    )
    db_session.add(favorite)
    await db_session.commit()
    
    # Видаляємо
    response = await authenticated_client.delete(f"/api/v1/users/me/favorites/{test_product.id}")
    assert response.status_code == 204
    
    # Перевіряємо що видалено
    result = await db_session.execute(
        select(Favorite).where(
            Favorite.user_id == test_user.id,
            Favorite.product_id == test_product.id
        )
    )
    deleted_favorite = result.scalar_one_or_none()
    assert deleted_favorite is None


@pytest.mark.asyncio
@pytest.mark.users
async def test_remove_nonexistent_from_favorites(authenticated_client: AsyncClient):
    """Тест видалення неіснуючого товару з обраного"""
    response = await authenticated_client.delete("/api/v1/users/me/favorites/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.users
async def test_get_favorites_with_products(authenticated_client: AsyncClient, test_product, test_user: User, db_session: AsyncSession):
    """Тест отримання списку обраного з товарами"""
    # Додаємо в обране
    favorite = Favorite(
        user_id=test_user.id,
        product_id=test_product.id
    )
    db_session.add(favorite)
    await db_session.commit()
    
    # Отримуємо список
    response = await authenticated_client.get("/api/v1/users/me/favorites")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    
    # Перевіряємо структуру відповіді (може бути різна)
    first_item = data[0]
    if "product" in first_item:
        # Якщо продукт вкладений
        assert first_item["product"]["id"] == test_product.id
    elif "product_id" in first_item:
        # Якщо тільки ID продукту
        assert first_item["product_id"] == test_product.id
    else:
        # Інший формат - просто перевіряємо що є дані
        assert "id" in first_item


# ========== Тести програми лояльності ==========

@pytest.mark.asyncio
@pytest.mark.users
async def test_get_loyalty_info(authenticated_client: AsyncClient, test_user: User):
    """Тест отримання інформації про програму лояльності"""
    response = await authenticated_client.get("/api/v1/users/me/loyalty")
    assert response.status_code == 200
    data = response.json()
    assert "bonus_balance" in data
    assert "loyalty_status" in data
    assert data["bonus_balance"] == test_user.bonus_balance


@pytest.mark.asyncio
@pytest.mark.users
async def test_get_loyalty_history(authenticated_client: AsyncClient):
    """Тест отримання історії лояльності"""
    response = await authenticated_client.get("/api/v1/users/me/loyalty/history")
    assert response.status_code == 200
    data = response.json()
    assert "history" in data
    assert "total" in data


@pytest.mark.asyncio
@pytest.mark.users
async def test_get_referral_info(authenticated_client: AsyncClient, test_user: User, db_session: AsyncSession):
    """Тест отримання реферальної інформації"""
    response = await authenticated_client.get("/api/v1/users/me/referral")
    assert response.status_code == 200
    data = response.json()
    assert "referral_code" in data
    assert "referral_link" in data
    
    # Перевіряємо що код згенеровано
    if data["referral_code"]:
        assert len(data["referral_code"]) > 0
        assert "croco-sushi.com/ref/" in data["referral_link"]


@pytest.mark.asyncio
@pytest.mark.users
async def test_get_referral_generates_code(authenticated_client: AsyncClient, test_user: User, db_session: AsyncSession):
    """Тест що реферальний код генерується при першому запиті"""
    # Переконуємось що коду немає
    test_user.referral_code = None
    await db_session.commit()
    
    # Запитуємо реферальну інформацію
    response = await authenticated_client.get("/api/v1/users/me/referral")
    assert response.status_code == 200
    data = response.json()
    
    # Код повинен бути згенерований
    assert data["referral_code"] is not None
    assert len(data["referral_code"]) > 0
    
    # Перевіряємо в БД
    await db_session.refresh(test_user)
    assert test_user.referral_code == data["referral_code"]


# ========== Тести замовлень користувача ==========

@pytest.mark.asyncio
@pytest.mark.users
async def test_get_my_orders_empty(authenticated_client: AsyncClient):
    """Тест отримання порожнього списку замовлень"""
    response = await authenticated_client.get("/api/v1/users/me/orders")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


@pytest.mark.asyncio
@pytest.mark.users
async def test_get_my_orders_pagination(authenticated_client: AsyncClient, test_user: User, test_product, db_session: AsyncSession):
    """Тест пагінації замовлень"""
    from app.models.order import Order, OrderItem
    
    # Створюємо адресу
    address = Address(
        user_id=test_user.id,
        city="Київ",
        street="Test",
        house="1"
    )
    db_session.add(address)
    await db_session.flush()
    
    # Створюємо кілька замовлень
    for i in range(5):
        order = Order(
            user_id=test_user.id,
            address_id=address.id,
            order_number=f"TEST-PAG-{i}",
            status="pending",
            total_amount=Decimal("100.00"),
            delivery_cost=Decimal("50.00"),
            customer_phone=test_user.phone,
            payment_method="cash"
        )
        db_session.add(order)
    await db_session.commit()
    
    # Тест пагінації
    response = await authenticated_client.get("/api/v1/users/me/orders?skip=0&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    
    # Друга сторінка
    response2 = await authenticated_client.get("/api/v1/users/me/orders?skip=2&limit=2")
    assert response2.status_code == 200
    data2 = response2.json()
    assert len(data2) == 2
    
    # Перевіряємо що замовлення різні
    assert data[0]["id"] != data2[0]["id"]

