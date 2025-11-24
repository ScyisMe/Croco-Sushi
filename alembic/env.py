import sys
import locale
import os

# ВАЖЛИВО: Встановлюємо локаль на C (ASCII) або UTF-8 ПЕРЕД усіма імпортами
# Windows за замовчуванням використовує Windows-1251 для української локалі,
# що викликає UnicodeDecodeError в psycopg2
# Див: https://stackoverflow.com/questions/42339876/error-unicodedecodeerror-utf-8-codec-cant-decode-byte-0xff-in-position-0-in
# Див: https://github.com/apache/superset/issues/29457
if sys.platform == 'win32':
    try:
        locale.setlocale(locale.LC_ALL, 'C')
    except locale.Error:
        try:
            locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
        except locale.Error:
            pass  # Якщо не вдалося встановити, продовжуємо
    # Встановлюємо змінну середовища для Python
    os.environ['PYTHONIOENCODING'] = 'utf-8'

from logging.config import fileConfig
from pathlib import Path
from urllib.parse import quote_plus, urlparse, urlunparse

from sqlalchemy import engine_from_config, pool, create_engine
from sqlalchemy.engine import Connection

from alembic import context

# Додаємо backend до sys.path для імпортів
# alembic/env.py знаходиться в alembic/, тому backend - це parent.parent / "backend"
project_root = Path(__file__).resolve().parent.parent
backend_dir = project_root / "backend"

if backend_dir.exists():
    sys.path.insert(0, str(backend_dir))
else:
    # Якщо backend не знайдено, спробуємо поточну директорію
    sys.path.insert(0, str(project_root))

# Тепер можемо імпортувати app
from app.database import Base
from app.core.config import settings

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# Імпортуємо всі моделі для автогенерації міграцій
from app.models import (
    Category,
    Product,
    ProductSize,
    User,
    Address,
    Order,
    OrderItem,
    Review,
    Promotion,
    DeliveryZone,
    PromoCode,
    Favorite,
    AuditLog,
)

# Встановлюємо метадату для автогенерації міграцій
target_metadata = Base.metadata

# Конвертуємо async URL в sync URL для міграцій
# postgresql+asyncpg:// -> postgresql+psycopg2://
# ВАЖЛИВО: Створюємо URL через байти, щоб гарантувати правильне кодування
database_url_bytes = b"postgresql+psycopg2://postgres:postgres@localhost:5432/croco_sushi"
database_url = database_url_bytes.decode('ascii')


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    # Використовуємо жорстко закодований URL
    url = database_url
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


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    import os
    import sys
    import locale
    
    # Встановлюємо UTF-8 кодування для Python на Windows
    # Це вирішує проблему з UnicodeDecodeError в psycopg2
    # Див: https://stackoverflow.com/questions/42339876/error-unicodedecodeerror-utf-8-codec-cant-decode-byte-0xff-in-position-0-in
    # Див: https://github.com/apache/superset/issues/29457
    if sys.platform == 'win32':
        # Встановлюємо UTF-8 для stdout/stderr
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8')
        # Встановлюємо змінну середовища для Python
        os.environ['PYTHONIOENCODING'] = 'utf-8'
        
        # ВАЖЛИВО: Встановлюємо локаль на C (ASCII) або UTF-8
        # Windows за замовчуванням використовує Windows-1251 для української локалі,
        # що викликає UnicodeDecodeError в psycopg2
        try:
            locale.setlocale(locale.LC_ALL, 'C')
        except locale.Error:
            try:
                locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
            except locale.Error:
                pass  # Якщо не вдалося встановити, продовжуємо
        
        # Очищаємо PATH від шляхів з не-ASCII символами
        # psycopg2 може намагатися читати файли з PATH, що викликає помилку кодування
        old_path = os.environ.get('PATH', '')
        clean_path_items = []
        for item in old_path.split(os.pathsep):
            if item and all(ord(c) < 128 for c in item):
                clean_path_items.append(item)
        os.environ['PATH'] = os.pathsep.join(clean_path_items)
        
        # Очищаємо sys.path від шляхів з не-ASCII символами
        # psycopg2 може намагатися читати модулі з sys.path, що викликає помилку кодування
        clean_sys_path = []
        for item in sys.path:
            if item and all(ord(c) < 128 for c in item):
                clean_sys_path.append(item)
        sys.path = clean_sys_path
        
        # Встановлюємо змінні середовища PostgreSQL для psycopg2
        # щоб уникнути читання файлів конфігурації з не-ASCII шляхів
        os.environ['PGHOST'] = '127.0.0.1'
        os.environ['PGPORT'] = '5432'
        os.environ['PGUSER'] = 'postgres'
        os.environ['PGPASSWORD'] = 'postgres'
        os.environ['PGDATABASE'] = 'croco_sushi'
        os.environ['PGPASSFILE'] = ''  # Вимкнути читання .pgpass файлу
    
    # Використовуємо SQLAlchemy URL напряму без creator функції
    # SQLAlchemy сам створить підключення через psycopg2
    # Це уникає проблем з викликом psycopg2.connect() напряму на Windows
    connectable = create_engine(
        database_url,
        poolclass=pool.NullPool,
        pool_pre_ping=True,
        echo=False,
    )

    try:
        with connectable.connect() as connection:
            do_run_migrations(connection)
    except UnicodeDecodeError as e:
        print("=" * 80)
        print("ПОМИЛКА КОДУВАННЯ В PSYCOPG2 НА WINDOWS")
        print("=" * 80)
        print(f"Помилка: {e}")
        print("\nЦе відома проблема psycopg2 на Windows з українською локаллю (Windows-1251).")
        print("Байт 0xd4 в позиції 61 - це кирилична літера 'Т' в Windows-1251.")
        print("\nМОЖЛИВІ РІШЕННЯ:")
        print("1. Встановіть системну локаль на англійську (Control Panel > Region > Administrative > Change system locale)")
        print("2. Або використайте Docker для запуску міграцій")
        print("3. Або встановіть psycopg (psycopg3) замість psycopg2-binary")
        print("\nДля тимчасового рішення спробуйте запустити:")
        print("  $env:LC_ALL='C'; $env:PYTHONIOENCODING='utf-8'; alembic current")
        print("=" * 80)
        raise
    except Exception as e:
        print(f"Помилка підключення до бази даних: {e}")
        print(f"URL: {database_url}")
        print("Переконайтеся, що PostgreSQL запущений і доступний.")
        print("Перевірте, чи порт 5432 не заблокований файрволом.")
        raise
    finally:
        connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
