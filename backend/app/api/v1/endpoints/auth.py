"""API endpoints для аутентифікації"""
from typing import Optional
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
import redis

from app.database import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_2fa_secret,
    generate_2fa_qr_code,
    verify_2fa_token,
    generate_backup_codes,
    generate_sms_code,
    validate_password_strength,
    is_password_common
)
from app.core.dependencies import get_current_active_user, get_optional_user
from app.core.exceptions import (
    UnauthorizedException,
    BadRequestException,
    ConflictException,
    NotFoundException,
    ForbiddenException
)
from pydantic import Field
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    TokenData,
    SendSMSRequest,
    VerifySMSRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    SMSResponse,
    RefreshTokenRequest
)

router = APIRouter()

# Підключення до Redis для зберігання SMS кодів та rate limiting
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


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Реєстрація нового користувача"""
    # Нормалізація номера телефону
    if user_data.phone:
        digits = ''.join(filter(str.isdigit, user_data.phone))
        user_data.phone = f"+{digits}"

    # Перевірка чи існує користувач з таким телефоном
    result = await db.execute(select(User).where(User.phone == user_data.phone))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise ConflictException("Користувач з таким телефоном вже існує")
    
    # Перевірка email, якщо вказано
    if user_data.email:
        result = await db.execute(select(User).where(User.email == user_data.email))
        existing_email = result.scalar_one_or_none()
        if existing_email:
            raise ConflictException("Користувач з таким email вже існує")
    
    # Створення користувача
    hashed_password = None
    if user_data.password:
        # Валідація сили пароля
        is_valid, error_msg = validate_password_strength(user_data.password)
        if not is_valid:
            raise BadRequestException(error_msg)
        
        # Перевірка на загальні паролі
        if is_password_common(user_data.password):
            raise BadRequestException("Пароль занадто простий. Оберіть більш складний пароль")
        
        hashed_password = get_password_hash(user_data.password)
    
    # Створення користувача з обробкою race condition
    from sqlalchemy.exc import IntegrityError
    
    try:
        new_user = User(
            phone=user_data.phone,
            email=user_data.email,
            name=user_data.name,
            hashed_password=hashed_password,
            is_active=True
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        # Send welcome email
        if new_user.email:
            try:
                from app.tasks.email import schedule_welcome_email
                schedule_welcome_email(new_user.email, new_user.name or "Шановний клієнте")
            except Exception as e:
                # Don't fail registration if email fails
                print(f"Failed to send welcome email: {e}")
        
        return new_user
    
    except IntegrityError as e:
        await db.rollback()
        # Перевіряємо яке саме поле викликало конфлікт
        # Перевірка phone
        result = await db.execute(select(User).where(User.phone == user_data.phone))
        if result.scalar_one_or_none():
            raise ConflictException("Користувач з таким телефоном вже існує")
        
        # Перевірка email
        if user_data.email:
            result = await db.execute(select(User).where(User.email == user_data.email))
            if result.scalar_one_or_none():
                raise ConflictException("Користувач з таким email вже існує")
        
        # Якщо не знайшли конфлікт - це інша помилка
        raise ConflictException("Помилка створення користувача")


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Вхід користувача"""
    # Нормалізація номера телефону
    if credentials.phone:
        digits = ''.join(filter(str.isdigit, credentials.phone))
        credentials.phone = f"+{digits}"

    # Пошук користувача
    if credentials.phone:
        result = await db.execute(select(User).where(User.phone == credentials.phone))
    elif credentials.email:
        result = await db.execute(select(User).where(User.email == credentials.email))
    else:
        raise BadRequestException("Необхідно вказати телефон або email")
        
    user = result.scalar_one_or_none()
    
    if not user:
        raise UnauthorizedException("Невірний телефон або пароль")
    
    if not user.is_active:
        raise ForbiddenException("Користувач неактивний")
    
    # Перевірка пароля
    if not user.hashed_password:
        raise UnauthorizedException("Пароль не встановлено. Відновіть пароль")
    
    if not verify_password(credentials.password, user.hashed_password):
        raise UnauthorizedException("Невірний телефон або пароль")
    
    # Перевірка 2FA
    if user.two_factor_enabled:
        # Потрібно повернути спеціальний статус для 2FA
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="Потрібна 2FA автентифікація"
        )
    
    # Створення токенів
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Оновлення access токену через refresh токен"""
    payload = decode_refresh_token(token_data.refresh_token)
    
    if payload is None:
        raise UnauthorizedException("Невірний refresh токен")
    
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("Невірний refresh токен")
    
    try:
        user_id_int = int(user_id)
    except ValueError:
        raise UnauthorizedException("Невірний формат ID користувача")
    
    result = await db.execute(select(User).where(User.id == user_id_int))
    user = result.scalar_one_or_none()
    
    if not user:
        raise UnauthorizedException("Користувач не знайдено")
    
    if not user.is_active:
        raise ForbiddenException("Користувач неактивний")
    
    # Створення нових токенів
    access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/2fa/enable")
async def enable_2fa(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Увімкнути 2FA"""
    if current_user.two_factor_enabled:
        raise BadRequestException("2FA вже увімкнено")
    
    # Генерація секрету
    secret = generate_2fa_secret()
    backup_codes = generate_backup_codes()
    
    # Збереження секрету (поки не підтверджено)
    current_user.two_factor_secret = secret
    current_user.two_factor_backup_codes = json.dumps(backup_codes)
    await db.commit()
    
    # Генерація QR-коду
    email = current_user.email or current_user.phone
    qr_code = generate_2fa_qr_code(secret, email)
    
    return {
        "secret": secret,
        "qr_code": qr_code,
        "backup_codes": backup_codes,
        "message": "Скануйте QR-код в Google Authenticator"
    }


@router.post("/2fa/verify")
async def verify_2fa_code(
    code: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Підтвердження 2FA коду та активація"""
    if not current_user.two_factor_secret:
        raise BadRequestException("2FA не налаштовано")
    
    if not verify_2fa_token(current_user.two_factor_secret, code):
        raise UnauthorizedException("Невірний 2FA код")
    
    # Активація 2FA
    current_user.two_factor_enabled = True
    await db.commit()
    
    return {"message": "2FA увімкнено успішно"}


@router.post("/2fa/disable")
async def disable_2fa(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Вимкнути 2FA"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Attempting to disable 2FA for user {current_user.id}. Enabled status: {current_user.two_factor_enabled}")
    
    if not current_user.two_factor_enabled:
        raise BadRequestException("2FA не увімкнено")
    
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    current_user.two_factor_backup_codes = None
    await db.commit()
    
    return {"message": "2FA вимкнено успішно"}


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user)
):
    """Вихід користувача (на клієнті видаляється токен)"""
    # В майбутньому можна додати blacklist для токенів
    return {"message": "Вихід виконано успішно"}


@router.post("/logout-all")
async def logout_all(
    current_user: User = Depends(get_current_active_user)
):
    """Вихід з усіх пристроїв (на клієнті видаляються всі токени)"""
    # В майбутньому можна додати генерацію нового secret для інвалідації всіх токенів
    return {"message": "Вихід з усіх пристроїв виконано"}


@router.post("/send-sms", response_model=SMSResponse)
async def send_sms_code(
    request_data: SendSMSRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Відправка SMS коду для швидкого входу"""
    if not redis_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SMS service temporarily unavailable"
        )
    
    # Нормалізація номера телефону (видаляємо пробіли та спецсимволи)
    phone = ''.join(filter(str.isdigit, request_data.phone))
    if not phone or len(phone) < 10:
        raise BadRequestException("Невірний номер телефону")
    
    # Rate limiting: максимум 3 запити на 15 хвилин для одного номера
    rate_limit_key = f"sms_send_rate:{phone}"
    attempts = redis_client.get(rate_limit_key)
    
    if attempts and int(attempts) >= 3:
        raise BadRequestException(
            "Перевищено ліміт запитів. Спробуйте пізніше (макс 3 на 15 хвилин)"
        )
    
    # Збільшуємо лічильник
    if attempts:
        redis_client.incr(rate_limit_key)
    else:
        redis_client.setex(rate_limit_key, 900, 1)  # 15 хвилин TTL
    
    # Генерація коду
    code = generate_sms_code()
    
    # Зберігаємо код в Redis на 5 хвилин
    redis_client.setex(f"sms_code:{phone}", 300, code)
    
    # Відправка SMS через Celery task (асинхронно)
    from app.tasks.sms import send_verification_code
    send_verification_code.delay(phone, code)
    
    # НЕ ПОВЕРТАЄМО КОД В ОТВІТІ - це критична помилка безпеки
    return {"message": "SMS код відправлено"}


@router.post("/verify-sms", response_model=Token)
async def verify_sms_code(
    request_data: VerifySMSRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Підтвердження SMS коду для входу"""
    if not redis_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SMS verification service temporarily unavailable"
        )
    
    # Нормалізація номера телефону
    phone = ''.join(filter(str.isdigit, request_data.phone))
    if not phone or len(phone) < 10:
        raise BadRequestException("Невірний номер телефону")
    
    # Нормалізація коду (видаляємо пробіли)
    code = request_data.code.strip()
    if not code or len(code) != 6:
        raise BadRequestException("Невірний формат коду")
    
    # Rate limiting: максимум 5 спроб на 15 хвилин для одного номера
    rate_limit_key = f"sms_verify_rate:{phone}"
    attempts = redis_client.get(rate_limit_key)
    
    if attempts and int(attempts) >= 5:
        raise BadRequestException(
            "Перевищено ліміт спроб. Спробуйте пізніше (макс 5 на 15 хвилин)"
        )
    
    # КРИТИЧНО: Перевірка коду з Redis ПЕРЕД будь-якою іншою логікою
    stored_code = redis_client.get(f"sms_code:{phone}")
    
    if not stored_code or stored_code != code:
        # Збільшуємо лічильник невдалих спроб
        if attempts:
            redis_client.incr(rate_limit_key)
        else:
            redis_client.setex(rate_limit_key, 900, 1)  # 15 хвилин TTL
        
        raise UnauthorizedException("Невірний SMS код")
    
    # Код вірний - видаляємо його з Redis та скидаємо rate limit
    redis_client.delete(f"sms_code:{phone}")
    redis_client.delete(rate_limit_key)
    
    # Тільки після успішної валідації коду:
    # Пошук користувача
    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()
    
    # Автоматична реєстрація тільки якщо користувач не існує
    # Це безпечно, бо код вже пройшов валідацію
    if not user:
        user = User(
            phone=phone,
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    if not user.is_active:
        raise ForbiddenException("Користувач неактивний")
    
    # Перевірка 2FA для адмінів
    if user.is_admin and user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="Потрібна 2FA автентифікація"
        )
    
    # Створення токенів
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/reset-password", response_model=SMSResponse)
async def reset_password(
    request_data: ResetPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Відновлення пароля (відправка SMS коду)"""
    if not redis_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password reset service temporarily unavailable"
        )
    
    # Нормалізація номера телефону
    phone = ''.join(filter(str.isdigit, request_data.phone))
    if not phone or len(phone) < 10:
        raise BadRequestException("Невірний номер телефону")
    
    # Перевірка існування користувача
    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()
    
    if not user:
        raise NotFoundException("Користувач не знайдено")
    
    # Rate limiting: максимум 3 запити на 15 хвилин для одного номера
    rate_limit_key = f"reset_password_rate:{phone}"
    attempts = redis_client.get(rate_limit_key)
    
    if attempts and int(attempts) >= 3:
        raise BadRequestException(
            "Перевищено ліміт запитів. Спробуйте пізніше (макс 3 на 15 хвилин)"
        )
    
    # Збільшуємо лічильник
    if attempts:
        redis_client.incr(rate_limit_key)
    else:
        redis_client.setex(rate_limit_key, 900, 1)  # 15 хвилин TTL
    
    # Генерація коду
    code = generate_sms_code()
    
    # Зберігаємо код в Redis на 10 хвилин (більше часу для password reset)
    # Два ключі: phone -> code та code -> phone для швидкого пошуку
    redis_client.setex(f"reset_password:{phone}", 600, code)
    redis_client.setex(f"reset_password_code:{code}", 600, phone)
    
    # Відправка SMS через Celery task (асинхронно)
    from app.tasks.sms import send_verification_code
    send_verification_code.delay(phone, code)
    
    return {"message": "SMS код для відновлення пароля відправлено"}


@router.post("/change-password", response_model=SMSResponse)
async def change_password(
    request_data: ChangePasswordRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """Зміна пароля (з токеном або з кодом відновлення)
    
    Два варіанти використання:
    1. Авторизований користувач: передає тільки new_password (без reset_code)
    2. Невторизований (password reset): передає new_password та reset_code
    """
    user = current_user
    
    # Відновлення пароля через код (якщо не авторизований)
    if not user:
        if not request_data.reset_code:
            raise UnauthorizedException("Потрібна авторизація або код відновлення")
        
        if not redis_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Password reset service temporarily unavailable"
            )
        
        # Нормалізація коду
        reset_code = request_data.reset_code.strip()
        if not reset_code or len(reset_code) != 6:
            raise BadRequestException("Невірний формат коду")
        
        # Отримуємо phone за кодом з Redis
        phone = redis_client.get(f"reset_password_code:{reset_code}")
        
        if not phone:
            raise UnauthorizedException("Код відновлення недійсний або застарів")
        
        # Перевіряємо код з іншого ключа (для додаткової безпеки)
        stored_code = redis_client.get(f"reset_password:{phone}")
        if not stored_code or stored_code != reset_code:
            raise UnauthorizedException("Невірний код відновлення")
        
        # Знаходимо користувача
        result = await db.execute(select(User).where(User.phone == phone))
        user = result.scalar_one_or_none()
        
        if not user:
            raise NotFoundException("Користувач не знайдено")
        
        # Видаляємо коди з Redis після успішної перевірки
        redis_client.delete(f"reset_password:{phone}")
        redis_client.delete(f"reset_password_code:{reset_code}")
    
    # Перевірка, що користувач знайдено
    if not user:
        raise UnauthorizedException("Не авторизовано")
    
    # Оновлення пароля
    # Якщо це зміна пароля авторизованим користувачем (не скидання), перевіряємо старий пароль
    if not request_data.reset_code:
        if not request_data.old_password:
             raise BadRequestException("Потрібно вказати старий пароль")
        if not verify_password(request_data.old_password, user.hashed_password):
            raise UnauthorizedException("Невірний старий пароль")

    user.hashed_password = get_password_hash(request_data.new_password)
    await db.commit()
    
    return {"message": "Пароль успішно змінено"}


@router.get("/2fa/backup-codes")
async def get_backup_codes(
    current_user: User = Depends(get_current_active_user)
):
    """Отримання backup кодів для 2FA"""
    if not current_user.two_factor_enabled:
        raise BadRequestException("2FA не увімкнено")
    
    if not current_user.two_factor_backup_codes:
        raise BadRequestException("Backup коди не знайдено")
    
    backup_codes = json.loads(current_user.two_factor_backup_codes)
    
    return {"backup_codes": backup_codes}


