"""Celery конфігурація та створення app"""
from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Створюємо Celery app
celery_app = Celery(
    "croco_sushi",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.image_processing",
        "app.tasks.email",
        "app.tasks.sms",
    ]
)

# Конфігурація Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Kyiv",
    enable_utc=True,
    
    # --- Виконання задач ---
    task_track_started=True,
    task_time_limit=30 * 60,       # Hard kill через 30 хв
    task_soft_time_limit=25 * 60,  # Exception через 25 хв
    
    # --- Оптимізація воркера ---
    # 1 - ідеально для важких задач (зображення), щоб не блокувати легкі (email)
    worker_prefetch_multiplier=1,
    # Якщо воркер впаде під час роботи, задача не загубиться і піде іншому
    task_acks_late=True,
    # Перезапуск процесу для очищення пам'яті (важливо для PIL/Matplotlib)
    worker_max_tasks_per_child=1000,
    
    # --- Результати ---
    result_expires=3600,  # 1 година
    
    # Налаштування для Redis (щоб задачі не дублювалися при довгій обробці)
    broker_transport_options={
        "visibility_timeout": 3600,  # 1 година (має бути > task_time_limit)
    }
)

# Розклад виконання задач (Celery Beat)
celery_app.conf.beat_schedule = {
    # Очищення старих файлів щодня о 3:00 за Києвом
    "cleanup-old-files": {
        "task": "app.tasks.image_processing.cleanup_old_files",
        "schedule": crontab(hour=3, minute=0),
    },
}
