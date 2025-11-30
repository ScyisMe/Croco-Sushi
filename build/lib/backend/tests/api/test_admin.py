"""Тести для admin endpoints"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
@pytest.mark.admin
async def test_admin_access_required(client: AsyncClient):
    """Тест що admin endpoints вимагають авторизації"""
    response = await client.get("/api/v1/admin/users")
    # HTTPBearer повертає 403 коли токен відсутній
    assert response.status_code == 403


@pytest.mark.asyncio
@pytest.mark.admin
async def test_admin_access_without_admin_role(authenticated_client: AsyncClient):
    """Тест що звичайний користувач не може отримати доступ до admin endpoints"""
    response = await authenticated_client.get("/api/v1/admin/users")
    assert response.status_code == 403


@pytest.mark.asyncio
@pytest.mark.admin
async def test_admin_get_users(admin_client: AsyncClient, test_user):
    """Тест отримання списку користувачів адміном"""
    response = await admin_client.get("/api/v1/admin/users")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
@pytest.mark.admin
async def test_admin_get_user_by_id(admin_client: AsyncClient, test_user):
    """Тест отримання користувача за ID адміном"""
    response = await admin_client.get(f"/api/v1/admin/users/{test_user.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user.id
    assert data["phone"] == test_user.phone


@pytest.mark.asyncio
@pytest.mark.admin
async def test_admin_create_product(admin_client: AsyncClient, db_session: AsyncSession):
    """Тест створення продукту адміном"""
    # Спочатку створюємо категорію
    from app.models.category import Category
    
    category = Category(
        name="Admin Test Category",
        slug="admin-test-category",
        is_active=True
    )
    db_session.add(category)
    await db_session.commit()
    await db_session.refresh(category)
    
    response = await admin_client.post(
        "/api/v1/admin/products",
        json={
            "name": "New Admin Product",
            "slug": "new-admin-product",
            "description": "Product created by admin",
            "price": 150.00,
            "category_id": category.id,
            "is_available": True
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Admin Product"
    assert float(data["price"]) == 150.00


@pytest.mark.asyncio
@pytest.mark.admin
async def test_admin_update_product(admin_client: AsyncClient, test_product):
    """Тест оновлення продукту адміном"""
    response = await admin_client.put(
        f"/api/v1/admin/products/{test_product.id}",
        json={
            "name": "Updated Product Name",
            "price": 120.00
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Product Name"
    assert float(data["price"]) == 120.00


@pytest.mark.asyncio
@pytest.mark.admin
async def test_admin_delete_product(admin_client: AsyncClient, db_session: AsyncSession):
    """Тест видалення продукту адміном"""
    # Створюємо категорію та продукт для видалення
    from app.models.category import Category
    from app.models.product import Product
    from decimal import Decimal
    
    category = Category(
        name="Delete Test Category",
        slug="delete-test-category",
        is_active=True
    )
    db_session.add(category)
    await db_session.flush()
    
    product = Product(
        name="Product to Delete",
        slug="product-to-delete",
        description="Will be deleted",
        price=Decimal("100.00"),
        category_id=category.id,
        is_available=True
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    
    product_id = product.id
    
    response = await admin_client.delete(f"/api/v1/admin/products/{product_id}")
    assert response.status_code == 204
    
    # Перевіряємо що продукт видалено
    from sqlalchemy import select
    result = await db_session.execute(select(Product).where(Product.id == product_id))
    deleted_product = result.scalar_one_or_none()
    assert deleted_product is None


@pytest.mark.asyncio
@pytest.mark.admin
async def test_admin_add_bonus(admin_client: AsyncClient, test_user, db_session: AsyncSession):
    """Тест нарахування бонусів адміном"""
    initial_balance = test_user.bonus_balance
    
    response = await admin_client.post(
        f"/api/v1/admin/users/{test_user.id}/add-bonus",
        json={
            "amount": 100,
            "reason": "Test bonus"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["bonus_balance"] == initial_balance + 100
    
    # Перевіряємо в БД
    await db_session.refresh(test_user)
    assert test_user.bonus_balance == initial_balance + 100

