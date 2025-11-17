"""API endpoints для передзвону"""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis
import json

from app.database import get_db
from app.core.config import settings
from app.core.exceptions import BadRequestException
from app.schemas.callback import CallbackRequest, CallbackResponse

router = APIRouter()

# Підключення до Redis для rate limiting
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except:
    redis_client = None


def get_client_ip(request: Request) -> str:
    """Отримання IP адреси клієнта"""
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
        
        if current_requests and int(current_requests) >= 3:
            raise BadRequestException("Перевищено ліміт запитів. Спробуйте пізніше (макс 3 на годину)")
        
        # Збільшуємо лічильник (TTL 1 година)
        if current_requests:
            redis_client.incr(rate_limit_key)
        else:
            redis_client.setex(rate_limit_key, 3600, 1)
    
    # Тут можна додати логіку для збереження запиту в БД
    # або відправки email/SMS менеджерам
    
    # Наприклад, можна зберегти в Redis для обробки
    if redis_client:
        callback_key = f"callback_queue:{callback_data.phone}"
        callback_data_dict = {
            "phone": callback_data.phone,
            "name": callback_data.name,
            "ip": client_ip,
            "timestamp": str(datetime.utcnow())
        }
        redis_client.lpush(callback_key, json.dumps(callback_data_dict))
        redis_client.expire(callback_key, 86400)  # Зберігаємо 24 години
    
    return CallbackResponse(
        success=True,
        message="Ваш запит прийнято. Ми передзвонимо вам найближчим часом."
    )


# Додаємо імпорт datetime
from datetime import datetime


