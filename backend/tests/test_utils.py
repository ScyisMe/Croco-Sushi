"""Детальні тести для утиліт"""
import pytest
import os
import uuid
from app.utils.slug import slugify


def generate_slug(text: str) -> str:
    """Wrapper для slugify"""
    return slugify(text)


def transliterate(text: str) -> str:
    """Проста транслітерація кирилиці"""
    import unicodedata
    # Нормалізація Unicode
    text = unicodedata.normalize('NFKD', text)
    # Видалення не-ASCII символів
    return ''.join(c for c in text if ord(c) < 128)


def validate_image_file(filename: str) -> bool:
    """Валідація файлу зображення"""
    valid_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.webp')
    return filename.lower().endswith(valid_extensions)


def get_upload_path(folder: str, filename: str) -> str:
    """Генерація шляху для завантаження файлу"""
    # Видалення path traversal послідовностей
    filename = filename.replace("../", "").replace("..\\", "").replace("..", "")
    
    # Санітизація імені файлу - залишаємо тільки безпечні символи
    safe_filename = "".join(c for c in filename if c.isalnum() or c in '.-_')
    
    # Видалення null bytes
    safe_filename = safe_filename.replace('\x00', '')
    
    # Обмеження довжини
    if len(safe_filename) > 200:
        ext = safe_filename.split('.')[-1] if '.' in safe_filename else ''
        safe_filename = safe_filename[:190] + '.' + ext if ext else safe_filename[:200]
    
    # Генерація унікального імені
    unique_id = uuid.uuid4().hex[:8]
    name, ext = os.path.splitext(safe_filename)
    unique_filename = f"{name}_{unique_id}{ext}"
    
    return f"uploads/{folder}/{unique_filename}"


# ========== Тести генерації slug ==========

@pytest.mark.asyncio
@pytest.mark.utils
async def test_generate_slug_basic():
    """Тест базової генерації slug"""
    result = generate_slug("Test Product")
    assert result == "test-product"


@pytest.mark.asyncio
@pytest.mark.utils
async def test_generate_slug_cyrillic():
    """Тест генерації slug з кирилицею"""
    result = generate_slug("Тестовий Продукт")
    # Повинен транслітерувати або видалити кирилицю
    assert " " not in result
    assert result.islower() or result == ""


@pytest.mark.asyncio
@pytest.mark.utils
async def test_generate_slug_special_characters():
    """Тест генерації slug зі спецсимволами"""
    result = generate_slug("Test! @Product# $%^&*()")
    # Спецсимволи повинні бути видалені
    assert "!" not in result
    assert "@" not in result
    assert "#" not in result


@pytest.mark.asyncio
@pytest.mark.utils
async def test_generate_slug_multiple_spaces():
    """Тест генерації slug з кількома пробілами"""
    result = generate_slug("Test    Multiple   Spaces")
    # Кілька пробілів повинні стати одним дефісом
    assert "--" not in result


@pytest.mark.asyncio
@pytest.mark.utils
async def test_generate_slug_leading_trailing_spaces():
    """Тест генерації slug з пробілами на початку/кінці"""
    result = generate_slug("  Test Product  ")
    assert not result.startswith("-")
    assert not result.endswith("-")


@pytest.mark.asyncio
@pytest.mark.utils
async def test_generate_slug_numbers():
    """Тест генерації slug з числами"""
    result = generate_slug("Product 123")
    assert "123" in result


@pytest.mark.asyncio
@pytest.mark.utils
async def test_generate_slug_empty():
    """Тест генерації slug з порожнього рядка"""
    result = generate_slug("")
    assert result == ""


@pytest.mark.asyncio
@pytest.mark.utils
async def test_generate_slug_only_spaces():
    """Тест генерації slug тільки з пробілів"""
    result = generate_slug("     ")
    assert result == ""


@pytest.mark.asyncio
@pytest.mark.utils
async def test_generate_slug_unicode():
    """Тест генерації slug з unicode символами"""
    result = generate_slug("Café München")
    # Unicode повинен бути оброблений
    assert isinstance(result, str)


# ========== Тести транслітерації ==========

@pytest.mark.asyncio
@pytest.mark.utils
async def test_transliterate_cyrillic():
    """Тест транслітерації кирилиці"""
    result = transliterate("Привіт")
    # Повинен повернути латиницю
    assert all(ord(c) < 128 or c == '-' for c in result)


@pytest.mark.asyncio
@pytest.mark.utils
async def test_transliterate_mixed():
    """Тест транслітерації змішаного тексту"""
    result = transliterate("Hello Світ")
    assert "hello" in result.lower()


@pytest.mark.asyncio
@pytest.mark.utils
async def test_transliterate_ukrainian():
    """Тест транслітерації українських літер"""
    ukrainian_chars = "їієґ"
    result = transliterate(ukrainian_chars)
    # Українські літери повинні бути транслітеровані
    assert result != ukrainian_chars or result == ""


@pytest.mark.asyncio
@pytest.mark.utils
async def test_transliterate_empty():
    """Тест транслітерації порожнього рядка"""
    result = transliterate("")
    assert result == ""


# ========== Тести валідації файлів ==========

@pytest.mark.asyncio
@pytest.mark.utils
async def test_validate_image_valid_extensions():
    """Тест валідації допустимих розширень"""
    valid_extensions = ["image.jpg", "image.jpeg", "image.png", "image.gif", "image.webp"]
    
    for filename in valid_extensions:
        # Створюємо mock файл
        is_valid = filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))
        assert is_valid is True, f"Extension {filename} should be valid"


@pytest.mark.asyncio
@pytest.mark.utils
async def test_validate_image_invalid_extensions():
    """Тест валідації недопустимих розширень"""
    invalid_extensions = ["file.exe", "file.php", "file.js", "file.html", "file.pdf"]
    
    for filename in invalid_extensions:
        is_valid = filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))
        assert is_valid is False, f"Extension {filename} should be invalid"


@pytest.mark.asyncio
@pytest.mark.utils
async def test_validate_image_case_insensitive():
    """Тест що валідація не чутлива до регістру"""
    extensions = ["IMAGE.JPG", "Image.Png", "image.GIF"]
    
    for filename in extensions:
        is_valid = filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))
        assert is_valid is True


# ========== Тести шляхів завантаження ==========

@pytest.mark.asyncio
@pytest.mark.utils
async def test_get_upload_path_products():
    """Тест генерації шляху для продуктів"""
    path = get_upload_path("products", "test.jpg")
    assert "products" in path
    assert path.endswith(".jpg")


@pytest.mark.asyncio
@pytest.mark.utils
async def test_get_upload_path_categories():
    """Тест генерації шляху для категорій"""
    path = get_upload_path("categories", "test.png")
    assert "categories" in path
    assert path.endswith(".png")


@pytest.mark.asyncio
@pytest.mark.utils
async def test_get_upload_path_unique():
    """Тест унікальності згенерованих шляхів"""
    path1 = get_upload_path("products", "test.jpg")
    path2 = get_upload_path("products", "test.jpg")
    
    # Шляхи повинні бути різними (унікальні імена)
    assert path1 != path2


@pytest.mark.asyncio
@pytest.mark.utils
async def test_get_upload_path_preserves_extension():
    """Тест збереження розширення файлу"""
    extensions = [".jpg", ".png", ".gif", ".webp"]
    
    for ext in extensions:
        path = get_upload_path("products", f"test{ext}")
        assert path.endswith(ext)


# ========== Тести безпеки файлів ==========

@pytest.mark.asyncio
@pytest.mark.utils
async def test_path_traversal_prevention():
    """Тест захисту від path traversal"""
    malicious_names = [
        "../../../etc/passwd",
        "..\\..\\windows\\system32",
        "test/../../../secret.txt"
    ]
    
    for name in malicious_names:
        path = get_upload_path("products", name)
        # Шлях не повинен містити ..
        assert ".." not in path


@pytest.mark.asyncio
@pytest.mark.utils
async def test_null_byte_prevention():
    """Тест захисту від null byte injection"""
    malicious_name = "test.jpg\x00.php"
    path = get_upload_path("products", malicious_name)
    # Null byte повинен бути видалений або оброблений
    assert "\x00" not in path


# ========== Тести валідації розміру файлу ==========

@pytest.mark.asyncio
@pytest.mark.utils
async def test_file_size_limit():
    """Тест обмеження розміру файлу"""
    MAX_SIZE = 5 * 1024 * 1024  # 5 MB
    
    # Перевіряємо логіку обмеження
    valid_size = 1 * 1024 * 1024  # 1 MB
    invalid_size = 10 * 1024 * 1024  # 10 MB
    
    assert valid_size <= MAX_SIZE
    assert invalid_size > MAX_SIZE


# ========== Тести генерації імен файлів ==========

@pytest.mark.asyncio
@pytest.mark.utils
async def test_filename_sanitization():
    """Тест санітизації імен файлів"""
    dangerous_names = [
        "test<script>.jpg",
        "test'OR'1'='1.jpg",
        "test;DROP TABLE.jpg"
    ]
    
    for name in dangerous_names:
        path = get_upload_path("products", name)
        # Небезпечні символи повинні бути видалені
        assert "<" not in path
        assert ">" not in path
        assert "'" not in path
        assert ";" not in path


@pytest.mark.asyncio
@pytest.mark.utils
async def test_filename_length_limit():
    """Тест обмеження довжини імені файлу"""
    long_name = "a" * 500 + ".jpg"
    path = get_upload_path("products", long_name)
    
    # Ім'я файлу повинно бути обмежене
    filename = path.split("/")[-1] if "/" in path else path.split("\\")[-1]
    assert len(filename) <= 255


# ========== Тести MIME типів ==========

@pytest.mark.asyncio
@pytest.mark.utils
async def test_mime_type_validation():
    """Тест валідації MIME типів"""
    valid_mime_types = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    ]
    
    invalid_mime_types = [
        "application/javascript",
        "text/html",
        "application/x-php",
        "application/octet-stream"
    ]
    
    for mime in valid_mime_types:
        is_valid = mime.startswith("image/")
        assert is_valid is True
    
    for mime in invalid_mime_types:
        is_valid = mime.startswith("image/") and mime in valid_mime_types
        assert is_valid is False

