"""Celery tasks для відправки email"""
from typing import Optional, Dict, List
import logging

from app.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)


# --- Основна Celery задача (Worker) ---

@celery_app.task(
    name="app.tasks.email.send_email",
    bind=True,
    max_retries=3,
    default_retry_delay=60  # Затримка між спробами (секунди)
)
def send_email(
    self,
    to_email: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None,
    attachments: Optional[List[Dict]] = None
) -> bool:
    """
    Єдина точка входу для Celery Worker.
    Тільки ця функція має декоратор @task.
    
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
        # Імпорт всередині, щоб уникнути циклічних залежностей при старті
        from app.core.email import send_email_smtp
        
        result = send_email_smtp(to_email, subject, body, html_body, attachments)
        
        if not result:
            logger.warning(f"Email not sent to {to_email} (SMTP returned False)")
            
        return result
    
    except Exception as e:
        logger.error(f"Critical error sending email: {e}", exc_info=True)
        # retry(exc=e) автоматично використає default_retry_delay
        raise self.retry(exc=e)


# --- Сервісні функції (Helper Functions) ---
# Це звичайні функції, які викликаються з вашого API.
# Вони готують дані і відправляють їх у чергу.
# НЕ є Celery tasks - форматування відбувається в потоці API (миттєво).


def schedule_order_confirmation(order_id: int, email: str) -> None:
    """Підготовка та постановка в чергу листа про замовлення
    
    Args:
        order_id: ID замовлення
        email: Email клієнта
    """
    subject = f"Підтвердження замовлення #{order_id}"
    body = f"Ваше замовлення #{order_id} отримано та обробляється."
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Дякуємо за замовлення!</h1>
        <p>Ваше замовлення <strong>#{order_id}</strong> отримано та обробляється.</p>
        <p>Ми повідомимо вас, коли воно буде готове до доставки.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">З повагою,<br>Команда {settings.PROJECT_NAME}</p>
    </div>
    """
    
    # Викликаємо Celery задачу
    send_email.delay(to_email=email, subject=subject, body=body, html_body=html_body)


def schedule_order_status_update(order_id: int, email: str, status: str) -> None:
    """Підготовка та постановка в чергу листа про статус
    
    Args:
        order_id: ID замовлення
        email: Email клієнта
        status: Новий статус замовлення
    """
    subject = f"Статус замовлення #{order_id} оновлено"
    body = f"Статус вашого замовлення #{order_id} змінено на: {status}"
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Оновлення статусу</h1>
        <p>Статус вашого замовлення <strong>#{order_id}</strong> змінено на:</p>
        <p style="font-size: 18px; font-weight: bold; color: #333;">{status}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">З повагою,<br>Команда {settings.PROJECT_NAME}</p>
    </div>
    """
    
    send_email.delay(to_email=email, subject=subject, body=body, html_body=html_body)


def schedule_password_reset(email: str, reset_code: str) -> None:
    """Підготовка листа відновлення пароля
    
    Args:
        email: Email користувача
        reset_code: Код відновлення
    """
    subject = "Відновлення пароля"
    body = f"Ваш код для відновлення пароля: {reset_code}\n\nКод дійсний протягом 15 хвилин."
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Відновлення пароля</h1>
        <p>Ви запросили відновлення пароля. Використайте цей код:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #333;">{reset_code}</span>
        </div>
        <p style="color: #666;">Код дійсний протягом 15 хвилин.</p>
        <p style="color: #999; font-size: 12px;">Якщо ви не запитували відновлення пароля, проігноруйте цей лист.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">З повагою,<br>Команда {settings.PROJECT_NAME}</p>
    </div>
    """
    
    send_email.delay(to_email=email, subject=subject, body=body, html_body=html_body)


def schedule_welcome_email(email: str, name: str) -> None:
    """Підготовка вітального листа
    
    Args:
        email: Email користувача
        name: Ім'я користувача
    """
    subject = f"Вітаємо в {settings.PROJECT_NAME}!"
    body = (
        f"Вітаємо, {name}!\n\n"
        f"Дякуємо за реєстрацію в {settings.PROJECT_NAME}. "
        "Тепер ви можете замовляти улюблені страви ще швидше та зручніше.\n\n"
        f"З повагою,\nКоманда {settings.PROJECT_NAME}"
    )
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Вітаємо, {name}!</h1>
        <p>Дякуємо за реєстрацію в <strong>{settings.PROJECT_NAME}</strong>.</p>
        <p>Тепер ви можете:</p>
        <ul>
            <li>🍣 Замовляти улюблені страви швидше</li>
            <li>📦 Відстежувати статус замовлень</li>
            <li>⭐ Накопичувати бонусні бали</li>
            <li>❤️ Зберігати улюблені страви</li>
        </ul>
        <a href="{settings.CORS_ORIGINS[0] if isinstance(settings.CORS_ORIGINS, list) else 'http://localhost:3000'}/menu" 
           style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
           Перейти до меню
        </a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">З повагою,<br>Команда {settings.PROJECT_NAME}</p>
    </div>
    """
    
    send_email.delay(to_email=email, subject=subject, body=body, html_body=html_body)


def schedule_newsletter(email: str, subject: str, content: str, html_content: Optional[str] = None) -> None:
    """Відправка розсилки
    
    Args:
        email: Email підписника
        subject: Тема листа
        content: Текстовий контент
        html_content: HTML контент (опціонально)
    """
    send_email.delay(to_email=email, subject=subject, body=content, html_body=html_content)
