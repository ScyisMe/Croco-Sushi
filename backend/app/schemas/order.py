from pydantic import BaseModel, ConfigDict, Field, model_validator
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from app.schemas.address import AddressResponse


class OrderItemBase(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    quantity: int = Field(..., gt=0)
    price: Decimal


class OrderItemCreate(BaseModel):
    """Схема для створення позиції замовлення - ціна та назва товару завжди беруться з БД"""
    product_id: int = Field(..., description="ID товару (обов'язкове)")
    product_name: Optional[str] = Field(None, description="Назва товару (опціональна, завжди береться з БД для безпеки)")
    quantity: int = Field(..., gt=0, le=100, description="Кількість товару (макс 100)")
    size_id: Optional[int] = Field(None, description="ID розміру порції")
    # price не включено - завжди береться з БД для безпеки


class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int
    size_id: Optional[int] = None  # ID розміру порції
    size_name: Optional[str] = None  # Назва розміру порції
    product_image: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OrderBase(BaseModel):
    customer_name: str = Field(..., min_length=2)
    customer_phone: str = Field(..., min_length=10, max_length=20)
    customer_email: Optional[str] = None
    address_id: Optional[int] = None
    payment_method: Optional[str] = None  # cash, card, online
    comment: Optional[str] = Field(None, max_length=500)
    items: List[OrderItemCreate]


class OrderCreate(OrderBase):
    """Створення замовлення"""
    # Додатково для неавторизованих користувачів
    delivery_type: Optional[str] = "delivery"  # delivery або pickup
    city: Optional[str] = None
    street: Optional[str] = None
    house: Optional[str] = None
    apartment: Optional[str] = None
    address_comment: Optional[str] = None
    promo_code: Optional[str] = None # Промокод, введений користувачем

    @model_validator(mode='after')
    def validate_address_fields(self) -> 'OrderCreate':
        # Якщо тип доставки - самовивіз, адреса не потрібна
        if self.delivery_type == "pickup":
            return self
        
        # Якщо вказана вулиця - це завжди створення нової адреси (або разова адреса)
        # Тому обов'язково потрібні номер будинку (місто має дефолт)
        if self.street:
            if not self.house:
                raise ValueError("Будь ласка, вкажіть номер будинку")
        
        # Якщо вулиця не вказана - має бути address_id (для авторизованих)
        elif not self.address_id:
             raise ValueError("Необхідно вказати адресу доставки")
             
        return self


class OrderHistoryResponse(BaseModel):
    id: int
    order_id: int
    manager_name: str
    previous_status: str
    new_status: str
    comment: Optional[str] = None
    changed_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class OrderHistoryLogResponse(OrderHistoryResponse):
    """Розширена відповідь для журналу історії"""
    order_number: str
    customer_name: str
    total_amount: Decimal


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_method: Optional[str] = None
    comment: Optional[str] = None


class OrderListResponse(BaseModel):
    """Полегшена схема для списків замовлень (без вкладених об'єктів)"""
    id: int
    order_number: str
    status: str
    total_amount: Decimal
    created_at: datetime
    customer_name: Optional[str]
    customer_phone: str
    
    # Опціонально можна додати кількість товарів, якщо треба
    # items_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    order_number: str
    user_id: Optional[int]
    address_id: Optional[int]
    status: str
    total_amount: Decimal
    delivery_cost: Decimal
    discount: Decimal
    promo_code_name: Optional[str] = None
    payment_method: Optional[str]
    delivery_time: Optional[datetime]
    customer_name: Optional[str]
    customer_phone: str
    customer_email: Optional[str] = None  # Email для сповіщень
    comment: Optional[str]
    internal_comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    history: List[OrderHistoryResponse] = []

    delivery_type: Optional[str] = "delivery"
    address: Optional[AddressResponse] = None

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|confirmed|preparing|ready|delivering|completed|cancelled)$")
    comment: Optional[str] = None
    reason: Optional[str] = Field(None, max_length=500, description="Причина зміни статусу (обов'язкова для скасування)")


class OrderTrack(BaseModel):
    """Публічна інформація для відстеження замовлення"""
    order_number: str
    status: str
    created_at: datetime
    total_amount: Decimal
    
    # Додаткові поля для відображення
    delivery_type: str = "delivery" # delivery або pickup
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    delivery_time: Optional[datetime] = None
    comment: Optional[str] = None
    

    # Адреса (flattened або nested - оберемо flattened для простоти)
    city: Optional[str] = None
    street: Optional[str] = None
    building: Optional[str] = Field(None, alias="house") # Alias to match frontend
    apartment: Optional[str] = None
    entrance: Optional[str] = None
    floor: Optional[str] = None
    
    # Деталі замовлення
    items: List[OrderItemResponse] = []
    delivery_cost: Decimal = Decimal("0.00")
    discount: Decimal = Decimal("0.00")
    
    # Історія статусів
    status_history: Optional[List[dict]] = None

    model_config = ConfigDict(from_attributes=True)








