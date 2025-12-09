FROM python:3.12-slim-bookworm
# Використовуємо -slim для меншого розміру (якщо не потрібні специфічні системні ліби)
# Якщо виникають помилки компіляції (наприклад, для psycopg2), поверніть просто python:3.12-bookworm

# Встановлюємо системні залежності
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# 1. Спочатку копіюємо ТІЛЬКИ файли залежностей
COPY pyproject.toml uv.lock* ./

# Копіюємо uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Встановлюємо залежності БЕЗ коду самого додатку
# Прибрано помилковий прапорець --no-root
RUN uv pip install --system --upgrade "setuptools>=61.0,<81" wheel && \
    uv pip install --system -r pyproject.toml

# 3. Тепер копіюємо код (цей шар буде змінюватися часто)
COPY backend ./backend

# 4. Встановлюємо сам пакет у режимі editable (якщо це потрібно для imports)
# Або просто додаємо поточну директорію в PYTHONPATH, що часто надійніше в Docker
ENV PYTHONPATH=/app/backend

WORKDIR /app/backend

# Створюємо папки
RUN mkdir -p uploads static

EXPOSE 8000

# Рекомендація: Для продакшену приберіть --reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]