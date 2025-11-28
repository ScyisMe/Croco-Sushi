"""Утиліти безпеки"""
import re
import html
from typing import Optional
import secrets
import hashlib


def sanitize_html(text: str, allowed_tags: Optional[list] = None) -> str:
    """Санітизація HTML контенту - видаляє небезпечні теги та атрибути
    
    БЕЗПЕКА: Використовується для очищення user-generated контенту
    """
    if not text:
        return ""
    
    if allowed_tags is None:
        allowed_tags = ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'h3', 'h4']
    
    # Видаляємо script теги та їх вміст
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Видаляємо style теги та їх вміст
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Видаляємо on* атрибути (onclick, onerror, etc.)
    text = re.sub(r'\s+on\w+\s*=\s*["\'][^"\']*["\']', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s+on\w+\s*=\s*\S+', '', text, flags=re.IGNORECASE)
    
    # Видаляємо javascript: URLs
    text = re.sub(r'javascript\s*:', '', text, flags=re.IGNORECASE)
    
    # Видаляємо data: URLs (можуть містити XSS)
    text = re.sub(r'data\s*:', 'data-blocked:', text, flags=re.IGNORECASE)
    
    # Видаляємо vbscript: URLs
    text = re.sub(r'vbscript\s*:', '', text, flags=re.IGNORECASE)
    
    # Видаляємо недозволені теги (зберігаємо вміст)
    def remove_tag(match):
        tag = match.group(1).lower()
        if tag in allowed_tags:
            return match.group(0)
        return ''
    
    # Видаляємо відкриваючі теги
    text = re.sub(r'<(\w+)[^>]*>', remove_tag, text)
    
    # Видаляємо закриваючі теги
    def remove_closing_tag(match):
        tag = match.group(1).lower()
        if tag in allowed_tags:
            return match.group(0)
        return ''
    
    text = re.sub(r'</(\w+)>', remove_closing_tag, text)
    
    return text.strip()


def escape_html(text: str) -> str:
    """Екранування HTML символів
    
    БЕЗПЕКА: Використовується для безпечного відображення user input
    """
    if not text:
        return ""
    return html.escape(text)


def sanitize_filename(filename: str) -> str:
    """Санітизація імені файлу
    
    БЕЗПЕКА: Видаляє небезпечні символи з імен файлів
    """
    if not filename:
        return "unnamed"
    
    # Видаляємо path traversal символи
    filename = filename.replace("..", "")
    filename = filename.replace("/", "")
    filename = filename.replace("\\", "")
    
    # Видаляємо null bytes
    filename = filename.replace("\x00", "")
    
    # Залишаємо тільки безпечні символи
    filename = re.sub(r'[^\w\-_\. ]', '', filename)
    
    # Обмежуємо довжину
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:250] + ('.' + ext if ext else '')
    
    return filename or "unnamed"


def generate_secure_token(length: int = 32) -> str:
    """Генерація криптографічно безпечного токену"""
    return secrets.token_urlsafe(length)


def hash_sensitive_data(data: str, salt: Optional[str] = None) -> str:
    """Хешування чутливих даних (не для паролів - для них використовуйте bcrypt)
    
    Використовується для хешування токенів, API ключів тощо
    """
    if salt is None:
        salt = secrets.token_hex(16)
    
    combined = f"{salt}{data}"
    hashed = hashlib.sha256(combined.encode()).hexdigest()
    return f"{salt}${hashed}"


def verify_hashed_data(data: str, hashed_value: str) -> bool:
    """Перевірка хешованих даних"""
    try:
        salt, stored_hash = hashed_value.split('$')
        combined = f"{salt}{data}"
        computed_hash = hashlib.sha256(combined.encode()).hexdigest()
        return secrets.compare_digest(computed_hash, stored_hash)
    except (ValueError, AttributeError):
        return False


def mask_sensitive_data(data: str, visible_chars: int = 4) -> str:
    """Маскування чутливих даних (телефон, email тощо)
    
    Приклад: +380501234567 -> +380***4567
    """
    if not data:
        return ""
    
    if len(data) <= visible_chars * 2:
        return "*" * len(data)
    
    return data[:visible_chars] + "*" * (len(data) - visible_chars * 2) + data[-visible_chars:]


def validate_phone_format(phone: str) -> bool:
    """Валідація формату телефону
    
    БЕЗПЕКА: Перевіряє що телефон відповідає очікуваному формату
    """
    # Український формат: +380XXXXXXXXX
    pattern = r'^\+380\d{9}$'
    return bool(re.match(pattern, phone))


def validate_email_format(email: str) -> bool:
    """Базова валідація формату email
    
    БЕЗПЕКА: Перевіряє що email відповідає базовому формату
    """
    # Базовий паттерн для email
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email)) and len(email) <= 254


def is_safe_redirect_url(url: str, allowed_hosts: list) -> bool:
    """Перевірка чи URL безпечний для редіректу
    
    БЕЗПЕКА: Захист від Open Redirect вразливості
    """
    if not url:
        return False
    
    # Дозволяємо відносні URL
    if url.startswith('/') and not url.startswith('//'):
        return True
    
    # Перевіряємо абсолютні URL
    from urllib.parse import urlparse
    try:
        parsed = urlparse(url)
        return parsed.netloc in allowed_hosts
    except Exception:
        return False





