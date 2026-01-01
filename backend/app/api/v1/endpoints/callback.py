"""API endpoints для передзвону"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis
import json

from app.database import get_db
from app.core.config import settings
from app.core.exceptions import BadRequestException, NotFoundException
from app.schemas.callback import CallbackRequest, CallbackResponse, CallbackSchema, CallbackUpdate
from app.models.callback import Callback, CallbackStatus
from sqlalchemy import select
from typing import Optional

router = APIRouter()

# Підключення до Redis для rate limiting
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception:
    redis_client = None


def get_client_ip(request: Request) -> str:
    """Отримання IP адреси клієнта з урахуванням проксі"""
    # Перевірка X-Forwarded-For (якщо застосунок за проксі)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Беремо перший IP (оригінальний клієнт)
        # X-Forwarded-For може містити кілька IP через кому
        client_ip = forwarded_for.split(",")[0].strip()
        # Базова валідація IP адреси
        if client_ip and len(client_ip) <= 45:  # Максимальна довжина IPv6
            return client_ip
    
    # Перевірка X-Real-IP (альтернативний заголовок)
    real_ip = request.headers.get("X-Real-IP")
    if real_ip and len(real_ip) <= 45:
        return real_ip.strip()
    
    # Fallback на стандартний спосіб
    if request.client:
        return request.client.host
    
    return "unknown"


@router.post("/", response_model=CallbackResponse, status_code=status.HTTP_201_CREATED)
async def request_callback(
    callback_data: CallbackRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Запит на передзвін"""
    client_ip = get_client_ip(request)
    
    # Rate limiting: 3 запити на годину з одного IP
    if redis_client:
        rate_limit_key = f"callback:{client_ip}"
        current_requests = redis_client.get(rate_limit_key)
        
        # Безпечне перетворення в int з обробкою помилок
        try:
            requests_count = int(current_requests) if current_requests else 0
        except (ValueError, TypeError):
            requests_count = 0
        
        if requests_count >= 3:
            raise BadRequestException("Перевищено ліміт запитів. Спробуйте пізніше (макс 3 на годину)")
        
        # Збільшуємо лічильник (TTL 1 година)
        if current_requests:
            redis_client.incr(rate_limit_key)
        else:
            redis_client.setex(rate_limit_key, 3600, 1)
    
    # Зберігаємо в БД
    from app.models.callback import Callback, CallbackStatus
    
    db_callback = Callback(
        phone=callback_data.phone,
        name=callback_data.name,
        ip_address=client_ip,
        status=CallbackStatus.NEW
    )
    db.add(db_callback)
    await db.commit()
    await db.refresh(db_callback)

    # Відправка email повідомлення адміністратору
    try:
        from app.tasks.email import send_email
        from app.core.config import settings
        
        # Використовуємо EMAIL_FROM як отримувача (або можна додати ADMIN_EMAIL в налаштування)
        recipient = settings.EMAIL_FROM or "admin@crocosushi.com"
        
        subject = f"📞 Запит на передзвін: {callback_data.phone}"
        body = f"Новий запит на передзвін!\n\nТелефон: {callback_data.phone}\nІм'я: {callback_data.name or 'Не вказано'}\nIP: {client_ip}\nЧас: {datetime.now(timezone.utc)}"
        
        send_email.delay(recipient, subject, body)
    except Exception as e:
        # Логуємо помилку, але не перериваємо запит
        print(f"Failed to send callback email: {e}")
    
    return CallbackResponse(
        success=True,
        message="Ваш запит прийнято. Ми передзвонимо вам найближчим часом."
    )


@router.get("/", response_model=list[CallbackSchema])
async def get_callbacks(
    skip: int = 0,
    limit: int = 50,
    status: Optional[CallbackStatus] = None,
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_active_manager) # TODO: Restore auth
):
    """Отримати список запитів на передзвін"""
    query = select(Callback)
    
    if status:
        query = query.where(Callback.status == status)
    
    query = query.order_by(Callback.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{callback_id}", response_model=CallbackSchema)
async def update_callback_status(
    callback_id: int,
    callback_update: CallbackUpdate,
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_active_manager) # TODO: Restore auth
):
    """Оновити статус запиту"""
    result = await db.execute(select(Callback).where(Callback.id == callback_id))
    callback = result.scalar_one_or_none()
    
    if not callback:
        raise NotFoundException("Запит не знайдено")
    
    callback.status = callback_update.status
    if callback_update.comment is not None:
        callback.comment = callback_update.comment
    
    await db.commit()
    await db.refresh(callback)
    return callback







