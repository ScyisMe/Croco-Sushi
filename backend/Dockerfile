FROM python:3.13-slim

# Встановлюємо системні залежності
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо файли залежностей з кореня проєкту
COPY pyproject.toml uv.lock* ./

# Встановлюємо залежності через pip (pip підтримує pyproject.toml)
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    "uvicorn[standard]==0.24.0" \
    sqlalchemy==2.0.23 \
    asyncpg==0.29.0 \
    alembic==1.12.1 \
    pydantic==2.5.0 \
    pydantic-settings==2.1.0 \
    "python-jose[cryptography]==3.3.0" \
    "passlib[bcrypt]==1.7.4" \
    python-multipart==0.0.6 \
    redis==5.0.1 \
    celery==5.3.4 \
    pillow==10.1.0 \
    aiofiles==23.2.1 \
    pyotp==2.9.0 \
    "qrcode[pil]==7.4.2"

# Копіюємо код backend
COPY backend/ ./backend/

# Встановлюємо робочу директорію в backend
WORKDIR /app/backend

# Створюємо директорії для uploads та static
RUN mkdir -p uploads static

# Відкриваємо порт
EXPOSE 8000

# Команда за замовчуванням (можна перевизначити в docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

