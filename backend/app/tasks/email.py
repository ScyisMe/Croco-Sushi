"""Celery tasks для відправки email"""
from typing import Optional, Dict, List
from pathlib import Path
import logging

from app.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.email.send_email", bind=True, max_retries=3)
def send_email(
    self,
    to_email: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None,
    attachments: Optional[List[Dict]] = None
) -> bool:
    """Відправка email (заглушка - потребує SMTP конфігурації)
    
    Args:
        to_email: Email одержувача
        subject: Тема листа
        body: Текстовий контент
        html_body: HTML контент (опціонально)
        attachments: Список вкладень
    
    Returns:
        True якщо успішно, False якщо помилка
    """
    try:
        from app.core.email import send_email_smtp
        return send_email_smtp(to_email, subject, body, html_body, attachments)
    
    except Exception as e:
        logger.error(f"Помилка відправки email: {e}", exc_info=True)
        # Повторна спроба
        raise self.retry(exc=e, countdown=60)


@celery_app.task(name="app.tasks.email.send_order_confirmation")
def send_order_confirmation(order_id: int, email: str) -> bool:
    """Відправка підтвердження замовлення
    
    Args:
        order_id: ID замовлення
        email: Email клієнта
    
    Returns:
        True якщо успішно
    """
    subject = f"Підтвердження замовлення #{order_id}"
    body = f"Ваше замовлення #{order_id} отримано та обробляється."
    
    # Виконуємо задачу асинхронно (не блокуємо worker)
    send_email.delay(email, subject, body)
    return True  # Задача поставлена в чергу


@celery_app.task(name="app.tasks.email.send_order_status_update")
def send_order_status_update(order_id: int, email: str, status: str) -> bool:
    """Відправка сповіщення про зміну статусу замовлення
    
    Args:
        order_id: ID замовлення
        email: Email клієнта
        status: Новий статус
    
    Returns:
        True якщо успішно
    """
    subject = f"Статус замовлення #{order_id} оновлено"
    body = f"Статус вашого замовлення #{order_id} змінено на: {status}"
    
    # Виконуємо задачу асинхронно (не блокуємо worker)
    send_email.delay(email, subject, body)
    return True  # Задача поставлена в чергу


@celery_app.task(name="app.tasks.email.send_password_reset")
def send_password_reset(email: str, reset_code: str) -> bool:
    """Відправка коду відновлення пароля
    
    Args:
        email: Email користувача
        reset_code: Код відновлення
    
    Returns:
        True якщо успішно
    """
    subject = "Відновлення пароля"
    body = f"Ваш код для відновлення пароля: {reset_code}"
    
    # Виконуємо задачу асинхронно (не блокуємо worker)
    send_email.delay(email, subject, body)
    return True  # Задача поставлена в чергу


@celery_app.task(name="app.tasks.email.send_welcome_email")
def send_welcome_email(email: str, name: str) -> bool:
    """Відправка вітального листа при реєстрації
    
    Args:
        email: Email користувача
        name: Ім'я користувача
    
    Returns:
        True якщо успішно
    """
    subject = "Вітаємо в Croco Sushi!"
    body = f"Вітаємо, {name}!\n\nДякуємо за реєстрацію в Croco Sushi. Тепер ви можете замовляти улюблені страви ще швидше та зручніше.\n\nЗ повагою,\nКоманда Croco Sushi"
    
    # Виконуємо задачу асинхронно
    send_email.delay(email, subject, body)
    return True

