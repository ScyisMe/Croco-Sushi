"""Celery tasks для відправки SMS"""
from typing import Optional
import logging

from app.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.sms.send_sms", bind=True, max_retries=3)
def send_sms(
    self,
    phone: str,
    message: str
) -> bool:
    """Відправка SMS (заглушка - потребує SMS провайдера)
    
    Args:
        phone: Номер телефону
        message: Текст повідомлення
    
    Returns:
        True якщо успішно, False якщо помилка
    """
    try:
        # TODO: Інтеграція з SMS провайдером (Twilio, SMS.ru, тощо)
        # Приклад використання:
        # from app.core.sms import send_sms_via_provider
        # return send_sms_via_provider(phone, message)
        
        logger.info(f"SMS відправлено: {phone}")
        return True
    
    except Exception as e:
        logger.error(f"Помилка відправки SMS: {e}", exc_info=True)
        # Повторна спроба
        raise self.retry(exc=e, countdown=60)


@celery_app.task(name="app.tasks.sms.send_verification_code")
def send_verification_code(phone: str, code: str) -> bool:
    """Відправка SMS коду верифікації
    
    Args:
        phone: Номер телефону
        code: Код верифікації (6 цифр)
    
    Returns:
        True якщо успішно
    """
    message = f"Ваш код підтвердження: {code}"
    # Виконуємо задачу асинхронно (не блокуємо worker)
    send_sms.delay(phone, message)
    return True  # Задача поставлена в чергу


@celery_app.task(name="app.tasks.sms.send_order_notification")
def send_order_notification(phone: str, order_number: str, status: str) -> bool:
    """Відправка SMS сповіщення про статус замовлення
    
    Args:
        phone: Номер телефону
        order_number: Номер замовлення
        status: Статус замовлення
    
    Returns:
        True якщо успішно
    """
    message = f"Замовлення {order_number}: {status}"
    # Виконуємо задачу асинхронно (не блокуємо worker)
    send_sms.delay(phone, message)
    return True  # Задача поставлена в чергу

