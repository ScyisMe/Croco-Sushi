import asyncio
import sys
from logging.config import fileConfig
from pathlib import Path
import platform

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Виправлення для Windows: використовуємо правильний event loop policy
if platform.system() == "Windows":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Додаємо корінь проекту до sys.path
# alembic/env.py знаходиться в корені проекту, тому backend - це просто backend/
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if not backend_dir.exists():
    # Спробуємо альтернативний шлях
    backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
from app.database import Base
from app.models import (
    Category,
    Product,
    ProductSize,
    User,
    Address,
    Order,
    OrderItem,
    Review,
    Promotion
)

# Встановлюємо метадату для автогенерації міграцій
target_metadata = Base.metadata


def get_url():
    """Отримання URL БД з налаштувань"""
    from backend.app.core.config import settings
    return settings.DATABASE_URL

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the string to the
    script output.

    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Виконання міграцій через синхронне з'єднання"""
    context.configure(
        connection=connection, 
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()
    
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    try:
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
    finally:
        await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    try:
        # Створюємо новий event loop для Windows сумісності
        if platform.system() == "Windows":
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(run_async_migrations())
            finally:
                loop.close()
        else:
            asyncio.run(run_async_migrations())
    except Exception as e:
        print(f"Помилка підключення до бази даних: {e}")
        print("Переконайтеся, що PostgreSQL запущений і доступний.")
        raise


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
