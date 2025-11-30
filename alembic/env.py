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


def get_url():
    """Отримання URL БД з налаштувань"""
    # Конвертуємо async URL в sync URL для міграцій
    # postgresql+asyncpg:// -> postgresql+psycopg2://
    db_url = settings.DATABASE_URL
    
    # Замінюємо asyncpg на psycopg2
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    
    # Для локального запуску Alembic (не в Docker) замінюємо 'postgres' на '127.0.0.1'
    # Перевіряємо, чи запускаємося в Docker контейнері
    import re
    import os
    
    # Якщо запускаємося в Docker контейнері, не замінюємо 'postgres' на '127.0.0.1'
    # Перевіряємо наявність файлу, який зазвичай є в Docker контейнері
    is_docker = os.path.exists('/.dockerenv') or os.path.exists('/proc/self/cgroup')
    
    if not is_docker:
        # Використовуємо IPv4 замість localhost, щоб уникнути проблем з IPv6
        # Формат URL: postgresql+psycopg2://user:password@host:port/database
        # Замінюємо @postgres:PORT на @127.0.0.1:PORT (тільки хост після @)
        db_url = re.sub(r'@postgres:(\d+)', r'@127.0.0.1:\1', db_url)
        # Також замінюємо localhost на 127.0.0.1 для уникнення проблем з IPv6
        db_url = re.sub(r'@localhost:(\d+)', r'@127.0.0.1:\1', db_url)
    
    # Якщо є змінна середовища POSTGRES_PASSWORD, замінюємо пароль в URL
    # Це дозволяє використовувати новий пароль без редагування .env файлу
    postgres_password = os.environ.get('POSTGRES_PASSWORD')
    if postgres_password:
        # Замінюємо пароль в URL: user:old_password@ -> user:new_password@
        # Використовуємо регулярний вираз для заміни пароля
        db_url = re.sub(r'://([^:]+):[^@]+@', rf'://\1:{postgres_password}@', db_url)
    
    return db_url


# Отримуємо URL для міграцій
database_url = get_url()


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
    # Встановлюємо змінні середовища PostgreSQL для psycopg2
    # щоб уникнути читання файлів конфігурації з не-ASCII шляхів
    # Це має бути зроблено ДО створення engine
    if sys.platform == 'win32':
        # Парсимо URL для отримання параметрів підключення
        from urllib.parse import urlparse
        parsed_url = urlparse(database_url.replace('postgresql+psycopg2://', 'postgresql://'))
        
        if parsed_url.hostname:
            os.environ['PGHOST'] = parsed_url.hostname
        if parsed_url.port:
            os.environ['PGPORT'] = str(parsed_url.port)
        if parsed_url.username:
            os.environ['PGUSER'] = parsed_url.username
        if parsed_url.password:
            os.environ['PGPASSWORD'] = parsed_url.password
        if parsed_url.path and parsed_url.path.startswith('/'):
            os.environ['PGDATABASE'] = parsed_url.path[1:]  # Прибираємо початковий /
        
        # Вимкнути читання .pgpass файлу (може містити не-ASCII символи)
        os.environ['PGPASSFILE'] = ''
        
        # Вимкнути читання інших конфігураційних файлів
        os.environ['PGSERVICEFILE'] = ''
    
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
        error_msg = str(e)
        print("=" * 80)
        print("ПОМИЛКА ПІДКЛЮЧЕННЯ ДО БАЗИ ДАНИХ")
        print("=" * 80)
        print(f"Помилка: {error_msg}")
        print(f"\nURL: {database_url}")
        
        # Перевірка типу помилки
        if "не пройшов автентифікацію" in error_msg or "password authentication failed" in error_msg.lower():
            print("\n🔐 ПРОБЛЕМА З АВТЕНТИФІКАЦІЄЮ:")
            print("   Користувач 'postgres' не може підключитися з вказаним паролем.")
            print("\n💡 РІШЕННЯ:")
            print("   1. Запустіть PostgreSQL через Docker:")
            print("      docker-compose up -d postgres")
            print("\n   2. Або налаштуйте локальний PostgreSQL:")
            print("      - Створіть користувача: CREATE USER postgres WITH PASSWORD 'postgres';")
            print("      - Або змініть пароль: ALTER USER postgres WITH PASSWORD 'postgres';")
            print("\n   3. Або створіть файл .env в backend/ з правильним DATABASE_URL:")
            print("      DATABASE_URL=postgresql+asyncpg://postgres:ВАШ_ПАРОЛЬ@localhost:5432/croco_sushi")
        elif "could not connect" in error_msg.lower() or "connection refused" in error_msg.lower():
            print("\n🔌 ПРОБЛЕМА З ПІДКЛЮЧЕННЯМ:")
            print("   PostgreSQL не запущений або недоступний.")
            print("\n💡 РІШЕННЯ:")
            print("   1. Запустіть PostgreSQL через Docker:")
            print("      docker-compose up -d postgres")
            print("\n   2. Або запустіть локальний PostgreSQL сервіс")
            print("\n   3. Перевірте, чи порт 5432 не заблокований файрволом")
        else:
            print("\n💡 РІШЕННЯ:")
            print("   1. Переконайтеся, що PostgreSQL запущений")
            print("   2. Перевірте правильність DATABASE_URL в .env файлі")
            print("   3. Перевірте, чи порт 5432 не заблокований файрволом")
        
        print("\n📝 Для запуску через Docker використайте:")
        print("   docker-compose up -d postgres redis")
        print("=" * 80)
        raise
    finally:
        connectable.dispose()


# ВАЖЛИВО: Встановлюємо локаль та кодування ПЕРЕД виконанням міграцій
# Це вирішує проблему з UnicodeDecodeError в psycopg2 на Windows
if sys.platform == 'win32':
    # Встановлюємо UTF-8 для stdout/stderr
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass
    if hasattr(sys.stderr, 'reconfigure'):
        try:
            sys.stderr.reconfigure(encoding='utf-8')
        except Exception:
            pass
    
    # Встановлюємо змінну середовища для Python
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    
    # Встановлюємо локаль на C (ASCII) або UTF-8
    try:
        locale.setlocale(locale.LC_ALL, 'C')
    except locale.Error:
        try:
            locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
        except locale.Error:
            pass  # Якщо не вдалося встановити, продовжуємо

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
