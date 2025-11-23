# Вирішення проблем з Docker для Croco Sushi

## Проблема: ResourceExhausted - cannot allocate memory

### Причина
Docker Desktop не має достатньо виділеної пам'яті або процес збірки споживає занадто багато ресурсів.

### Рішення 1: Збільшити пам'ять для Docker Desktop

1. Відкрийте Docker Desktop
2. Перейдіть до Settings (⚙️)
3. Відкрийте Resources → Advanced
4. Збільште Memory до 4GB або більше
5. Натисніть Apply & Restart

### Рішення 2: Збірка по одному сервісу

Замість одночасної збірки всіх сервісів:

```bash
# Спочатку зберіть тільки celery_worker
docker-compose build celery_worker

# Потім celery_beat
docker-compose build celery_beat
```

### Рішення 3: Використати готовий образ Python з залежностями

Якщо проблеми продовжуються, можна використати базовий образ з вже встановленими залежностями.

### Рішення 4: Запуск без Celery (для розробки)

Якщо Celery не потрібен зараз, тимчасово закоментуйте сервіси celery_worker та celery_beat в docker-compose.yml:

```yaml
# celery_worker:
#   ...
# celery_beat:
#   ...
```

### Рішення 5: Використати готові бінарні wheels

Переконайтеся, що використовуються попередньо скомпільовані пакети (wheels), а не компіляція з джерел.

## Проблема: Celery не знаходить app.celery_app

### Причина
Файл з ініціалізацією Celery не існує в проєкті.

### Рішення

Створіть файл `backend/app/celery_app.py`:

```python
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "croco_sushi",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# Налаштування
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)
```

Або тимчасово вимкніть Celery сервіси в docker-compose.yml, якщо вони не потрібні.

