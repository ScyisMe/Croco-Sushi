from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
import pyotp
import qrcode
from io import BytesIO
import base64

from app.core.config import settings

# Використовуємо bcrypt з обмеженням довжини пароля
# bcrypt має обмеження 72 байти, тому обмежуємо паролі до 72 символів
# Вимикаємо автоматичне визначення версії bcrypt, щоб уникнути помилок
import os
# Вимкнути автоматичне визначення версії bcrypt
os.environ.setdefault('PASSLIB_DISABLE_BCRYPT_VERSION_DETECTION', '1')
# Створюємо CryptContext з простими налаштуваннями
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Перевірка пароля"""
    # Використовуємо bcrypt напряму, щоб уникнути проблем з passlib
    import bcrypt
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    try:
        return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
    except Exception:
        # Fallback на passlib для старих хешів
        return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Хешування пароля"""
    # Використовуємо bcrypt напряму, щоб уникнути проблем з passlib
    import bcrypt
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Створення JWT токену"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Декодування JWT токену з повною валідацією"""
    try:
        # БЕЗПЕКА: Явно вказуємо алгоритм та перевіряємо exp
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM],  # Явно вказуємо алгоритм (захист від алгоритму None)
            options={"verify_signature": True, "verify_exp": True, "verify_iat": False}
        )
        # Додаткова перевірка типу токену (access token не повинен мати type="refresh")
        if payload.get("type") == "refresh":
            return None  # Це refresh token, а не access token
        return payload
    except JWTError:
        return None


def create_refresh_token(data: dict) -> str:
    """Створення refresh токену (30 днів)"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_refresh_token(token: str) -> Optional[dict]:
    """Декодування refresh токену"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


def generate_2fa_secret() -> str:
    """Генерація секретного ключа для 2FA"""
    return pyotp.random_base32()


def generate_2fa_qr_code(secret: str, email: str, issuer: str = "Croco Sushi") -> str:
    """Генерація QR-коду для Google Authenticator"""
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name=issuer
    )
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"


def verify_2fa_token(secret: str, token: str) -> bool:
    """Перевірка 2FA токену"""
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)  # Дозволяє +/- 1 період (30 сек)


def generate_backup_codes(count: int = 10) -> list[str]:
    """Генерація backup кодів для 2FA"""
    return [secrets.token_hex(4).upper() for _ in range(count)]


def generate_sms_code(length: int = 6) -> str:
    """Генерація SMS коду для підтвердження"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(length)])


def get_token_data(token: str) -> Optional[dict]:
    """Отримання даних з токену (access або refresh)"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def validate_password_strength(password: str) -> tuple[bool, str]:
    """Валідація сили пароля"""
    if len(password) < 8:
        return False, "Пароль повинен містити мінімум 8 символів"
    
    if len(password) > 128:
        return False, "Пароль занадто довгий (макс 128 символів)"
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
    
    if not (has_upper or has_lower):
        return False, "Пароль повинен містити літери"
    
    if not has_digit:
        return False, "Пароль повинен містити хоча б одну цифру"
    
    # Перевірка на послідовності (123, abc, qwerty)
    common_sequences = ["123", "abc", "qwerty", "password"]
    password_lower = password.lower()
    for seq in common_sequences:
        if seq in password_lower:
            return False, "Пароль не повинен містити загальні послідовності"
    
    return True, ""


def is_password_common(password: str) -> bool:
    """Перевірка чи пароль є загальним/простим"""
    common_passwords = [
        "password", "12345678", "qwerty123", "admin123", "password123",
        "123456789", "1234567890", "qwerty", "abc123", "monkey",
        "1234567", "letmein", "trustno1", "dragon", "baseball",
        "iloveyou", "master", "sunshine", "ashley", "bailey"
    ]
    
    password_lower = password.lower()
    
    # Перевірка точкового збігу
    if password_lower in common_passwords:
        return True
    
    # Перевірка на повторювані символи (aaaa, 1111)
    if len(set(password)) < 3:
        return True
    
    # Перевірка на послідовні символи (abcd, 1234)
    if len(password) >= 4:
        for i in range(len(password) - 3):
            substr = password[i:i+4].lower()
            if substr.isdigit() or substr.isalpha():
                # Перевірка чи це послідовність
                if all(ord(substr[j+1]) - ord(substr[j]) == 1 for j in range(len(substr)-1)):
                    return True
    
    return False


