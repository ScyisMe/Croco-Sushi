# Інструкція з налаштування проекту

## Крок 1: Налаштування змінних середовища

Створіть файл `.env` в папці `backend/` на основі `.env.example`:

```bash
cd backend
cp .env.example .env
```

Відредагуйте `.env` файл, особливо:
- `DATABASE_URL` - якщо використовуєте інші дані для підключення до БД
- `SECRET_KEY` - згенеруйте безпечний ключ для production

## Крок 2: Запуск PostgreSQL та Redis

Запустіть Docker контейнери:

```bash
# З кореня проекту
docker-compose up -d
```

Перевірте, що контейнери запущені:

```bash
docker-compose ps
```

## Крок 3: Створення міграцій

Перейдіть в папку `backend/` та створіть першу міграцію:

```bash
cd backend
alembic revision --autogenerate -m "Initial migration"
```

Це створить файл міграції в `alembic/versions/`.

## Крок 4: Застосування міграцій

Застосуйте міграції до бази даних:

```bash
alembic upgrade head
```

## Крок 5: Запуск сервера

Запустіть FastAPI сервер:

```bash
# Варіант 1: Через run.py
python run.py

# Варіант 2: Через uvicorn напряму
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Сервер буде доступний за адресою: http://localhost:8000

## Корисні команди

### Створення нової міграції
```bash
alembic revision --autogenerate -m "Description"
```

### Застосування міграцій
```bash
alembic upgrade head
```

### Відкат останньої міграції
```bash
alembic downgrade -1
```

### Перегляд історії міграцій
```bash
alembic history
```

### Перевірка поточного стану
```bash
alembic current
```

## Тестування API

Після запуску сервера відкрийте:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Наступні кроки

1. Додати seed-дані (тестові категорії та продукти)
2. Реалізувати аутентифікацію
3. Додати CRUD операції для адмін-панелі
4. Реалізувати кошик та замовлення


