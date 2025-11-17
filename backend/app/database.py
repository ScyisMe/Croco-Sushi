from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings
from typing import Optional

# Базовий клас для моделей (SQLAlchemy 2.0 style)
class Base(DeclarativeBase):
    pass

# Змінні для engine та сесій (створюються при першому використанні)
_engine: Optional[any] = None
_AsyncSessionLocal: Optional[any] = None


def get_engine():
    """Отримання асинхронного движка (створюється при першому виклику)"""
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            settings.DATABASE_URL,
            echo=True,  # Логування SQL запитів (вимкнути в production)
            pool_pre_ping=True,  # Перевірка з'єднання перед використанням
            pool_size=10,
            max_overflow=20,
        )
    return _engine


def get_async_session_local():
    """Отримання фабрики сесій (створюється при першому виклику)"""
    global _AsyncSessionLocal
    if _AsyncSessionLocal is None:
        _AsyncSessionLocal = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    return _AsyncSessionLocal


# Для зворотної сумісності - створюємо об'єкти, які будуть ініціалізовані при використанні
class LazyEngine:
    """Lazy engine wrapper"""
    def __call__(self):
        return get_engine()
    
    def __getattr__(self, name):
        return getattr(get_engine(), name)


class LazySessionLocal:
    """Lazy session local wrapper"""
    def __call__(self):
        return get_async_session_local()
    
    def __getattr__(self, name):
        return getattr(get_async_session_local(), name)


# Створюємо об'єкти для зворотної сумісності
engine = LazyEngine()
AsyncSessionLocal = LazySessionLocal()


async def get_db() -> AsyncSession:
    """Dependency для отримання сесії БД"""
    session_local = get_async_session_local()
    async with session_local() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
