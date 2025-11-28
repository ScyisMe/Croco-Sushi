"""Допоміжні функції для тестів"""
import random
import string
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from app.core.security import get_password_hash, create_access_token


def generate_random_phone() -> str:
    """Генерує випадковий український номер телефону"""
    return f"+38050{random.randint(1000000, 9999999)}"


def generate_random_email() -> str:
    """Генерує випадковий email"""
    random_string = ''.join(random.choices(string.ascii_lowercase, k=8))
    return f"{random_string}@test.com"


def generate_random_string(length: int = 10) -> str:
    """Генерує випадковий рядок"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))


def generate_random_slug(prefix: str = "test") -> str:
    """Генерує випадковий slug"""
    random_part = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{prefix}-{random_part}"


def generate_random_price(min_price: float = 50.0, max_price: float = 500.0) -> Decimal:
    """Генерує випадкову ціну"""
    price = random.uniform(min_price, max_price)
    return Decimal(str(round(price, 2)))


def generate_order_number() -> str:
    """Генерує унікальний номер замовлення"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_part = ''.join(random.choices(string.digits, k=4))
    return f"TEST-{timestamp}-{random_part}"


def create_test_user_data(
    phone: Optional[str] = None,
    email: Optional[str] = None,
    name: str = "Test User",
    password: str = "TestPassword123",
    is_admin: bool = False
) -> Dict[str, Any]:
    """Створює дані для тестового користувача"""
    return {
        "phone": phone or generate_random_phone(),
        "email": email or generate_random_email(),
        "name": name,
        "hashed_password": get_password_hash(password),
        "is_active": True,
        "is_admin": is_admin
    }


def create_test_product_data(
    name: Optional[str] = None,
    slug: Optional[str] = None,
    category_id: int = 1,
    price: Optional[Decimal] = None
) -> Dict[str, Any]:
    """Створює дані для тестового продукту"""
    random_name = f"Test Product {generate_random_string(4)}"
    return {
        "name": name or random_name,
        "slug": slug or generate_random_slug("product"),
        "description": "Test product description",
        "price": price or generate_random_price(),
        "category_id": category_id,
        "is_available": True,
        "is_new": False,
        "is_popular": False
    }


def create_test_category_data(
    name: Optional[str] = None,
    slug: Optional[str] = None
) -> Dict[str, Any]:
    """Створює дані для тестової категорії"""
    random_name = f"Test Category {generate_random_string(4)}"
    return {
        "name": name or random_name,
        "slug": slug or generate_random_slug("category"),
        "description": "Test category description",
        "is_active": True,
        "position": random.randint(1, 100)
    }


def create_test_address_data(
    user_id: int,
    city: str = "Київ",
    is_default: bool = False
) -> Dict[str, Any]:
    """Створює дані для тестової адреси"""
    return {
        "user_id": user_id,
        "city": city,
        "street": f"Тестова вулиця {random.randint(1, 100)}",
        "house": str(random.randint(1, 200)),
        "apartment": str(random.randint(1, 500)),
        "entrance": str(random.randint(1, 10)),
        "floor": str(random.randint(1, 25)),
        "comment": "Тестовий коментар",
        "is_default": is_default
    }


def create_test_order_data(
    user_id: int,
    address_id: int,
    total_amount: Optional[Decimal] = None
) -> Dict[str, Any]:
    """Створює дані для тестового замовлення"""
    return {
        "user_id": user_id,
        "address_id": address_id,
        "order_number": generate_order_number(),
        "status": "pending",
        "total_amount": total_amount or generate_random_price(200, 1000),
        "delivery_cost": Decimal("50.00"),
        "discount": Decimal("0.00"),
        "payment_method": random.choice(["cash", "card", "online"]),
        "customer_phone": generate_random_phone()
    }


def create_test_review_data(
    user_id: int,
    product_id: int,
    rating: int = 5
) -> Dict[str, Any]:
    """Створює дані для тестового відгуку"""
    comments = [
        "Чудовий продукт!",
        "Дуже смачно, рекомендую",
        "Швидка доставка, все свіже",
        "Замовляю постійно",
        "Якість на висоті"
    ]
    return {
        "user_id": user_id,
        "product_id": product_id,
        "rating": rating,
        "comment": random.choice(comments),
        "is_published": False
    }


def create_test_promotion_data(
    title: Optional[str] = None,
    discount_value: Decimal = Decimal("10.00")
) -> Dict[str, Any]:
    """Створює дані для тестової акції"""
    now = datetime.now(timezone.utc)
    return {
        "title": title or f"Test Promotion {generate_random_string(4)}",
        "slug": generate_random_slug("promo"),
        "description": "Test promotion description",
        "discount_type": "percent",
        "discount_value": discount_value,
        "start_date": now - timedelta(days=1),
        "end_date": now + timedelta(days=30),
        "is_active": True
    }


def create_test_promo_code_data(
    code: Optional[str] = None,
    discount_value: Decimal = Decimal("10.00")
) -> Dict[str, Any]:
    """Створює дані для тестового промокоду"""
    now = datetime.now(timezone.utc)
    return {
        "code": code or generate_random_string(8).upper(),
        "description": "Test promo code",
        "discount_type": "percent",
        "discount_value": discount_value,
        "start_date": now - timedelta(days=1),
        "end_date": now + timedelta(days=30),
        "min_order_amount": Decimal("200.00"),
        "max_uses": 100,
        "max_uses_per_user": 1,
        "current_uses": 0,
        "is_active": True
    }


def create_test_delivery_zone_data(
    name: Optional[str] = None
) -> Dict[str, Any]:
    """Створює дані для тестової зони доставки"""
    return {
        "name": name or f"Test Zone {generate_random_string(4)}",
        "delivery_cost": Decimal("50.00"),
        "min_order_amount": Decimal("200.00"),
        "free_delivery_threshold": Decimal("500.00"),
        "delivery_time_minutes": 60,
        "is_active": True,
        "position": random.randint(1, 10)
    }


def get_auth_header(user_id: int) -> Dict[str, str]:
    """Створює заголовок авторизації для тестів"""
    token = create_access_token(data={"sub": str(user_id)})
    return {"Authorization": f"Bearer {token}"}


class MockFile:
    """Mock файл для тестування завантаження"""
    
    def __init__(
        self,
        filename: str,
        content: bytes = b"test content",
        content_type: str = "image/jpeg"
    ):
        self.filename = filename
        self.content = content
        self.content_type = content_type
        self.size = len(content)
    
    async def read(self) -> bytes:
        return self.content
    
    async def seek(self, position: int) -> None:
        pass


def create_mock_image(
    filename: str = "test.jpg",
    size_kb: int = 100
) -> MockFile:
    """Створює mock зображення для тестів"""
    # Створюємо контент потрібного розміру
    content = b"0" * (size_kb * 1024)
    
    # Визначаємо content_type за розширенням
    extension = filename.lower().split(".")[-1]
    content_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp"
    }
    content_type = content_types.get(extension, "application/octet-stream")
    
    return MockFile(filename, content, content_type)


async def assert_response_success(response, expected_status: int = 200):
    """Перевіряє успішну відповідь"""
    assert response.status_code == expected_status, \
        f"Expected {expected_status}, got {response.status_code}: {response.text}"


async def assert_response_error(response, expected_status: int, error_contains: str = None):
    """Перевіряє помилкову відповідь"""
    assert response.status_code == expected_status, \
        f"Expected {expected_status}, got {response.status_code}: {response.text}"
    
    if error_contains:
        detail = response.json().get("detail", "").lower()
        assert error_contains.lower() in detail, \
            f"Expected '{error_contains}' in error detail, got: {detail}"



