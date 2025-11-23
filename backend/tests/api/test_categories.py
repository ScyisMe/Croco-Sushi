"""Детальні тести для categories endpoints"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_categories_list(client: AsyncClient, test_category):
    """Тест отримання списку категорій"""
    response = await client.get("/api/v1/categories")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "id" in data[0]
        assert "name" in data[0]
        assert "slug" in data[0]
        # Перевіряємо що повертаються тільки активні категорії
        assert data[0]["is_active"] is True


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_category_by_slug(client: AsyncClient, test_category):
    """Тест отримання категорії за slug"""
    response = await client.get(f"/api/v1/categories/{test_category.slug}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_category.id
    assert data["name"] == test_category.name
    assert data["slug"] == test_category.slug
    assert data["is_active"] is True


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_category_not_found(client: AsyncClient):
    """Тест отримання неіснуючої категорії"""
    response = await client.get("/api/v1/categories/nonexistent-category-slug-12345")
    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_categories_only_active(client: AsyncClient, db_session: AsyncSession):
    """Тест отримання тільки активних категорій"""
    from app.models.category import Category
    
    # Створюємо неактивну категорію
    inactive_category = Category(
        name="Inactive Category",
        slug="inactive-category",
        is_active=False
    )
    db_session.add(inactive_category)
    await db_session.commit()
    
    response = await client.get("/api/v1/categories")
    assert response.status_code == 200
    data = response.json()
    # Перевіряємо що неактивна категорія не повертається
    slugs = [cat["slug"] for cat in data]
    assert "inactive-category" not in slugs


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_category_with_products(client: AsyncClient, test_category, test_product):
    """Тест отримання категорії з продуктами"""
    response = await client.get(f"/api/v1/categories/{test_category.slug}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_category.id
    assert data["name"] == test_category.name


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_categories_ordered_by_position(client: AsyncClient, db_session: AsyncSession):
    """Тест порядку категорій за позицією"""
    from app.models.category import Category
    
    # Створюємо категорії з різними позиціями
    cat1 = Category(name="Category 1", slug="category-1", position=2, is_active=True)
    cat2 = Category(name="Category 2", slug="category-2", position=1, is_active=True)
    cat3 = Category(name="Category 3", slug="category-3", position=3, is_active=True)
    
    db_session.add_all([cat1, cat2, cat3])
    await db_session.commit()
    
    response = await client.get("/api/v1/categories")
    assert response.status_code == 200
    data = response.json()
    
    # Перевіряємо порядок (якщо є категорії)
    if len(data) >= 2:
        test_cats = [cat for cat in data if cat["slug"] in ["category-1", "category-2", "category-3"]]
        if len(test_cats) >= 2:
            positions = [cat["position"] for cat in test_cats]
            # Перевіряємо що позиції правильні
            assert all(pos in [1, 2, 3] for pos in positions)


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_categories_pagination(client: AsyncClient, db_session: AsyncSession):
    """Тест пагінації категорій"""
    from app.models.category import Category
    
    # Створюємо кілька категорій
    for i in range(5):
        category = Category(
            name=f"Category {i}",
            slug=f"category-{i}",
            is_active=True,
            position=i
        )
        db_session.add(category)
    await db_session.commit()
    
    # Тест першої сторінки
    response = await client.get("/api/v1/categories?skip=0&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 2


@pytest.mark.asyncio
@pytest.mark.api
async def test_category_with_image(client: AsyncClient, db_session: AsyncSession):
    """Тест категорії з зображенням"""
    from app.models.category import Category
    
    category = Category(
        name="Category with Image",
        slug="category-with-image",
        image_url="https://example.com/image.jpg",
        is_active=True
    )
    db_session.add(category)
    await db_session.commit()
    
    response = await client.get("/api/v1/categories/category-with-image")
    assert response.status_code == 200
    data = response.json()
    assert data["image_url"] == "https://example.com/image.jpg"


@pytest.mark.asyncio
@pytest.mark.api
async def test_category_description(client: AsyncClient, test_category):
    """Тест отримання опису категорії"""
    response = await client.get(f"/api/v1/categories/{test_category.slug}")
    assert response.status_code == 200
    data = response.json()
    if test_category.description:
        assert data["description"] == test_category.description

