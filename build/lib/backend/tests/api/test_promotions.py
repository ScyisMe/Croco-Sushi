"""Детальні тести для promotions endpoints"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from decimal import Decimal


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_promotions_list(client: AsyncClient, db_session: AsyncSession):
    """Тест отримання списку активних акцій"""
    from app.models.promotion import Promotion
    
    # Створюємо активну акцію
    now = datetime.now(timezone.utc)
    promotion = Promotion(
        title="Test Promotion",
        slug="test-promotion",
        description="Test promotion description",
        discount_type="percent",
        discount_value=Decimal("10.00"),
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=1),
        is_active=True
    )
    db_session.add(promotion)
    await db_session.commit()
    
    response = await client.get("/api/v1/promotions/", follow_redirects=True)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "title" in data[0]
        assert "slug" in data[0]
        assert "is_available" in data[0]


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_promotion_by_slug(client: AsyncClient, db_session: AsyncSession):
    """Тест отримання акції за slug"""
    from app.models.promotion import Promotion
    
    now = datetime.now(timezone.utc)
    promotion = Promotion(
        title="Special Promotion",
        slug="special-promotion",
        description="Special promotion",
        discount_type="percent",
        discount_value=Decimal("20.00"),
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=1),
        is_active=True
    )
    db_session.add(promotion)
    await db_session.commit()
    
    response = await client.get("/api/v1/promotions/special-promotion")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "special-promotion"
    assert data["title"] == "Special Promotion"
    assert data["discount_type"] == "percent"
    assert float(data["discount_value"]) == 20.00


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_promotion_not_found(client: AsyncClient):
    """Тест отримання неіснуючої акції"""
    response = await client.get("/api/v1/promotions/nonexistent-promotion-slug-12345")
    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_expired_promotion(client: AsyncClient, db_session: AsyncSession):
    """Тест що закінчені акції не показуються"""
    from app.models.promotion import Promotion
    
    now = datetime.now(timezone.utc)
    expired_promotion = Promotion(
        title="Expired Promotion",
        slug="expired-promotion",
        description="Expired",
        discount_type="percent",
        discount_value=Decimal("10.00"),
        start_date=now - timedelta(days=10),
        end_date=now - timedelta(days=1),  # Завершилася вчора
        is_active=True
    )
    db_session.add(expired_promotion)
    await db_session.commit()
    
    response = await client.get("/api/v1/promotions/", follow_redirects=True)
    assert response.status_code == 200
    data = response.json()
    # Перевіряємо що закінчена акція не в списку
    slugs = [p["slug"] for p in data]
    assert "expired-promotion" not in slugs


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_future_promotion(client: AsyncClient, db_session: AsyncSession):
    """Тест що майбутні акції не показуються"""
    from app.models.promotion import Promotion
    
    now = datetime.now(timezone.utc)
    future_promotion = Promotion(
        title="Future Promotion",
        slug="future-promotion",
        description="Future",
        discount_type="percent",
        discount_value=Decimal("10.00"),
        start_date=now + timedelta(days=1),  # Починається завтра
        end_date=now + timedelta(days=10),
        is_active=True
    )
    db_session.add(future_promotion)
    await db_session.commit()
    
    response = await client.get("/api/v1/promotions/", follow_redirects=True)
    assert response.status_code == 200
    data = response.json()
    # Перевіряємо що майбутня акція не в списку
    slugs = [p["slug"] for p in data]
    assert "future-promotion" not in slugs


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_promotion_max_uses(client: AsyncClient, db_session: AsyncSession):
    """Тест акції з обмеженою кількістю використань"""
    from app.models.promotion import Promotion
    
    now = datetime.now(timezone.utc)
    limited_promotion = Promotion(
        title="Limited Promotion",
        slug="limited-promotion",
        description="Limited",
        discount_type="percent",
        discount_value=Decimal("15.00"),
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=1),
        max_uses=5,
        current_uses=5,  # Досягнуто максимум
        is_active=True
    )
    db_session.add(limited_promotion)
    await db_session.commit()
    
    response = await client.get("/api/v1/promotions/limited-promotion")
    assert response.status_code == 200
    data = response.json()
    assert data["is_available"] is False  # Недоступна через max_uses


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_promotions_by_category(client: AsyncClient, db_session: AsyncSession, test_category):
    """Тест отримання акцій по категорії"""
    from app.models.promotion import Promotion
    
    now = datetime.now(timezone.utc)
    category_promotion = Promotion(
        title="Category Promotion",
        slug="category-promotion",
        description="Category promo",
        discount_type="percent",
        discount_value=Decimal("10.00"),
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=1),
        category_id=test_category.id,
        is_active=True
    )
    db_session.add(category_promotion)
    await db_session.commit()
    
    response = await client.get(f"/api/v1/promotions/?category_id={test_category.id}", follow_redirects=True)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        found = any(p["category_id"] == test_category.id for p in data)
        assert found


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_promotions_by_product(client: AsyncClient, db_session: AsyncSession, test_product):
    """Тест отримання акцій по товару"""
    from app.models.promotion import Promotion
    
    now = datetime.now(timezone.utc)
    product_promotion = Promotion(
        title="Product Promotion",
        slug="product-promotion",
        description="Product promo",
        discount_type="percent",
        discount_value=Decimal("15.00"),
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=1),
        product_id=test_product.id,
        is_active=True
    )
    db_session.add(product_promotion)
    await db_session.commit()
    
    response = await client.get(f"/api/v1/promotions/?product_id={test_product.id}", follow_redirects=True)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        found = any(p.get("product_id") == test_product.id for p in data)
        assert found


@pytest.mark.asyncio
@pytest.mark.api
async def test_promotions_pagination(client: AsyncClient, db_session: AsyncSession):
    """Тест пагінації акцій"""
    from app.models.promotion import Promotion
    
    now = datetime.now(timezone.utc)
    # Створюємо кілька акцій
    for i in range(5):
        promotion = Promotion(
            title=f"Promotion {i}",
            slug=f"promotion-{i}",
            description=f"Promo {i}",
            discount_type="percent",
            discount_value=Decimal("10.00"),
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=1),
            is_active=True
        )
        db_session.add(promotion)
    await db_session.commit()
    
    response = await client.get("/api/v1/promotions/?skip=0&limit=2", follow_redirects=True)
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 2


@pytest.mark.asyncio
@pytest.mark.api
async def test_inactive_promotion_not_shown(client: AsyncClient, db_session: AsyncSession):
    """Тест що неактивні акції не показуються"""
    from app.models.promotion import Promotion
    
    now = datetime.now(timezone.utc)
    inactive_promotion = Promotion(
        title="Inactive Promotion",
        slug="inactive-promotion",
        description="Inactive",
        discount_type="percent",
        discount_value=Decimal("10.00"),
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=1),
        is_active=False  # Неактивна
    )
    db_session.add(inactive_promotion)
    await db_session.commit()
    
    response = await client.get("/api/v1/promotions/", follow_redirects=True)
    assert response.status_code == 200
    data = response.json()
    slugs = [p["slug"] for p in data]
    assert "inactive-promotion" not in slugs
