"""Celery задачі для додатку"""
# Імпорт всіх задач для реєстрації в Celery
from app.tasks import image_processing, email, sms

__all__ = ["image_processing", "email", "sms"]

