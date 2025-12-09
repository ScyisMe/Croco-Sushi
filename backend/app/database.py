"""Database configuration and session management."""
import asyncio
import logging
from typing import Optional

import sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

logger = logging.getLogger(__name__)


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
        # БЕЗПЕКА: echo=False в production для запобігання витоку чутливих даних
        # Використовуємо змінну оточення або налаштування для контролю логування
        echo_sql = getattr(settings, 'ECHO_SQL', False)  # За замовчуванням False
        
        _engine = create_async_engine(
            settings.DATABASE_URL,
            echo=echo_sql,
            pool_pre_ping=True,
            pool_size=settings.POSTGRES_POOL_SIZE,
            max_overflow=settings.POSTGRES_MAX_OVERFLOW,
            pool_timeout=settings.POSTGRES_POOL_TIMEOUT,
            connect_args={
                "timeout": settings.POSTGRES_CONNECT_TIMEOUT,
                "command_timeout": settings.POSTGRES_COMMAND_TIMEOUT,
                "server_settings": {
                    "jit": "off",  # Optimization for simple queries
                    "application_name": settings.PROJECT_NAME
                }
            }
        )
    return _engine


async def check_db_connection() -> bool:
    """Check database connection with retries.
    
    Returns:
        True if connection successful, raises exception otherwise.
    """
    max_retries = 5
    retry_interval = 2
    
    for attempt in range(max_retries):
        try:
            engine = get_engine()
            async with engine.connect() as conn:
                await conn.execute(sqlalchemy.text("SELECT 1"))
            logger.info("Database connection established successfully")
            return True
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt + 1}/{max_retries} failed: {str(e)}")
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_interval)
            else:
                logger.error("Could not establish database connection after multiple retries")
                raise e
    
    return False  # Should never reach here, but for type safety


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
    """Lazy engine wrapper for backwards compatibility."""
    
    def __call__(self):
        return get_engine()
    
    def __getattr__(self, name):
        return getattr(get_engine(), name)


class LazySessionLocal:
    """Lazy session local wrapper for backwards compatibility."""
    
    def __call__(self):
        return get_async_session_local()
    
    def __getattr__(self, name):
        return getattr(get_async_session_local(), name)


# Створюємо об'єкти для зворотної сумісності
engine = LazyEngine()
AsyncSessionLocal = LazySessionLocal()


async def get_db() -> AsyncSession:
    """Dependency для отримання сесії БД.
    
    Yields:
        AsyncSession: Database session for the request.
        
    Note:
        - Commits on success
        - Rolls back on exception
        - Always closes the session
    """
    session_local = get_async_session_local()
    async with session_local() as session:
        try:
            yield session
            # Комітимо ТІЛЬКИ якщо не було виключень
            await session.commit()
        except Exception:
            await session.rollback()
            # Прокидаємо помилку далі, щоб FastAPI знав про неї
            raise
        finally:
            await session.close()
