"""Pytest configuration and shared fixtures"""
import pytest
import os

# Встановлюємо змінні оточення для тестів ПЕРЕД імпортом app
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["CELERY_BROKER_URL"] = "redis://localhost:6379/0"
os.environ["CELERY_RESULT_BACKEND"] = "redis://localhost:6379/0"

import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app.core.security import get_password_hash
from app.models.user import User


# Тестова база даних (in-memory SQLite для швидкості)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Створюємо async engine для тестів
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False
)

# Створюємо async session factory для тестів
TestingSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Створює event loop для тестів"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Створює тестову сесію БД"""
    # Створюємо всі таблиці
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Створюємо сесію
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()
    
    # Очищаємо таблиці після тесту
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Створює тестовий HTTP клієнт"""
    async def override_get_db():
        yield db_session
    
    # Замінюємо dependency get_db на тестову сесію
    app.dependency_overrides[get_db] = override_get_db
    
    # Використовуємо ASGITransport для FastAPI app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    
    # Очищаємо overrides
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Створює тестового користувача"""
    user = User(
        phone="+380501234567",
        email="test@example.com",
        name="Test User",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True,
        is_admin=False
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_admin_user(db_session: AsyncSession) -> User:
    """Створює тестового адміністратора"""
    admin = User(
        phone="+380509999999",
        email="admin@example.com",
        name="Admin User",
        hashed_password=get_password_hash("adminpassword123"),
        is_active=True,
        is_admin=True
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin


@pytest.fixture
async def test_category(db_session: AsyncSession):
    """Створює тестову категорію"""
    from app.models.category import Category
    
    category = Category(
        name="Test Category",
        slug="test-category",
        description="Test category description",
        is_active=True
    )
    db_session.add(category)
    await db_session.commit()
    await db_session.refresh(category)
    return category


@pytest.fixture
async def test_product(db_session: AsyncSession, test_category):
    """Створює тестовий продукт"""
    from app.models.product import Product
    from decimal import Decimal
    
    product = Product(
        name="Test Product",
        slug="test-product",
        description="Test product description",
        price=Decimal("100.00"),
        category_id=test_category.id,
        is_available=True
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    return product


@pytest.fixture
async def authenticated_client(client: AsyncClient, test_user) -> AsyncClient:
    """Створює автентифікований клієнт"""
    from app.core.security import create_access_token
    
    token = create_access_token(data={"sub": str(test_user.id)})
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


@pytest.fixture
async def admin_client(client: AsyncClient, test_admin_user) -> AsyncClient:
    """Створює автентифікований клієнт для адміна"""
    from app.core.security import create_access_token
    
    token = create_access_token(data={"sub": str(test_admin_user.id)})
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client

    return client


@pytest.fixture(autouse=True)
def mock_redis(monkeypatch):
    """Mock Redis client for all tests"""
    from unittest.mock import MagicMock
    
    mock_redis_client = MagicMock()
    # Mock basic Redis methods
    mock_redis_client.get.return_value = None
    mock_redis_client.set.return_value = True
    mock_redis_client.setex.return_value = True
    mock_redis_client.delete.return_value = True
    mock_redis_client.incr.return_value = 1
    mock_redis_client.pipeline.return_value = MagicMock()
    
    def mock_from_url(*args, **kwargs):
        return mock_redis_client
        
    monkeypatch.setattr("redis.from_url", mock_from_url)
    return mock_redis_client

@pytest.fixture(autouse=True)
async def clear_redis():
    """Очищає Redis перед кожним тестом (mocked)"""
    pass
