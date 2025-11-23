# Залежності проекту Croco Sushi

## Docker Compose Services (docker-compose.yml)

### 1. PostgreSQL
- **Image:** `postgres:17-alpine`
- **Container:** `croco_sushi_postgres`
- **Port:** `5432:5432`
- **Environment Variables:**
  - `POSTGRES_USER`: postgres
  - `POSTGRES_PASSWORD`: postgres
  - `POSTGRES_DB`: croco_sushi
- **Volumes:** `postgres_data:/var/lib/postgresql/data`
- **Network:** `croco_sushi_network`
- **Healthcheck:** `pg_isready -U postgres`
- **Залежності:** Немає

### 2. Redis
- **Image:** `redis:7-alpine`
- **Container:** `croco_sushi_redis`
- **Port:** `6379:6379`
- **Volumes:** `redis_data:/data`
- **Network:** `croco_sushi_network`
- **Healthcheck:** `redis-cli ping`
- **Command:** `redis-server --appendonly yes`
- **Залежності:** Немає

### 3. Celery Worker
- **Build:** `.` (з `backend/Dockerfile`)
- **Container:** `croco_sushi_celery_worker`
- **Command:** `celery -A app.celery_app worker --loglevel=info --concurrency=4`
- **Volumes:**
  - `./backend:/app/backend`
  - `backend_uploads:/app/backend/uploads`
- **Environment Variables:**
  - `DATABASE_URL`: `postgresql+asyncpg://postgres:postgres@postgres:5432/croco_sushi`
  - `REDIS_URL`: `redis://redis:6379/0`
  - `CELERY_BROKER_URL`: `redis://redis:6379/0`
  - `CELERY_RESULT_BACKEND`: `redis://redis:6379/0`
  - `SECRET_KEY`: `${SECRET_KEY:-8c813325fd4655711d6d41785a1e0e622de6ba653aa5d0a87716a40462818da8}`
  - `ENVIRONMENT`: `${ENVIRONMENT:-development}`
- **Network:** `croco_sushi_network`
- **Залежності:** `postgres`, `redis`

### 4. Celery Beat
- **Build:** `.` (з `backend/Dockerfile`)
- **Container:** `croco_sushi_celery_beat`
- **Command:** `celery -A app.celery_app beat --loglevel=info`
- **Volumes:** `./backend:/app/backend`
- **Environment Variables:**
  - `DATABASE_URL`: `postgresql+asyncpg://postgres:postgres@postgres:5432/croco_sushi`
  - `REDIS_URL`: `redis://redis:6379/0`
  - `CELERY_BROKER_URL`: `redis://redis:6379/0`
  - `CELERY_RESULT_BACKEND`: `redis://redis:6379/0`
  - `SECRET_KEY`: `${SECRET_KEY:-b24a35417ebe0ff93fbda705b678ef3addf132881f30e80824b1efa022aa1907}`
  - `ENVIRONMENT`: `${ENVIRONMENT:-development}`
- **Network:** `croco_sushi_network`
- **Залежності:** `postgres`, `redis`, `celery_worker`

### 5. Prometheus
- **Image:** `prom/prometheus:latest`
- **Container:** `croco_sushi_prometheus`
- **Port:** `9090:9090`
- **Volumes:**
  - `./monitoring/prometheus:/etc/prometheus`
  - `prometheus_data:/prometheus`
- **Command:**
  - `--config.file=/etc/prometheus/prometheus.yml`
  - `--storage.tsdb.path=/prometheus`
- **Network:** `croco_sushi_network`
- **Залежності:** Немає

### 6. Grafana
- **Image:** `grafana/grafana:10.3.3`
- **Container:** `croco_sushi_grafana`
- **Port:** `3001:3000`
- **Environment Variables:**
  - `GF_SECURITY_ADMIN_USER`: admin
  - `GF_SECURITY_ADMIN_PASSWORD`: admin
  - `GF_USERS_ALLOW_SIGN_UP`: false
- **Volumes:**
  - `grafana_data:/var/lib/grafana`
  - `./monitoring/grafana/provisioning:/etc/grafana/provisioning`
  - `./monitoring/grafana/dashboards:/var/lib/grafana/dashboards`
- **Network:** `croco_sushi_network`
- **Залежності:** `prometheus`

### Docker Volumes
- `postgres_data` - дані PostgreSQL
- `redis_data` - дані Redis
- `backend_uploads` - завантажені файли
- `backend_static` - статичні файли
- `prometheus_data` - дані Prometheus
- `grafana_data` - дані Grafana

### Docker Networks
- `croco_sushi_network` (driver: bridge)

---

## Application Configuration (backend/app/core/config.py)

### Database Configuration
- **DATABASE_URL:** `postgresql+asyncpg://postgres:postgres@localhost:5432/croco_sushi`
  - **Залежність:** PostgreSQL сервер
  - **Драйвер:** asyncpg (асинхронний)
  - **Для міграцій:** конвертується в `postgresql+psycopg2://` (синхронний)

### Redis Configuration
- **REDIS_URL:** `redis://localhost:6379/0`
  - **Залежність:** Redis сервер
  - **Використання:** кешування, rate limiting, сесії

### Celery Configuration
- **CELERY_BROKER_URL:** `redis://localhost:6379/0`
  - **Залежність:** Redis сервер
  - **Використання:** черга завдань (broker)
  
- **CELERY_RESULT_BACKEND:** `redis://localhost:6379/0`
  - **Залежність:** Redis сервер
  - **Використання:** зберігання результатів виконання завдань

### Email Configuration (SMTP)
- **SMTP_SERVER:** `Optional[str]` (за замовчуванням: `None`)
  - **Залежність:** SMTP сервер (Gmail, SendGrid, Mailgun, тощо)
  
- **SMTP_PORT:** `int` (за замовчуванням: `587`)
  - **Стандартний порт:** 587 (TLS) або 465 (SSL)
  
- **SMTP_USER:** `Optional[str]` (за замовчуванням: `None`)
  - **Залежність:** логін для SMTP сервера
  
- **SMTP_PASSWORD:** `Optional[str]` (за замовчуванням: `None`)
  - **Залежність:** пароль для SMTP сервера
  
- **EMAIL_FROM:** `Optional[str]` (за замовчуванням: `None`)
  - **Email адреса відправника**
  
- **EMAIL_FROM_NAME:** `str` (за замовчуванням: `"Croco Sushi"`)
  - **Ім'я відправника**

### SMS Configuration
- **SMS_PROVIDER:** `Optional[str]` (за замовчуванням: `None`)
  - **Можливі значення:** `"twilio"`, `"smsru"`, тощо
  - **Залежність:** SMS провайдер API
  
- **SMS_API_KEY:** `Optional[str]` (за замовчуванням: `None`)
  - **Залежність:** API ключ від SMS провайдера
  
- **SMS_API_SECRET:** `Optional[str]` (за замовчуванням: `None`)
  - **Залежність:** API секрет від SMS провайдера
  
- **SMS_FROM_NUMBER:** `Optional[str]` (за замовчуванням: `None`)
  - **Номер телефону відправника**

### Security Configuration
- **SECRET_KEY:** `str` (за замовчуванням: `"your-secret-key-change-in-production"`)
  - **Використання:** JWT токени, шифрування
  - **⚠️ ВАЖЛИВО:** Змінити в production!
  
- **ALGORITHM:** `str` (за замовчуванням: `"HS256"`)
  - **Алгоритм для JWT токенів**
  
- **ACCESS_TOKEN_EXPIRE_MINUTES:** `int` (за замовчуванням: `30`)
  - **Термін дії access токену (хвилини)**

### CORS Configuration
- **CORS_ORIGINS:** `List[str]`
  - **За замовчуванням:** `["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]`
  - **Дозволені домени для CORS запитів**

### File Upload Configuration
- **UPLOAD_DIR:** `str` (за замовчуванням: `"uploads"`)
  - **Директорія для завантажених файлів**
  
- **MAX_UPLOAD_SIZE:** `int` (за замовчуванням: `5 * 1024 * 1024` = 5MB)
  - **Максимальний розмір файлу**

### Logging Configuration
- **LOG_LEVEL:** `str` (за замовчуванням: `"INFO"`)
  - **Рівень логування:** DEBUG, INFO, WARNING, ERROR, CRITICAL
  
- **ECHO_SQL:** `bool` (за замовчуванням: `False`)
  - **Логування SQL запитів (тільки для розробки)**

### Application Configuration
- **PROJECT_NAME:** `str` (за замовчуванням: `"Croco Sushi"`)
- **VERSION:** `str` (за замовчуванням: `"0.1.0"`)
- **API_V1_PREFIX:** `str` (за замовчуванням: `"/api/v1"`)
- **ENVIRONMENT:** `str` (за замовчуванням: `"development"`)
  - **Можливі значення:** `development`, `production`, `testing`

---

## Діаграма залежностей сервісів

```
┌─────────────┐
│  PostgreSQL │ (незалежний)
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
┌──────▼──────┐   ┌──────▼──────┐
│   Redis     │   │   Backend    │
│(незалежний) │   │  (FastAPI)   │
└──────┬──────┘   └──────┬──────┘
       │                 │
       ├─────────┬────────┘
       │         │
┌──────▼──────┐ │  ┌──────────────┐
│Celery Worker│ │  │ Celery Beat   │
└─────────────┘ │  └──────┬───────┘
                │         │
                └─────────┘
                       │
                ┌──────▼──────┐
                │  Prometheus  │ (незалежний)
                └──────┬──────┘
                       │
                ┌──────▼──────┐
                │   Grafana   │
                └─────────────┘
```

---

## Зовнішні залежності (треба налаштувати окремо)

### 1. SMTP Сервер (для email)
- **Провайдери:** Gmail, SendGrid, Mailgun, AWS SES, тощо
- **Налаштування:** через змінні середовища або `.env` файл

### 2. SMS Провайдер (для SMS)
- **Провайдери:** Twilio, SMS.ru, Nexmo, тощо
- **Налаштування:** через змінні середовища або `.env` файл

### 3. Python пакети (з pyproject.toml)
- **FastAPI** - веб-фреймворк
- **SQLAlchemy** - ORM
- **asyncpg** - асинхронний драйвер PostgreSQL
- **psycopg2-binary** - синхронний драйвер PostgreSQL (для міграцій)
- **Redis** - клієнт Redis
- **Celery** - черга завдань
- **Pydantic** - валідація даних
- **python-jose** - JWT токени
- **passlib** - хешування паролів
- **Pillow** - обробка зображень
- **pyotp** - 2FA токени
- **qrcode** - генерація QR-кодів
- **Alembic** - міграції БД

---

## Порядок запуску сервісів

1. **PostgreSQL** - база даних
2. **Redis** - кеш та черга завдань
3. **Backend** (FastAPI) - основний API сервер
4. **Celery Worker** - обробка асинхронних завдань
5. **Celery Beat** - планувальник завдань
6. **Prometheus** - моніторинг (опціонально)
7. **Grafana** - візуалізація метрик (опціонально)

