"""Детальні тести для reviews endpoints"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal

from app.models.review import Review
from app.models.order import Order, OrderItem
from app.models.address import Address


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_reviews_list(client: AsyncClient, db_session: AsyncSession, test_user, test_product):
    """Тест отримання списку відгуків"""
    # Створюємо опублікований відгук
    review = Review(
        user_id=test_user.id,
        product_id=test_product.id,
        rating=5,
        comment="Great product!",
        is_published=True
    )
    db_session.add(review)
    await db_session.commit()
    
    response = await client.get("/api/v1/reviews/", follow_redirects=True)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "rating" in data[0]
        assert "comment" in data[0]
        assert "user_name" in data[0] or "user" in data[0]


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_reviews_by_product(client: AsyncClient, db_session: AsyncSession, test_user, test_product):
    """Тест отримання відгуків по товару"""
    # Створюємо відгук
    review = Review(
        user_id=test_user.id,
        product_id=test_product.id,
        rating=4,
        comment="Good product",
        is_published=True
    )
    db_session.add(review)
    await db_session.commit()
    
    response = await client.get(f"/api/v1/reviews/product/{test_product.id}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for rev in data:
        assert rev["product_id"] == test_product.id


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_reviews_by_rating(client: AsyncClient, db_session: AsyncSession, test_user, test_product):
    """Тест отримання відгуків по рейтингу"""
    # Створюємо відгуки з різними рейтингами
    review5 = Review(
        user_id=test_user.id,
        product_id=test_product.id,
        rating=5,
        comment="Excellent",
        is_published=True
    )
    review4 = Review(
        user_id=test_user.id,
        product_id=test_product.id,
        rating=4,
        comment="Good",
        is_published=True
    )
    db_session.add_all([review5, review4])
    await db_session.commit()
    
    response = await client.get(f"/api/v1/reviews?rating=5", follow_redirects=True)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for rev in data:
        assert rev["rating"] == 5


@pytest.mark.asyncio
@pytest.mark.api
async def test_create_review_authenticated(authenticated_client: AsyncClient, test_user, test_product, db_session: AsyncSession):
    """Тест створення відгуку з авторизацією"""
    # Створюємо замовлення
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
        order_number="TEST-REVIEW",
        status="completed",
        total_amount=Decimal("100.00"),
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
        quantity=1,
        price=Decimal("100.00")
    )
    db_session.add(order_item)
    await db_session.commit()
    
    response = await authenticated_client.post(
        "/api/v1/reviews/",
        json={
            "order_id": order.id,
            "product_id": test_product.id,
            "rating": 5,
            "comment": "Great product!"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["rating"] == 5
    assert data["comment"] == "Great product!"
    assert data["product_id"] == test_product.id
    assert data["order_id"] == order.id


@pytest.mark.asyncio
@pytest.mark.api
async def test_create_review_duplicate(authenticated_client: AsyncClient, test_user, test_product, db_session: AsyncSession):
    """Тест створення дубльованого відгуку"""
    from app.models.address import Address
    from app.models.order import Order, OrderItem
    
    # Створюємо замовлення
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
        order_number="TEST-DUPLICATE",
        status="completed",
        total_amount=Decimal("100.00"),
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
        quantity=1,
        price=Decimal("100.00")
    )
    db_session.add(order_item)
    await db_session.commit()
    
    # Створюємо перший відгук
    review1 = Review(
        user_id=test_user.id,
        order_id=order.id,
        product_id=test_product.id,
        rating=5,
        comment="First review",
        is_published=False
    )
    db_session.add(review1)
    await db_session.commit()
    
    # Спробуємо створити другий відгук на те ж замовлення
    response = await authenticated_client.post(
        "/api/v1/reviews/",
        json={
            "order_id": order.id,
            "product_id": test_product.id,
            "rating": 4,
            "comment": "Second review"
        }
    )
    assert response.status_code == 400
    detail = response.json()["detail"].lower()
    assert "вже" in detail or "already" in detail


@pytest.mark.asyncio
@pytest.mark.api
async def test_create_review_invalid_rating(authenticated_client: AsyncClient, test_product):
    """Тест створення відгуку з невалідним рейтингом"""
    response = await authenticated_client.post(
        "/api/v1/reviews/",
        json={
            "product_id": test_product.id,
            "rating": 10,  # Більше 5
            "comment": "Test"
        }
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
@pytest.mark.api
async def test_get_my_reviews(authenticated_client: AsyncClient, test_user, test_product, db_session: AsyncSession):
    """Тест отримання моїх відгуків"""
    # Створюємо відгук
    review = Review(
        user_id=test_user.id,
        product_id=test_product.id,
        rating=5,
        comment="My review",
        is_published=False
    )
    db_session.add(review)
    await db_session.commit()
    
    response = await authenticated_client.get("/api/v1/reviews/me")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["user_id"] == test_user.id


@pytest.mark.asyncio
@pytest.mark.api
async def test_update_my_review(authenticated_client: AsyncClient, test_user, test_product, db_session: AsyncSession):
    """Тест оновлення мого відгуку"""
    # Створюємо відгук
    review = Review(
        user_id=test_user.id,
        product_id=test_product.id,
        rating=3,
        comment="Initial review",
        is_published=False
    )
    db_session.add(review)
    await db_session.commit()
    await db_session.refresh(review)
    
    response = await authenticated_client.put(
        f"/api/v1/reviews/me/{review.id}",
        json={
            "rating": 5,
            "comment": "Updated review"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["rating"] == 5
    assert data["comment"] == "Updated review"


@pytest.mark.asyncio
@pytest.mark.api
async def test_update_published_review(authenticated_client: AsyncClient, test_user, test_product, db_session: AsyncSession):
    """Тест оновлення опублікованого відгуку"""
    # Створюємо опублікований відгук
    review = Review(
        user_id=test_user.id,
        product_id=test_product.id,
        rating=5,
        comment="Published review",
        is_published=True
    )
    db_session.add(review)
    await db_session.commit()
    await db_session.refresh(review)
    
    response = await authenticated_client.put(
        f"/api/v1/reviews/me/{review.id}",
        json={
            "rating": 4,
            "comment": "Updated"
        }
    )
    # Може бути 400 якщо не дозволяється редагувати опубліковані відгуки
    assert response.status_code in [200, 400]


@pytest.mark.asyncio
@pytest.mark.api
async def test_delete_my_review(authenticated_client: AsyncClient, test_user, test_product, db_session: AsyncSession):
    """Тест видалення мого відгуку"""
    # Створюємо відгук
    review = Review(
        user_id=test_user.id,
        product_id=test_product.id,
        rating=5,
        comment="To be deleted",
        is_published=False
    )
    db_session.add(review)
    await db_session.commit()
    await db_session.refresh(review)
    
    review_id = review.id
    
    response = await authenticated_client.delete(f"/api/v1/reviews/me/{review_id}")
    assert response.status_code == 204
    
    # Перевіряємо що відгук видалено
    from sqlalchemy import select
    result = await db_session.execute(select(Review).where(Review.id == review_id))
    deleted_review = result.scalar_one_or_none()
    assert deleted_review is None


@pytest.mark.asyncio
@pytest.mark.api
async def test_delete_others_review(authenticated_client: AsyncClient, db_session: AsyncSession, test_product):
    """Тест видалення відгуку іншого користувача"""
    from app.models.user import User
    from app.core.security import get_password_hash
    
    # Створюємо іншого користувача
    other_user = User(
        phone="+380509999997",
        email="other2@example.com",
        name="Other User",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        is_admin=False
    )
    db_session.add(other_user)
    await db_session.flush()
    
    # Створюємо відгук іншого користувача
    review = Review(
        user_id=other_user.id,
        product_id=test_product.id,
        rating=5,
        comment="Other user's review",
        is_published=False
    )
    db_session.add(review)
    await db_session.commit()
    await db_session.refresh(review)
    
    # Спробуємо видалити відгук іншого користувача
    response = await authenticated_client.delete(f"/api/v1/reviews/me/{review.id}")
    assert response.status_code == 404  # Не знайдено (бо це не наш відгук)


@pytest.mark.asyncio
@pytest.mark.api
async def test_create_review_without_order_or_product(authenticated_client: AsyncClient):
    """Тест створення відгуку без order_id і product_id"""
    response = await authenticated_client.post(
        "/api/v1/reviews/",
        json={
            "rating": 5,
            "comment": "Review without order or product"
        }
    )
    assert response.status_code == 400
    detail = response.json()["detail"].lower()
    assert "order_id" in detail or "product_id" in detail or "потрібно" in detail


@pytest.mark.asyncio
@pytest.mark.api
async def test_reviews_pagination(client: AsyncClient, db_session: AsyncSession, test_user, test_product):
    """Тест пагінації відгуків"""
    # Створюємо кілька відгуків
    for i in range(5):
        review = Review(
            user_id=test_user.id,
            product_id=test_product.id,
            rating=5,
            comment=f"Review {i}",
            is_published=True
        )
        db_session.add(review)
    await db_session.commit()
    
    response = await client.get("/api/v1/reviews?skip=0&limit=2", follow_redirects=True)
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 2

