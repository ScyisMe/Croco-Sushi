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
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 хвилин
    task_soft_time_limit=25 * 60,  # 25 хвилин
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
    result_expires=3600,  # 1 година
)

# Розклад виконання задач (Celery Beat)
celery_app.conf.beat_schedule = {
    # Приклад: очищення старих файлів щодня о 3:00
    "cleanup-old-files": {
        "task": "app.tasks.image_processing.cleanup_old_files",
        "schedule": crontab(hour=3, minute=0),
    },
    # Приклад: відправка статистики щодня о 9:00
    # "send-daily-stats": {
    #     "task": "app.tasks.email.send_daily_statistics",
    #     "schedule": crontab(hour=9, minute=0),
    # },
}
