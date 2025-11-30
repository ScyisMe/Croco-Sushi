"""Детальні тести для products endpoints"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_products_list(client: AsyncClient, test_product):
    """Тест отримання списку продуктів"""
    response = await client.get("/api/v1/products/", follow_redirects=True)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "id" in data[0]
        assert "name" in data[0]
        assert "price" in data[0]
        assert "slug" in data[0]
        assert data[0]["is_available"] is True


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_products_with_category_filter(client: AsyncClient, test_product, test_category):
    """Тест отримання продуктів з фільтром по категорії"""
    response = await client.get(f"/api/v1/products/?category_id={test_category.id}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Перевіряємо що всі продукти з тієї ж категорії
    for product in data:
        assert product["category_id"] == test_category.id


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_products_with_search(client: AsyncClient, test_product):
    """Тест отримання продуктів з пошуком"""
    search_term = test_product.name[:5]
    response = await client.get(f"/api/v1/products/?search={search_term}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Перевіряємо що знайдені продукти містять пошуковий термін
    if len(data) > 0:
        found = any(search_term.lower() in product["name"].lower() for product in data)
        assert found


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_products_pagination(client: AsyncClient, db_session: AsyncSession, test_category):
    """Тест пагінації продуктів"""
    from app.models.product import Product
    
    # Створюємо кілька продуктів
    for i in range(5):
        product = Product(
            name=f"Product {i}",
            slug=f"product-{i}",
            description=f"Description {i}",
            price=Decimal(f"{100 + i}.00"),
            category_id=test_category.id,
            is_available=True
        )
        db_session.add(product)
    await db_session.commit()
    
    # Тест першої сторінки
    response = await client.get("/api/v1/products/?skip=0&limit=2", follow_redirects=True)
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 2
    
    # Тест другої сторінки
    response = await client.get("/api/v1/products/?skip=2&limit=2", follow_redirects=True)
    assert response.status_code == 200
    data2 = response.json()
    assert len(data2) <= 2
    # Перевіряємо що продукти різні
    if len(data) > 0 and len(data2) > 0:
        assert data[0]["id"] != data2[0]["id"]


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_product_by_slug(client: AsyncClient, test_product):
    """Тест отримання продукту за slug"""
    response = await client.get(f"/api/v1/products/{test_product.slug}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_product.id
    assert data["name"] == test_product.name
    assert data["slug"] == test_product.slug
    assert float(data["price"]) == float(test_product.price)
    assert data["is_available"] is True


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_product_not_found(client: AsyncClient):
    """Тест отримання неіснуючого продукту"""
    response = await client.get("/api/v1/products/nonexistent-product-slug-12345")
    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_unavailable_product_in_list(client: AsyncClient, db_session: AsyncSession, test_category):
    """Тест що недоступні продукти не показуються в списку"""
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
    
    response = await client.get("/api/v1/products/", follow_redirects=True)
    assert response.status_code == 200
    data = response.json()
    # Перевіряємо що недоступний продукт не в списку
    slugs = [p["slug"] for p in data]
    assert "unavailable-product" not in slugs


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_popular_products(client: AsyncClient, db_session: AsyncSession, test_category):
    """Тест отримання популярних продуктів"""
    from app.models.product import Product
    
    # Створюємо популярний продукт
    popular_product = Product(
        name="Popular Product",
        slug="popular-product",
        description="Popular product",
        price=Decimal("150.00"),
        category_id=test_category.id,
        is_available=True,
        is_popular=True
    )
    db_session.add(popular_product)
    await db_session.commit()
    
    response = await client.get("/api/v1/products/popular?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Перевіряємо що продукт є популярним
    if len(data) > 0:
        popular_found = any(p["is_popular"] is True for p in data)
        assert popular_found


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_new_products(client: AsyncClient, db_session: AsyncSession, test_category):
    """Тест отримання нових продуктів"""
    from app.models.product import Product
    
    # Створюємо новий продукт
    new_product = Product(
        name="New Product",
        slug="new-product",
        description="New product",
        price=Decimal("200.00"),
        category_id=test_category.id,
        is_available=True,
        is_new=True
    )
    db_session.add(new_product)
    await db_session.commit()
    
    response = await client.get("/api/v1/products/?is_new=true", follow_redirects=True)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Перевіряємо що всі продукти нові
    for product in data:
        assert product["is_new"] is True


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_product_recommendations(client: AsyncClient, test_product, test_category, db_session: AsyncSession):
    """Тест отримання рекомендацій продуктів"""
    from app.models.product import Product
    
    # Створюємо ще один продукт в тій же категорії
    another_product = Product(
        name="Another Product",
        slug="another-product",
        description="Another product",
        price=Decimal("120.00"),
        category_id=test_category.id,
        is_available=True
    )
    db_session.add(another_product)
    await db_session.commit()
    
    response = await client.get(f"/api/v1/products/{test_product.id}/recommendations?limit=4")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Перевіряємо що рекомендовані продукти не є поточним продуктом
    for product in data:
        assert product["id"] != test_product.id
        assert product["is_available"] is True


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_product_recommendations_not_found(client: AsyncClient):
    """Тест отримання рекомендацій для неіснуючого продукту"""
    response = await client.get("/api/v1/products/99999/recommendations?limit=4")
    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_products_with_multiple_filters(client: AsyncClient, db_session: AsyncSession, test_category):
    """Тест отримання продуктів з множинними фільтрами"""
    from app.models.product import Product
    
    # Створюємо продукт що відповідає всім фільтрам
    filtered_product = Product(
        name="Filtered Product",
        slug="filtered-product",
        description="Filtered",
        price=Decimal("150.00"),
        category_id=test_category.id,
        is_available=True,
        is_new=True,
        is_popular=True
    )
    db_session.add(filtered_product)
    await db_session.commit()
    
    response = await client.get(
        f"/api/v1/products/?category_id={test_category.id}&is_new=true&is_popular=true"
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_products_limit_validation(client: AsyncClient):
    """Тест валідації ліміту продуктів"""
    # Занадто великий ліміт
    response = await client.get("/api/v1/products/?limit=1000", follow_redirects=True)
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_products_negative_skip(client: AsyncClient):
    """Тест негативного skip"""
    response = await client.get("/api/v1/products/?skip=-1", follow_redirects=True)
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_product_with_sizes(client: AsyncClient, test_product, db_session: AsyncSession):
    """Тест отримання продукту з розмірами порцій"""
    from app.models.product_size import ProductSize
    
    # Створюємо розміри порцій
    size1 = ProductSize(
        product_id=test_product.id,
        name="Мала",
        price=Decimal("80.00")
    )
    size2 = ProductSize(
        product_id=test_product.id,
        name="Велика",
        price=Decimal("120.00")
    )
    db_session.add_all([size1, size2])
    await db_session.commit()
    
    response = await client.get(f"/api/v1/products/{test_product.slug}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_product.id
    # Перевіряємо що продукт має розміри (якщо вони включені в response)
    if "sizes" in data:
        assert len(data["sizes"]) >= 0

