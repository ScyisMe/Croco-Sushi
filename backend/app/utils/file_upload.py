"""Утиліти для завантаження та обробки файлів"""
import io
import uuid
import aiofiles
import logging
from pathlib import Path
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def get_upload_directory() -> Path:
    """Отримання шляху до директорії для завантаження файлів"""
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def get_static_directory() -> Path:
    """Отримання шляху до директорії для статичних файлів"""
    static_dir = Path("static")
    static_dir.mkdir(parents=True, exist_ok=True)
    return static_dir


def validate_image_file(file: UploadFile) -> None:
    """Валідація завантаженого зображення"""
    # Перевірка типу файлу
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимий тип файлу. Дозволені: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    # Перевірка розширення
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустиме розширення файлу. Дозволені: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )


def validate_file_size(file: UploadFile, max_size: Optional[int] = None) -> None:
    """Валідація розміру файлу"""
    max_size = max_size or settings.MAX_UPLOAD_SIZE
    
    # Перевірка розміру (після прочитання файлу)
    if hasattr(file, 'size') and file.size and file.size > max_size:
        size_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Файл занадто великий. Максимальний розмір: {size_mb}MB"
        )


def generate_unique_filename(original_filename: str, prefix: Optional[str] = None) -> str:
    """Генерація унікальної назви файлу"""
    file_ext = Path(original_filename).suffix.lower()
    unique_id = uuid.uuid4().hex[:8]
    safe_name = Path(original_filename).stem[:50]  # Обмежуємо довжину назви
    
    if prefix:
        filename = f"{prefix}_{unique_id}_{safe_name}{file_ext}"
    else:
        filename = f"{unique_id}_{safe_name}{file_ext}"
    
    return filename


async def save_uploaded_file(
    file: UploadFile,
    subdirectory: str = "general",
    prefix: Optional[str] = None,
    max_size: Optional[int] = None,
    validate_image: bool = True
) -> Tuple[str, str]:
    """Збереження завантаженого файлу
    
    Args:
        validate_image: Чи валідувати файл як зображення (за замовчуванням True)
    
    Returns:
        Tuple[str, str]: (file_path, file_url)
    """
    # Валідація subdirectory - захист від path traversal
    subdirectory = subdirectory.replace("..", "").replace("/", "").replace("\\", "")
    if not subdirectory:
        subdirectory = "general"
    
    # Валідація файлу (якщо це зображення)
    if validate_image:
        validate_image_file(file)
    
    # Створення директорії
    upload_dir = get_upload_directory() / subdirectory
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Генерація унікальної назви
    filename = generate_unique_filename(file.filename, prefix)
    file_path = upload_dir / filename
    
    # Читання та збереження файлу
    content = await file.read()
    
    # Перевірка розміру
    if len(content) > (max_size or settings.MAX_UPLOAD_SIZE):
        size_mb = (max_size or settings.MAX_UPLOAD_SIZE) / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Файл занадто великий. Максимальний розмір: {size_mb}MB"
        )
    
    # Збереження файлу
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)
    
    # Генерація URL
    file_url = f"/static/uploads/{subdirectory}/{filename}"
    
    return str(file_path), file_url


async def save_image_with_processing(
    file: UploadFile,
    subdirectory: str = "images",
    prefix: Optional[str] = None,
    max_size: Optional[int] = None,
    create_thumbnail: bool = False,
    thumbnail_size: Tuple[int, int] = (300, 300),
    convert_to_webp: bool = False
) -> Tuple[str, str, Optional[str]]:
    """Збереження зображення з обробкою
    
    Returns:
        Tuple[str, str, Optional[str]]: (file_path, file_url, thumbnail_url)
    """
    # Валідація subdirectory - захист від path traversal
    if ".." in subdirectory or "/" in subdirectory or "\\" in subdirectory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимий subdirectory"
        )
    
    # Валідація
    validate_image_file(file)
    
    # Створення директорії
    upload_dir = get_upload_directory() / subdirectory
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Генерація унікальної назви
    original_ext = Path(file.filename).suffix.lower()
    target_ext = ".webp" if convert_to_webp else original_ext
    filename = generate_unique_filename(file.filename, prefix)
    
    # Змінюємо розширення якщо конвертуємо
    if convert_to_webp:
        filename = Path(filename).with_suffix(".webp").name
    
    file_path = upload_dir / filename
    
    # Читання файлу
    content = await file.read()
    
    # Перевірка розміру
    if len(content) > (max_size or settings.MAX_UPLOAD_SIZE):
        size_mb = (max_size or settings.MAX_UPLOAD_SIZE) / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Файл занадто великий. Максимальний розмір: {size_mb}MB"
        )
    
    # Обробка зображення
    try:
        image = Image.open(io.BytesIO(content))
        
        # Конвертація в RGB якщо потрібно
        if image.mode in ("RGBA", "P") and not convert_to_webp:
            image = image.convert("RGB")
        elif convert_to_webp:
            if image.mode == "RGBA":
                # Для WebP зберігаємо альфа канал
                pass
            else:
                image = image.convert("RGB")
        
        # Збереження основного зображення
        if convert_to_webp:
            image.save(file_path, "WEBP", quality=85, optimize=True)
        else:
            image.save(file_path, quality=85, optimize=True)
        
        # Створення thumbnail якщо потрібно
        thumbnail_url = None
        if create_thumbnail:
            thumbnail_filename = f"thumb_{filename}"
            thumbnail_path = upload_dir / thumbnail_filename
            
            # Створюємо копію зображення для thumbnail (thumbnail модифікує зображення in-place)
            thumbnail_image = image.copy()
            thumbnail_image.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)
            
            if convert_to_webp:
                thumbnail_image.save(thumbnail_path, "WEBP", quality=75, optimize=True)
            else:
                thumbnail_image.save(thumbnail_path, quality=75, optimize=True)
            
            thumbnail_url = f"/static/uploads/{subdirectory}/{thumbnail_filename}"
        
    except Exception as e:
        # Не викриваємо деталі помилки (може містити шляхи до файлів)
        logger.error(f"Помилка обробки зображення: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Помилка обробки зображення"
        )
    
    # Генерація URL
    file_url = f"/static/uploads/{subdirectory}/{filename}"
    
    return str(file_path), file_url, thumbnail_url


def delete_file(file_path: str) -> bool:
    """Видалення файлу"""
    try:
        path = Path(file_path)
        if path.exists():
            path.unlink()
            return True
        return False
    except Exception:
        return False


def delete_file_by_url(file_url: str) -> bool:
    """Видалення файлу за URL з захистом від path traversal"""
    # Конвертуємо URL в шлях
    if file_url.startswith("/static/uploads/"):
        relative_path = file_url.replace("/static/uploads/", "")
        # Захист від path traversal - нормалізуємо шлях та перевіряємо що він всередині uploads
        try:
            # Використовуємо Path для нормалізації та перевірки
            normalized_path = Path(relative_path)
            # Перевіряємо що немає переходів на рівень вище (..)
            if ".." in normalized_path.parts:
                return False
            
            # Формуємо повний шлях
            file_path = get_upload_directory() / normalized_path
            
            # КРИТИЧНО: Перевіряємо що файл дійсно знаходиться всередині uploads директорії
            # Використовуємо resolve() для отримання абсолютного шляху
            upload_dir_abs = get_upload_directory().resolve()
            file_path_abs = file_path.resolve()
            
            # Перевіряємо що file_path_abs починається з upload_dir_abs
            try:
                file_path_abs.relative_to(upload_dir_abs)
            except ValueError:
                # Файл поза uploads директорією - блокуємо
                return False
            
            return delete_file(str(file_path))
        except Exception:
            # Будь-яка помилка - блокуємо видалення
            return False
    return False

