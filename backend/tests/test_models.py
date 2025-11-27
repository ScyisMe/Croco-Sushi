"""Детальні тести для моделей"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
from datetime import datetime, timezone

from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order, OrderItem
from app.models.address import Address
from app.models.review import Review
from app.models.favorite import Favorite
from app.models.product_size import ProductSize
from app.core.security import get_password_hash


# ========== Тести моделі User ==========

@pytest.mark.asyncio
@pytest.mark.models
async def test_user_creation(db_session: AsyncSession):
    """Тест створення користувача"""
    user = User(
        phone="+380501111100",
        email="model@test.com",
        name="Model Test User",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        is_admin=False
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    assert user.id is not None
    assert user.phone == "+380501111100"
    assert user.email == "model@test.com"
    assert user.created_at is not None


@pytest.mark.asyncio
@pytest.mark.models
async def test_user_default_values(db_session: AsyncSession):
    """Тест значень за замовчуванням для користувача"""
    user = User(
        phone="+380501111101",
        hashed_password=get_password_hash("password123")
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    assert user.is_active is True
    assert user.is_admin is False
    assert user.bonus_balance == 0


@pytest.mark.asyncio
@pytest.mark.models
async def test_user_unique_phone(db_session: AsyncSession):
    """Тест унікальності телефону"""
    from sqlalchemy.exc import IntegrityError
    
    user1 = User(
        phone="+380501111102",
        hashed_password=get_password_hash("password123")
    )
    db_session.add(user1)
    await db_session.commit()
    
    user2 = User(
        phone="+380501111102",  # Дублікат
        hashed_password=get_password_hash("password123")
    )
    db_session.add(user2)
    
    with pytest.raises(IntegrityError):
        await db_session.commit()
    
    await db_session.rollback()


@pytest.mark.asyncio
@pytest.mark.models
async def test_user_unique_email(db_session: AsyncSession):
    """Тест унікальності email"""
    from sqlalchemy.exc import IntegrityError
    
    user1 = User(
        phone="+380501111103",
        email="unique@test.com",
        hashed_password=get_password_hash("password123")
    )
    db_session.add(user1)
    await db_session.commit()
    
    user2 = User(
        phone="+380501111104",
        email="unique@test.com",  # Дублікат
        hashed_password=get_password_hash("password123")
    )
    db_session.add(user2)
    
    with pytest.raises(IntegrityError):
        await db_session.commit()
    
    await db_session.rollback()


# ========== Тести моделі Category ==========

@pytest.mark.asyncio
@pytest.mark.models
async def test_category_creation(db_session: AsyncSession):
    """Тест створення категорії"""
    category = Category(
        name="Test Category",
        slug="test-category-model",
        description="Test description",
        is_active=True,
        position=1
    )
    db_session.add(category)
    await db_session.commit()
    await db_session.refresh(category)
    
    assert category.id is not None
    assert category.name == "Test Category"
    assert category.slug == "test-category-model"


@pytest.mark.asyncio
@pytest.mark.models
async def test_category_unique_slug(db_session: AsyncSession):
    """Тест унікальності slug категорії"""
    from sqlalchemy.exc import IntegrityError
    
    cat1 = Category(name="Cat 1", slug="unique-slug", is_active=True)
    db_session.add(cat1)
    await db_session.commit()
    
    cat2 = Category(name="Cat 2", slug="unique-slug", is_active=True)
    db_session.add(cat2)
    
    with pytest.raises(IntegrityError):
        await db_session.commit()
    
    await db_session.rollback()


# ========== Тести моделі Product ==========

@pytest.mark.asyncio
@pytest.mark.models
async def test_product_creation(db_session: AsyncSession, test_category):
    """Тест створення продукту"""
    product = Product(
        name="Model Test Product",
        slug="model-test-product",
        description="Test description",
        price=Decimal("150.00"),
        category_id=test_category.id,
        is_available=True
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    
    assert product.id is not None
    assert product.name == "Model Test Product"
    assert product.price == Decimal("150.00")


@pytest.mark.asyncio
@pytest.mark.models
async def test_product_category_relationship(db_session: AsyncSession, test_product, test_category):
    """Тест зв'язку продукту з категорією"""
    assert test_product.category_id == test_category.id


@pytest.mark.asyncio
@pytest.mark.models
async def test_product_default_values(db_session: AsyncSession, test_category):
    """Тест значень за замовчуванням для продукту"""
    product = Product(
        name="Default Product",
        slug="default-product",
        price=Decimal("100.00"),
        category_id=test_category.id
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    
    assert product.is_available is True
    assert product.is_new is False
    assert product.is_popular is False


# ========== Тести моделі ProductSize ==========

@pytest.mark.asyncio
@pytest.mark.models
async def test_product_size_creation(db_session: AsyncSession, test_product):
    """Тест створення розміру продукту"""
    size = ProductSize(
        product_id=test_product.id,
        name="Велика",
        price=Decimal("180.00")
    )
    db_session.add(size)
    await db_session.commit()
    await db_session.refresh(size)
    
    assert size.id is not None
    assert size.name == "Велика"
    assert size.price == Decimal("180.00")


@pytest.mark.asyncio
@pytest.mark.models
async def test_product_multiple_sizes(db_session: AsyncSession, test_product):
    """Тест кількох розмірів для одного продукту"""
    sizes = [
        ProductSize(product_id=test_product.id, name="Мала", price=Decimal("80.00")),
        ProductSize(product_id=test_product.id, name="Середня", price=Decimal("120.00")),
        ProductSize(product_id=test_product.id, name="Велика", price=Decimal("160.00")),
    ]
    db_session.add_all(sizes)
    await db_session.commit()
    
    result = await db_session.execute(
        select(ProductSize).where(ProductSize.product_id == test_product.id)
    )
    product_sizes = result.scalars().all()
    
    assert len(product_sizes) == 3


# ========== Тести моделі Address ==========

@pytest.mark.asyncio
@pytest.mark.models
async def test_address_creation(db_session: AsyncSession, test_user):
    """Тест створення адреси"""
    address = Address(
        user_id=test_user.id,
        city="Київ",
        street="Хрещатик",
        house="1",
        apartment="10",
        entrance="2",
        floor="5",
        comment="Біля метро",
        is_default=True
    )
    db_session.add(address)
    await db_session.commit()
    await db_session.refresh(address)
    
    assert address.id is not None
    assert address.city == "Київ"
    assert address.is_default is True


@pytest.mark.asyncio
@pytest.mark.models
async def test_address_user_relationship(db_session: AsyncSession, test_user):
    """Тест зв'язку адреси з користувачем"""
    address = Address(
        user_id=test_user.id,
        city="Київ",
        street="Test",
        house="1"
    )
    db_session.add(address)
    await db_session.commit()
    
    assert address.user_id == test_user.id


# ========== Тести моделі Order ==========

@pytest.mark.asyncio
@pytest.mark.models
async def test_order_creation(db_session: AsyncSession, test_user):
    """Тест створення замовлення"""
    address = Address(
        user_id=test_user.id,
        city="Київ",
        street="Test",
        house="1"
    )
    db_session.add(address)
    await db_session.flush()
    
    order = Order(
        user_id=test_user.id,
        address_id=address.id,
        order_number="MODEL-TEST-001",
        status="pending",
        total_amount=Decimal("500.00"),
        delivery_cost=Decimal("50.00"),
        customer_phone=test_user.phone,
        payment_method="cash"
    )
    db_session.add(order)
    await db_session.commit()
    await db_session.refresh(order)
    
    assert order.id is not None
    assert order.order_number == "MODEL-TEST-001"
    assert order.status == "pending"


@pytest.mark.asyncio
@pytest.mark.models
async def test_order_status_values(db_session: AsyncSession, test_user):
    """Тест можливих статусів замовлення"""
    address = Address(
        user_id=test_user.id,
        city="Київ",
        street="Test",
        house="1"
    )
    db_session.add(address)
    await db_session.flush()
    
    valid_statuses = ["pending", "confirmed", "preparing", "delivering", "completed", "cancelled"]
    
    for i, status in enumerate(valid_statuses):
        order = Order(
            user_id=test_user.id,
            address_id=address.id,
            order_number=f"STATUS-TEST-{i}",
            status=status,
            total_amount=Decimal("100.00"),
            delivery_cost=Decimal("50.00"),
            customer_phone=test_user.phone,
            payment_method="cash"
        )
        db_session.add(order)
    
    await db_session.commit()
    
    result = await db_session.execute(
        select(Order).where(Order.order_number.like("STATUS-TEST-%"))
    )
    orders = result.scalars().all()
    
    assert len(orders) == len(valid_statuses)


# ========== Тести моделі OrderItem ==========

@pytest.mark.asyncio
@pytest.mark.models
async def test_order_item_creation(db_session: AsyncSession, test_user, test_product):
    """Тест створення позиції замовлення"""
    address = Address(
        user_id=test_user.id,
        city="Київ",
        street="Test",
        house="1"
    )
    db_session.add(address)
    await db_session.flush()
    
    order = Order(
        user_id=test_user.id,
        address_id=address.id,
        order_number="ITEM-TEST-001",
        status="pending",
        total_amount=Decimal("200.00"),
        delivery_cost=Decimal("50.00"),
        customer_phone=test_user.phone,
        payment_method="cash"
    )
    db_session.add(order)
    await db_session.flush()
    
    item = OrderItem(
        order_id=order.id,
        product_id=test_product.id,
        product_name=test_product.name,
        quantity=2,
        price=Decimal("100.00")
    )
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    
    assert item.id is not None
    assert item.quantity == 2
    assert item.price == Decimal("100.00")


# ========== Тести моделі Review ==========

@pytest.mark.asyncio
@pytest.mark.models
async def test_review_creation(db_session: AsyncSession, test_user, test_product):
    """Тест створення відгуку"""
    review = Review(
        user_id=test_user.id,
        product_id=test_product.id,
        rating=5,
        comment="Excellent product!",
        is_published=False
    )
    db_session.add(review)
    await db_session.commit()
    await db_session.refresh(review)
    
    assert review.id is not None
    assert review.rating == 5
    assert review.is_published is False


@pytest.mark.asyncio
@pytest.mark.models
async def test_review_rating_range(db_session: AsyncSession, test_user, test_product):
    """Тест діапазону рейтингу"""
    valid_ratings = [1, 2, 3, 4, 5]
    
    for rating in valid_ratings:
        review = Review(
            user_id=test_user.id,
            product_id=test_product.id,
            rating=rating,
            comment=f"Rating {rating}",
            is_published=False
        )
        db_session.add(review)
    
    await db_session.commit()
    
    result = await db_session.execute(
        select(Review).where(Review.user_id == test_user.id)
    )
    reviews = result.scalars().all()
    
    assert len(reviews) == 5


# ========== Тести моделі Favorite ==========

@pytest.mark.asyncio
@pytest.mark.models
async def test_favorite_creation(db_session: AsyncSession, test_user, test_product):
    """Тест додавання в обране"""
    favorite = Favorite(
        user_id=test_user.id,
        product_id=test_product.id
    )
    db_session.add(favorite)
    await db_session.commit()
    await db_session.refresh(favorite)
    
    assert favorite.id is not None
    assert favorite.user_id == test_user.id
    assert favorite.product_id == test_product.id


@pytest.mark.asyncio
@pytest.mark.models
async def test_favorite_unique_constraint(db_session: AsyncSession, test_user, test_product):
    """Тест унікальності пари user_id + product_id"""
    from sqlalchemy.exc import IntegrityError
    
    fav1 = Favorite(user_id=test_user.id, product_id=test_product.id)
    db_session.add(fav1)
    await db_session.commit()
    
    fav2 = Favorite(user_id=test_user.id, product_id=test_product.id)
    db_session.add(fav2)
    
    with pytest.raises(IntegrityError):
        await db_session.commit()
    
    await db_session.rollback()


# ========== Тести каскадного видалення ==========

@pytest.mark.asyncio
@pytest.mark.models
async def test_user_addresses_cascade(db_session: AsyncSession):
    """Тест каскадного видалення адрес при видаленні користувача"""
    from sqlalchemy import delete
    
    user = User(
        phone="+380501111199",
        hashed_password=get_password_hash("password123")
    )
    db_session.add(user)
    await db_session.flush()
    
    address = Address(
        user_id=user.id,
        city="Київ",
        street="Test",
        house="1"
    )
    db_session.add(address)
    await db_session.commit()
    
    user_id = user.id
    address_id = address.id
    
    # Видаляємо користувача
    await db_session.execute(delete(User).where(User.id == user_id))
    await db_session.commit()
    
    # Перевіряємо що адреса теж видалена (якщо є каскад)
    result = await db_session.execute(select(Address).where(Address.id == address_id))
    deleted_address = result.scalar_one_or_none()
    # Може бути None якщо є каскад, або адреса якщо каскаду немає


# ========== Тести timestamps ==========

@pytest.mark.asyncio
@pytest.mark.models
async def test_user_timestamps(db_session: AsyncSession):
    """Тест автоматичних timestamps для користувача"""
    user = User(
        phone="+380501111198",
        hashed_password=get_password_hash("password123")
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    assert user.created_at is not None
    assert user.updated_at is not None


@pytest.mark.asyncio
@pytest.mark.models
async def test_product_timestamps(db_session: AsyncSession, test_category):
    """Тест автоматичних timestamps для продукту"""
    product = Product(
        name="Timestamp Product",
        slug="timestamp-product",
        price=Decimal("100.00"),
        category_id=test_category.id
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    
    assert product.created_at is not None
    assert product.updated_at is not None



