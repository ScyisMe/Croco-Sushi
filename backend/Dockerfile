FROM python:3.12-bookworm

# Встановлюємо мінімальні системні залежності (тільки необхідні для компіляції Python пакетів)
# Використовуємо --no-install-recommends для зменшення розміру
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо файли залежностей з кореня проєкту
COPY pyproject.toml uv.lock* ./

# Копіюємо Alembic конфігурацію та скрипти (з кореня проекту)
COPY alembic.ini ./
COPY alembic ./alembic

# Копіюємо код backend (потрібно для pip install -e .)
COPY backend ./backend

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Встановлюємо залежності через pip з pyproject.toml
# pip install -e . автоматично встановлює залежності з pyproject.toml
# Закріплюємо setuptools<81 для сумісності з passlib (pkg_resources deprecated)
RUN uv pip install --system --upgrade "setuptools>=61.0,<81" wheel && \
    uv pip install --system -e .

# Встановлюємо робочу директорію в backend
WORKDIR /app/backend

# Створюємо директорії для uploads та static
RUN mkdir -p uploads static

# Відкриваємо порт
EXPOSE 8000

# Команда за замовчуванням (можна перевизначити в docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

