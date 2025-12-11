"""API endpoints для передзвону"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis
import json

import logging

from app.database import get_db
from app.core.config import settings
from app.core.exceptions import BadRequestException
from app.schemas.callback import CallbackRequest, CallbackResponse
from app.core.utils import get_client_ip
from app.tasks.email import send_email

logger = logging.getLogger(__name__)

router = APIRouter()

# Підключення до Redis для rate limiting
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception:
    redis_client = None


# def get_client_ip(request: Request) -> str:
#     """Отримання IP адреси клієнта з урахуванням проксі"""
#     # Перевірка X-Forwarded-For (якщо застосунок за проксі)
#     forwarded_for = request.headers.get("X-Forwarded-For")
#     if forwarded_for:
#         # Беремо перший IP (оригінальний клієнт)
#         # X-Forwarded-For може містити кілька IP через кому
#         client_ip = forwarded_for.split(",")[0].strip()
#         # Базова валідація IP адреси
#         if client_ip and len(client_ip) <= 45:  # Максимальна довжина IPv6
#             return client_ip
#     
#     # Перевірка X-Real-IP (альтернативний заголовок)
#     real_ip = request.headers.get("X-Real-IP")
#     if real_ip and len(real_ip) <= 45:
#         return real_ip.strip()
#     
#     # Fallback на стандартний спосіб
#     if request.client:
#         return request.client.host
#     
#     return "unknown"


@router.post("/", response_model=CallbackResponse, status_code=status.HTTP_201_CREATED)
async def request_callback(
    callback_data: CallbackRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Запит на передзвін"""
    client_ip = get_client_ip(request)
    
    # Rate limiting: 3 запити на годину з одного IP
    # Rate limiting: 3 запити на годину з одного IP
    if redis_client:
        rate_limit_key = f"callback:{client_ip}"
        
        # Atomic rate limiting
        current_requests = redis_client.incr(rate_limit_key)
        if current_requests == 1:
            redis_client.expire(rate_limit_key, 3600)  # 1 hour TTL
        
        if current_requests > 3:
            raise BadRequestException("Перевищено ліміт запитів. Спробуйте пізніше (макс 3 на годину)")
    
    # Тут можна додати логіку для збереження запиту в БД
    # або відправки email/SMS менеджерам
    
    # Наприклад, можна зберегти в Redis для обробки
    # Наприклад, можна зберегти в Redis для обробки
    if redis_client:
        # Better key structure: use a single list for the queue instead of separate keys per phone
        callback_queue_key = "callback_queue"
        callback_data_dict = {
            "phone": callback_data.phone,
            "name": callback_data.name,
            "ip": client_ip,
            "timestamp": str(datetime.now(timezone.utc))
        }
        redis_client.lpush(callback_queue_key, json.dumps(callback_data_dict))

    # Відправка email повідомлення адміністратору
    # Відправка email повідомлення адміністратору
    try:
        # Використовуємо EMAIL_FROM як отримувача (або можна додати ADMIN_EMAIL в налаштування)
        recipient = getattr(settings, 'ADMIN_EMAIL', settings.EMAIL_FROM) or "admin@crocosushi.com"
        
        subject = f"📞 Запит на передзвін: {callback_data.phone}"
        body = f"Новий запит на передзвін!\n\nТелефон: {callback_data.phone}\nІм'я: {callback_data.name or 'Не вказано'}\nIP: {client_ip}\nЧас: {datetime.now(timezone.utc)}"
        
        send_email.delay(recipient, subject, body)
    except Exception as e:
        # Логуємо помилку, але не перериваємо запит
        logger.error(f"Failed to send callback email: {e}")
    
    return CallbackResponse(
        success=True,
        message="Ваш запит прийнято. Ми передзвонимо вам найближчим часом."
    )







