"""API endpoints для замовлень"""
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.core.dependencies import get_current_active_user, get_optional_user
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.product_size import ProductSize
from app.models.user import User
from app.models.address import Address
from app.schemas.order import OrderCreate, OrderResponse, OrderTrack, OrderStatusUpdate
from app.schemas.address import AddressCreate

router = APIRouter()


def generate_order_number() -> str:
    """Генерація унікального номера замовлення"""
    timestamp = datetime.now().strftime("%Y%m%d")
    random_part = secrets.token_hex(3).upper()
    return f"ORD-{timestamp}-{random_part}"


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Створення нового замовлення"""
    if not order_data.items:
        raise BadRequestException("Кошик порожній")
    
    # Перевірка товарів та підрахунок суми
    total_amount = Decimal("0.00")
    order_items_data = []
    
    for item_data in order_data.items:
        product = None
        size_price = item_data.price
        
        if item_data.product_id:
            result = await db.execute(select(Product).where(Product.id == item_data.product_id))
            product = result.scalar_one_or_none()
            
            if not product or not product.is_available:
                raise BadRequestException(f"Товар {item_data.product_name} недоступний")
            
            # Якщо вказано розмір
            if hasattr(item_data, 'size_id') and item_data.size_id:
                result = await db.execute(select(ProductSize).where(ProductSize.id == item_data.size_id))
                size = result.scalar_one_or_none()
                if size:
                    size_price = size.price
            else:
                # Використовуємо базову ціну товару
                size_price = product.price
        
        item_total = size_price * item_data.quantity
        total_amount += item_total
        
        order_items_data.append({
            "product_id": product.id if product else None,
            "product_name": item_data.product_name,
            "quantity": item_data.quantity,
            "price": size_price
        })
    
    # Розрахунок доставки (базова логіка)
    delivery_cost = Decimal("50.00")  # Базова вартість доставки
    if total_amount >= Decimal("500.00"):
        delivery_cost = Decimal("0.00")  # Безкоштовна доставка від 500 грн
    
    # Обробка адреси
    address_id = order_data.address_id
    
    # Якщо неавторизований користувач створив адресу
    if not current_user and (order_data.city or order_data.street):
        # Створюємо тимчасову адресу (або можна не зберігати)
        address_id = None
    
    # Якщо авторизований користувач і є адреса
    if current_user and order_data.address_id:
        result = await db.execute(
            select(Address).where(
                Address.id == order_data.address_id,
                Address.user_id == current_user.id
            )
        )
        address = result.scalar_one_or_none()
        if not address:
            raise NotFoundException("Адресу не знайдено")
        address_id = address.id
    
    # Створення замовлення
    order_number = generate_order_number()
    
    # Перевірка унікальності номера
    while True:
        result = await db.execute(select(Order).where(Order.order_number == order_number))
        if result.scalar_one_or_none() is None:
            break
        order_number = generate_order_number()
    
    new_order = Order(
        order_number=order_number,
        user_id=current_user.id if current_user else None,
        address_id=address_id,
        status="pending",
        total_amount=total_amount,
        delivery_cost=delivery_cost,
        discount=Decimal("0.00"),
        payment_method=order_data.payment_method,
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        comment=order_data.comment
    )
    
    db.add(new_order)
    await db.flush()  # Отримуємо ID замовлення
    
    # Створення позицій замовлення
    for item_data in order_items_data:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item_data["product_id"],
            product_name=item_data["product_name"],
            quantity=item_data["quantity"],
            price=item_data["price"]
        )
        db.add(order_item)
    
    await db.commit()
    await db.refresh(new_order)
    
    # Завантажуємо позиції
    result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == new_order.id)
    )
    new_order.items = result.scalars().all()
    
    return new_order


@router.get("/{order_number}/track", response_model=OrderTrack)
async def track_order(
    order_number: str,
    db: AsyncSession = Depends(get_db)
):
    """Відстеження замовлення за номером (публічний endpoint)"""
    result = await db.execute(select(Order).where(Order.order_number == order_number))
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Замовлення не знайдено")
    
    return order


@router.get("/me", response_model=List[OrderResponse])
async def get_my_orders(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Отримання моїх замовлень"""
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    orders = result.scalars().all()
    
    return orders


@router.get("/me/{order_id}", response_model=OrderResponse)
async def get_my_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Отримання деталей мого замовлення"""
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == current_user.id
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Замовлення не знайдено")
    
    return order


@router.post("/me/{order_id}/reorder", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def reorder(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Повторити замовлення"""
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == current_user.id
        )
    )
    old_order = result.scalar_one_or_none()
    
    if not old_order:
        raise NotFoundException("Замовлення не знайдено")
    
    # Створення нового замовлення на основі старого
    order_number = generate_order_number()
    
    new_order = Order(
        order_number=order_number,
        user_id=current_user.id,
        address_id=old_order.address_id,
        status="pending",
        total_amount=old_order.total_amount,
        delivery_cost=old_order.delivery_cost,
        discount=Decimal("0.00"),
        payment_method=old_order.payment_method,
        customer_name=old_order.customer_name or current_user.name,
        customer_phone=old_order.customer_phone or current_user.phone,
        comment=f"Повтор замовлення {old_order.order_number}"
    )
    
    db.add(new_order)
    await db.flush()
    
    # Копіювання позицій
    for old_item in old_order.items:
        new_item = OrderItem(
            order_id=new_order.id,
            product_id=old_item.product_id,
            product_name=old_item.product_name,
            quantity=old_item.quantity,
            price=old_item.price
        )
        db.add(new_item)
    
    await db.commit()
    await db.refresh(new_order)
    
    result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == new_order.id)
    )
    new_order.items = result.scalars().all()
    
    return new_order


