"""API endpoints для замовлень"""
from typing import List, Optional
from datetime import datetime, timezone
from decimal import Decimal
import secrets
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

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
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d")
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
    
    # Валідація: максимум 20 товарів в замовленні (згідно ТЗ)
    if len(order_data.items) > 20:
        raise BadRequestException("Максимальна кількість товарів в замовленні: 20")
    
    # Перевірка товарів та підрахунок суми
    # КРИТИЧНО: Ціна завжди береться з БД, ніколи не довіряємо клієнтському вводу
    total_amount = Decimal("0.00")
    order_items_data = []
    
    for item_data in order_data.items:
        # КРИТИЧНО: product_id є обов'язковим, перевірка вже на рівні Pydantic
        # Але додаємо додаткову перевірку для безпеки
        if not item_data.product_id:
            raise BadRequestException("product_id є обов'язковим полем для кожної позиції замовлення")
        
        # Завантажуємо товар з БД
        result = await db.execute(select(Product).where(Product.id == item_data.product_id))
        product = result.scalar_one_or_none()
        
        if not product:
            raise NotFoundException(f"Товар з ID {item_data.product_id} не знайдено")
        
        if not product.is_available:
            raise BadRequestException(f"Товар '{product.name}' недоступний")
        
        # Визначаємо ціну та розмір
        size_id = None
        size_name = None
        
        # Якщо вказано розмір - перевіряємо та беремо ціну з розміру
        if item_data.size_id:
            result = await db.execute(
                select(ProductSize).where(
                    ProductSize.id == item_data.size_id,
                    ProductSize.product_id == product.id  # Перевірка, що розмір належить товару
                )
            )
            size = result.scalar_one_or_none()
            
            if not size:
                raise NotFoundException(f"Розмір порції з ID {item_data.size_id} не знайдено для товару {product.name}")
            
            # Використовуємо ціну з розміру (завжди з БД)
            size_price = size.price
            size_id = size.id
            size_name = size.name
        else:
            # Використовуємо базову ціну товару (завжди з БД)
            size_price = product.price
        
        # Підрахунок суми для позиції (ціна завжди з БД)
        item_total = size_price * item_data.quantity
        total_amount += item_total
        
        # Зберігаємо дані позиції (ціна завжди з БД)
        order_items_data.append({
            "product_id": product.id,
            "product_name": product.name,  # Використовуємо назву з БД для консистентності
            "size_id": size_id,
            "size_name": size_name,
            "quantity": item_data.quantity,
            "price": size_price  # Ціна завжди з БД
        })
    
    # Валідація: мінімальна та максимальна сума замовлення
    MIN_ORDER_AMOUNT = Decimal("100.00")  # Базова мінімальна сума
    MAX_ORDER_AMOUNT = Decimal("50000.00")  # Максимальна сума замовлення (захист від переповнення)
    
    if total_amount < MIN_ORDER_AMOUNT:
        raise BadRequestException(f"Мінімальна сума замовлення: {MIN_ORDER_AMOUNT} грн")
    
    if total_amount > MAX_ORDER_AMOUNT:
        raise BadRequestException(f"Максимальна сума замовлення: {MAX_ORDER_AMOUNT} грн")
    
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
    
    # Створення замовлення з обробкою race condition
    from sqlalchemy.exc import IntegrityError
    
    order_number = generate_order_number()
    max_attempts = 100
    attempts = 0
    
    while attempts < max_attempts:
        try:
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
                customer_email=order_data.customer_email,  # Зберігаємо email для сповіщень
                comment=order_data.comment
            )
            
            db.add(new_order)
            await db.flush()  # Отримуємо ID замовлення
            break  # Успішно створено
            
        except IntegrityError:
            # Конфлікт унікальності - генеруємо новий номер
            await db.rollback()
            order_number = generate_order_number()
            attempts += 1
    else:
        raise BadRequestException("Не вдалося згенерувати унікальний номер замовлення")
    
    # Створення позицій замовлення
    for item_data in order_items_data:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item_data["product_id"],
            product_name=item_data["product_name"],
            size_id=item_data.get("size_id"),
            size_name=item_data.get("size_name"),
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
    
    # Відправка підтвердження замовлення через Celery (асинхронно)
    if order_data.customer_email:
        from app.tasks.email import send_order_confirmation
        send_order_confirmation.delay(new_order.id, order_data.customer_email)
    
    # Відправка SMS сповіщення (якщо є номер телефону)
    if order_data.customer_phone:
        from app.tasks.sms import send_order_notification
        send_order_notification.delay(
            order_data.customer_phone,
            order_number,
            "Створено"
        )
    
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
    """Повторити замовлення - перераховуємо ціни з БД"""
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == current_user.id
        ).options(selectinload(Order.items))
    )
    old_order = result.scalar_one_or_none()
    
    if not old_order:
        raise NotFoundException("Замовлення не знайдено")
    
    # Перераховуємо ціни з БД для нових позицій
    total_amount = Decimal("0.00")
    order_items_data = []
    
    for old_item in old_order.items:
        if not old_item.product_id:
            # Якщо товар був видалений, пропускаємо позицію
            continue
        
        # Завантажуємо товар з БД
        result = await db.execute(select(Product).where(Product.id == old_item.product_id))
        product = result.scalar_one_or_none()
        
        if not product:
            # Товар видалено - пропускаємо
            continue
        
        if not product.is_available:
            # Товар недоступний - пропускаємо
            continue
        
        # Визначаємо ціну та розмір (завжди з БД)
        size_id = None
        size_name = None
        
        # Якщо був розмір - перевіряємо та беремо ціну з розміру
        if old_item.size_id:
            result = await db.execute(
                select(ProductSize).where(
                    ProductSize.id == old_item.size_id,
                    ProductSize.product_id == product.id
                )
            )
            size = result.scalar_one_or_none()
            
            if size:
                size_price = size.price
                size_id = size.id
                size_name = size.name
            else:
                # Розмір видалено - використовуємо базову ціну товару
                size_price = product.price
        else:
            # Використовуємо базову ціну товару (завжди з БД)
            size_price = product.price
        
        # Підрахунок суми для позиції (ціна завжди з БД)
        item_total = size_price * old_item.quantity
        total_amount += item_total
        
        # Зберігаємо дані позиції (ціна завжди з БД)
        order_items_data.append({
            "product_id": product.id,
            "product_name": product.name,  # Використовуємо назву з БД
            "size_id": size_id,
            "size_name": size_name,
            "quantity": old_item.quantity,
            "price": size_price  # Ціна завжди з БД
        })
    
    if not order_items_data:
        raise BadRequestException("Неможливо повторити замовлення: всі товари недоступні або видалені")
    
    # Валідація: мінімальна та максимальна сума замовлення
    MIN_ORDER_AMOUNT = Decimal("100.00")
    MAX_ORDER_AMOUNT = Decimal("50000.00")
    
    if total_amount < MIN_ORDER_AMOUNT:
        raise BadRequestException(f"Мінімальна сума замовлення: {MIN_ORDER_AMOUNT} грн")
    
    if total_amount > MAX_ORDER_AMOUNT:
        raise BadRequestException(f"Максимальна сума замовлення: {MAX_ORDER_AMOUNT} грн")
    
    # Розрахунок доставки (базова логіка)
    delivery_cost = Decimal("50.00")  # Базова вартість доставки
    if total_amount >= Decimal("500.00"):
        delivery_cost = Decimal("0.00")  # Безкоштовна доставка від 500 грн
    
    # Створення нового замовлення
    order_number = generate_order_number()
    
    # Перевірка унікальності номера (захист від нескінченного циклу)
    max_attempts = 100
    attempts = 0
    while attempts < max_attempts:
        result = await db.execute(select(Order).where(Order.order_number == order_number))
        if result.scalar_one_or_none() is None:
            break
        order_number = generate_order_number()
        attempts += 1
    else:
        raise BadRequestException("Не вдалося згенерувати унікальний номер замовлення")
    
    new_order = Order(
        order_number=order_number,
        user_id=current_user.id,
        address_id=old_order.address_id,
        status="pending",
        total_amount=total_amount,  # Перерахована сума з БД
        delivery_cost=delivery_cost,  # Перерахована доставка
        discount=Decimal("0.00"),
        payment_method=old_order.payment_method,
        customer_name=old_order.customer_name or current_user.name,
        customer_phone=old_order.customer_phone or current_user.phone,
        customer_email=old_order.customer_email or current_user.email,  # Зберігаємо email для сповіщень
        comment=f"Повтор замовлення {old_order.order_number}"
    )
    
    db.add(new_order)
    await db.flush()
    
    # Створення позицій замовлення (ціни завжди з БД)
    for item_data in order_items_data:
        new_item = OrderItem(
            order_id=new_order.id,
            product_id=item_data["product_id"],
            product_name=item_data["product_name"],
            size_id=item_data.get("size_id"),
            size_name=item_data.get("size_name"),
            quantity=item_data["quantity"],
            price=item_data["price"]  # Ціна завжди з БД
        )
        db.add(new_item)
    
    await db.commit()
    await db.refresh(new_order)
    
    result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == new_order.id)
    )
    new_order.items = result.scalars().all()
    
    return new_order







