"""Celery tasks для обробки зображень"""
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image, ImageOps
import logging
from datetime import datetime, timedelta, timezone

from app.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)


def _prepare_image(image: Image.Image) -> Image.Image:
    """Допоміжна функція: виправляє орієнтацію EXIF
    
    Вирішує проблему з iPhone/Android фотографіями, які можуть
    бути повернуті при відкритті через Pillow.
    """
    try:
        return ImageOps.exif_transpose(image)
    except Exception:
        return image


@celery_app.task(name="app.tasks.image_processing.convert_to_webp")
def convert_to_webp(
    file_path: str,
    quality: int = 85,
    optimize: bool = True
) -> Optional[str]:
    """Конвертація зображення в WebP формат
    
    Args:
        file_path: Шлях до файлу
        quality: Якість (0-100)
        optimize: Оптимізувати розмір
    
    Returns:
        Шлях до конвертованого файлу або None
    """
    try:
        path = Path(file_path)
        if not path.exists():
            return None
        
        # Використовуємо context manager для безпечного закриття файлу
        with Image.open(path) as image:
            # Виправляємо орієнтацію EXIF (для фото з телефонів)
            image = _prepare_image(image)
            
            # Конвертуємо в RGB якщо потрібно (WebP підтримує RGBA)
            if image.mode == "RGBA":
                # Для WebP залишаємо альфа канал
                pass
            elif image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGB")
            
            # Створюємо новий шлях з розширенням .webp
            webp_path = path.with_suffix(".webp")
            
            # Зберігаємо як WebP
            image.save(
                webp_path,
                "WEBP",
                quality=quality,
                optimize=optimize
            )
        
        # Видаляємо оригінальний файл якщо він не WebP (тільки після успішного збереження)
        if webp_path.exists() and path.suffix.lower() != ".webp":
            path.unlink()
        
        return str(webp_path)
    
    except Exception as e:
        logger.error(f"Помилка конвертації в WebP: {e}", exc_info=True)
        return None


@celery_app.task(name="app.tasks.image_processing.create_thumbnail")
def create_thumbnail(
    file_path: str,
    size: Tuple[int, int] = (300, 300),
    quality: int = 75,
    prefix: str = "thumb_"
) -> Optional[str]:
    """Створення thumbnail зображення
    
    Args:
        file_path: Шлях до оригінального файлу
        size: Розмір thumbnail (width, height)
        quality: Якість (0-100)
        prefix: Префікс для назви файлу
    
    Returns:
        Шлях до thumbnail або None
    """
    try:
        path = Path(file_path)
        if not path.exists():
            return None
        
        with Image.open(path) as image:
            # Виправляємо орієнтацію EXIF
            image = _prepare_image(image)
            
            # Створюємо копію та змінюємо розмір
            thumbnail = image.copy()
            thumbnail.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Створюємо новий шлях
            thumbnail_path = path.parent / f"{prefix}{path.name}"
            ext = path.suffix.lower()
            
            # Специфічна логіка збереження для різних форматів
            if ext == ".webp":
                thumbnail.save(thumbnail_path, "WEBP", quality=quality, optimize=True)
            
            elif ext == ".png":
                # PNG зберігаємо як PNG, зберігаючи прозорість
                thumbnail.save(thumbnail_path, "PNG", optimize=True)
            
            else:
                # JPG та інші без прозорості -> конвертуємо в RGB з білим фоном
                if thumbnail.mode == "RGBA":
                    background = Image.new("RGB", thumbnail.size, (255, 255, 255))
                    background.paste(thumbnail, mask=thumbnail.split()[3])
                    thumbnail = background
                elif thumbnail.mode != "RGB":
                    thumbnail = thumbnail.convert("RGB")
                
                # Зберігаємо у форматі оригіналу (зазвичай JPEG)
                thumbnail.save(thumbnail_path, quality=quality, optimize=True)
        
        return str(thumbnail_path)
    
    except Exception as e:
        logger.error(f"Помилка створення thumbnail: {e}", exc_info=True)
        return None


@celery_app.task(name="app.tasks.image_processing.optimize_image")
def optimize_image(
    file_path: str,
    max_size: Tuple[int, int] = (1920, 1080),
    quality: int = 85
) -> Optional[str]:
    """Оптимізація зображення (зменшення розміру та якості)
    
    Args:
        file_path: Шлях до файлу
        max_size: Максимальний розмір (width, height)
        quality: Якість (0-100)
    
    Returns:
        Шлях до оптимізованого файлу або None
    """
    try:
        path = Path(file_path)
        if not path.exists():
            return None
        
        with Image.open(path) as image:
            # Виправляємо орієнтацію EXIF
            image = _prepare_image(image)
            
            # Перевіряємо чи потрібно зменшувати
            if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
                # Зберігаємо пропорції
                image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            ext = path.suffix.lower()
            
            # Зберігаємо оптимізоване зображення
            if ext == ".webp":
                image.save(path, "WEBP", quality=quality, optimize=True)
            
            elif ext == ".png":
                # PNG зберігаємо як PNG, зберігаючи прозорість
                image.save(path, "PNG", optimize=True)
            
            else:
                # Конвертуємо в RGB якщо потрібно
                if image.mode == "RGBA":
                    background = Image.new("RGB", image.size, (255, 255, 255))
                    background.paste(image, mask=image.split()[3])
                    image = background
                elif image.mode != "RGB":
                    image = image.convert("RGB")
                
                image.save(path, quality=quality, optimize=True)
        
        return str(path)
    
    except Exception as e:
        logger.error(f"Помилка оптимізації зображення: {e}", exc_info=True)
        return None


@celery_app.task(name="app.tasks.image_processing.cleanup_old_files")
def cleanup_old_files(days: int = 30) -> int:
    """Очищення старих тимчасових файлів
    
    Args:
        days: Кількість днів, після яких файли вважаються старими
        
    Returns:
        Кількість видалених файлів
    """
    try:
        upload_dir = Path(settings.UPLOAD_DIR)
        if not upload_dir.exists():
            return 0
        
        # Використовуємо aware datetime для коректного порівняння
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        deleted_count = 0
        
        # Шукаємо файли в тимчасових директоріях
        temp_dirs = ["temp", "tmp"]
        
        for temp_dir in temp_dirs:
            temp_path = upload_dir / temp_dir
            if temp_path.exists():
                for file_path in temp_path.iterdir():
                    if file_path.is_file():
                        # Отримуємо час зміни і додаємо timezone UTC
                        stat = file_path.stat()
                        mod_time = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
                        
                        if mod_time < cutoff_date:
                            try:
                                file_path.unlink()
                                deleted_count += 1
                            except OSError:
                                pass  # Файл може бути зайнятий
        
        if deleted_count > 0:
            logger.info(f"Очищено {deleted_count} старих файлів")
        return deleted_count
    
    except Exception as e:
        logger.error(f"Помилка очищення файлів: {e}", exc_info=True)
        return 0
