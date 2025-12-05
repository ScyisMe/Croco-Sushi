"""API endpoints для користувачів"""
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.dependencies import get_current_active_user
from app.core.exceptions import (
    NotFoundException,
    BadRequestException,
    ForbiddenException
)
from app.models.user import User
from app.models.address import Address
from app.models.order import Order
from app.models.product import Product
from app.models.product_size import ProductSize
from app.models.review import Review
from app.models.favorite import Favorite
from app.schemas.user import UserUpdate, UserResponse
from app.schemas.address import AddressCreate, AddressUpdate, AddressResponse
from app.schemas.order import OrderResponse
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Отримання мого профілю"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Оновлення профілю"""
    if user_data.email:
        # Перевірка чи email вже використовується
        result = await db.execute(
            select(User).where(
                User.email == user_data.email,
                User.id != current_user.id
            )
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise BadRequestException("Email вже використовується")
        current_user.email = user_data.email
    
    if user_data.name:
        current_user.name = user_data.name
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Видалення акаунту (деактивація)"""
    current_user.is_active = False
    await db.commit()
    
    return None


# ========== Адреси ==========

@router.get("/me/addresses", response_model=List[AddressResponse])
async def get_my_addresses(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Отримання моїх адрес"""
    result = await db.execute(
        select(Address)
        .where(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
    )
    addresses = result.scalars().all()
    return addresses


@router.post("/me/addresses", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(
    address_data: AddressCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Додати нову адресу"""
    # Якщо це перша адреса або встановлено як default, зробити її default
    if address_data.is_default:
        # Скинути всі інші адреси
        result = await db.execute(
            select(Address).where(Address.user_id == current_user.id)
        )
        existing_addresses = result.scalars().all()
        for addr in existing_addresses:
            addr.is_default = False
    
    new_address = Address(
        user_id=current_user.id,
        **address_data.model_dump()
    )
    
    db.add(new_address)
    await db.commit()
    await db.refresh(new_address)
    
    return new_address


@router.put("/me/addresses/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: int,
    address_data: AddressUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Оновити адресу"""
    result = await db.execute(
        select(Address).where(
            Address.id == address_id,
            Address.user_id == current_user.id
        )
    )
    address = result.scalar_one_or_none()
    
    if not address:
        raise NotFoundException("Адреса не знайдена")
    
    # Оновлення полів
    update_data = address_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(address, field, value)
    
    # Якщо встановлюється як default
    if address_data.is_default:
        result = await db.execute(
            select(Address).where(Address.user_id == current_user.id)
        )
        existing_addresses = result.scalars().all()
        for addr in existing_addresses:
            if addr.id != address_id:
                addr.is_default = False
    
    await db.commit()
    await db.refresh(address)
    
    return address


@router.delete("/me/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Видалити адресу"""
    result = await db.execute(
        select(Address).where(
            Address.id == address_id,
            Address.user_id == current_user.id
        )
    )
    address = result.scalar_one_or_none()
    
    if not address:
        raise NotFoundException("Адреса не знайдена")
    
    # Правильний спосіб видалення в SQLAlchemy 2.0 async
    await db.execute(delete(Address).where(Address.id == address_id))
    await db.commit()
    
    return None


@router.put("/me/addresses/{address_id}/default", response_model=AddressResponse)
async def set_default_address(
    address_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Встановити адресу за замовчуванням"""
    result = await db.execute(
        select(Address).where(
            Address.id == address_id,
            Address.user_id == current_user.id
        )
    )
    address = result.scalar_one_or_none()
    
    if not address:
        raise NotFoundException("Адреса не знайдена")
    
    # Скинути всі інші адреси
    result = await db.execute(
        select(Address).where(Address.user_id == current_user.id)
    )
    existing_addresses = result.scalars().all()
    for addr in existing_addresses:
        addr.is_default = False
    
    address.is_default = True
    await db.commit()
    await db.refresh(address)
    
    return address


# ========== Замовлення ==========

@router.get("/me/orders", response_model=List[OrderResponse])
async def get_my_orders(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Отримання моїх замовлень"""
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .options(selectinload(Order.items), selectinload(Order.address))
    )
    orders = result.scalars().all()
    return orders


@router.get("/me/orders/{order_id}", response_model=OrderResponse)
async def get_my_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Деталі мого замовлення"""
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == current_user.id
        )
        .options(selectinload(Order.items), selectinload(Order.address))
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Замовлення не знайдено")
    
    return order


@router.post("/me/orders/{order_id}/reorder", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def reorder(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Повторити замовлення (створити нове на основі старого) - перераховуємо ціни з БД"""
    from app.api.v1.endpoints.orders import generate_order_number
    from app.models.order import OrderItem as OrderItemModel
    
    # Знаходимо старе замовлення
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == current_user.id
        )
        .options(selectinload(Order.items), selectinload(Order.address))
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
    
    # Створюємо нове замовлення
    new_order = Order(
        order_number=generate_order_number(),
        user_id=current_user.id,
        address_id=old_order.address_id,
        status="pending",
        total_amount=total_amount,  # Перерахована сума з БД
        delivery_cost=delivery_cost,  # Перерахована доставка
        discount=Decimal("0"),
        payment_method=old_order.payment_method,
        customer_name=old_order.customer_name or current_user.name,
        customer_phone=old_order.customer_phone or current_user.phone,
        customer_email=old_order.customer_email or current_user.email,
    )
    
    db.add(new_order)
    await db.flush()
    
    # Створення позицій замовлення (ціни завжди з БД)
    for item_data in order_items_data:
        new_item = OrderItemModel(
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
    
    return new_order


@router.put("/me/orders/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Скасувати замовлення"""
    from datetime import datetime, timezone
    
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == current_user.id
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Замовлення не знайдено")
    
    # Перевірка чи можна скасувати (тільки pending або confirmed)
    if order.status in ["cancelled", "completed"]:
        raise BadRequestException(
            f"Неможливо скасувати замовлення зі статусом {order.status}"
        )
    
    if order.status not in ["pending", "confirmed"]:
        raise BadRequestException(
            f"Неможливо скасувати замовлення зі статусом {order.status}. Можна скасувати тільки замовлення зі статусом 'pending' або 'confirmed'"
        )
    
    # Зберігаємо старий статус перед зміною
    old_status = order.status
    order.status = "cancelled"
    
    # Оновлення історії статусів
    history = order.status_history or []
    history.append({
        "old_status": old_status,
        "new_status": "cancelled",
        "changed_by": current_user.id,
        "changed_at": datetime.now(timezone.utc).isoformat(),
        "comment": "Скасовано користувачем"
    })
    order.status_history = history
    
    await db.commit()
    await db.refresh(order)
    
    return order


# ========== Відгуки ==========

@router.post("/me/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    rating: int = Form(...),
    comment: str = Form(None),
    order_id: int = Form(None),
    product_id: int = Form(None),
    images: List[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Додати відгук"""
    from app.models.review import Review
    from app.utils.file_upload import save_image_with_processing
    
    # Перевірка чи можна додати відгук (тільки після замовлення)
    if order_id:
        result = await db.execute(
            select(Order).where(
                Order.id == order_id,
                Order.user_id == current_user.id
            )
        )
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundException("Замовлення не знайдено")
    
    # Обробка зображень
    image_urls = []
    if images:
        for image in images:
            # Валідація та збереження
            _, file_url, _ = await save_image_with_processing(
                file=image,
                subdirectory="reviews",
                prefix="review",
                create_thumbnail=True
            )
            image_urls.append(file_url)
    
    new_review = Review(
        user_id=current_user.id,
        order_id=order_id,
        product_id=product_id,
        rating=rating,
        comment=comment,
        images=image_urls,
        is_published=False  # Потребує модерації
    )
    
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    
    return new_review


@router.get("/me/reviews", response_model=List[ReviewResponse])
async def get_my_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Мої відгуки"""
    result = await db.execute(
        select(Review)
        .where(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    reviews = result.scalars().all()
    return reviews


@router.put("/me/reviews/{review_id}", response_model=ReviewResponse)
async def update_my_review(
    review_id: int,
    review_data: ReviewUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Редагувати відгук"""
    result = await db.execute(
        select(Review).where(
            Review.id == review_id,
            Review.user_id == current_user.id
        )
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Відгук не знайдено")
    
    # Якщо відгук опублікований, скидаємо статус на модерацію
    if review.is_published:
        review.is_published = False
    
    update_data = review_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(review, field):
            setattr(review, field, value)
    
    await db.commit()
    await db.refresh(review)
    
    return review


@router.delete("/me/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_review(
    review_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Видалити відгук"""
    result = await db.execute(
        select(Review).where(
            Review.id == review_id,
            Review.user_id == current_user.id
        )
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Відгук не знайдено")
    
    # Правильний спосіб видалення в SQLAlchemy 2.0 async
    await db.execute(delete(Review).where(Review.id == review_id))
    await db.commit()
    
    return None


# ========== Обране (Favorites) ==========

@router.get("/me/favorites", response_model=List[dict])
async def get_my_favorites(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Отримання обраних товарів"""
    result = await db.execute(
        select(Favorite)
        .where(Favorite.user_id == current_user.id)
        .options(selectinload(Favorite.product))
        .order_by(Favorite.created_at.desc())
    )
    favorites = result.scalars().all()
    return [{"id": fav.id, "product": fav.product, "created_at": fav.created_at} for fav in favorites]


@router.post("/me/favorites/{product_id}", status_code=status.HTTP_201_CREATED)
async def add_to_favorites(
    product_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Додати товар в обране"""
    # Перевірка чи товар існує
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise NotFoundException("Товар не знайдено")
    
    # Перевірка чи вже в обраному
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.product_id == product_id
        )
    )
    existing_favorite = result.scalar_one_or_none()
    
    if existing_favorite:
        raise BadRequestException("Товар вже в обраному")
    
    favorite = Favorite(
        user_id=current_user.id,
        product_id=product_id
    )
    
    db.add(favorite)
    await db.commit()
    await db.refresh(favorite)
    
    return {"message": "Товар додано в обране", "favorite_id": favorite.id}


@router.delete("/me/favorites/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_favorites(
    product_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Видалити товар з обраного"""
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.product_id == product_id
        )
    )
    favorite = result.scalar_one_or_none()
    
    if not favorite:
        raise NotFoundException("Товар не знайдено в обраному")
    
    # Правильний спосіб видалення в SQLAlchemy 2.0 async
    await db.execute(delete(Favorite).where(
        Favorite.user_id == current_user.id,
        Favorite.product_id == product_id
    ))
    await db.commit()
    
    return None


# ========== Програма лояльності ==========

@router.get("/me/loyalty")
async def get_loyalty_info(
    current_user: User = Depends(get_current_active_user)
):
    """Інформація про програму лояльності"""
    return {
        "bonus_balance": current_user.bonus_balance,
        "loyalty_status": current_user.loyalty_status,
        "referral_code": current_user.referral_code,
        "referral_link": f"https://croco-sushi.com/ref/{current_user.referral_code}" if current_user.referral_code else None
    }


@router.get("/me/loyalty/history")
async def get_loyalty_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Історія нарахувань/списань бонусних балів"""
    # TODO: Створити модель LoyaltyHistory для зберігання історії
    # Поки що повертаємо заглушку
    return {
        "history": [],
        "total": current_user.bonus_balance,
        "message": "Історія лояльності буде реалізована після створення моделі LoyaltyHistory"
    }


@router.get("/me/referral")
async def get_referral_info(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Отримати реферальне посилання"""
    # Генерація реферального коду, якщо його немає (з обробкою race condition)
    if not current_user.referral_code:
        import secrets
        from sqlalchemy.exc import IntegrityError
        
        # Генеруємо унікальний код
        referral_code = None
        max_attempts = 10
        attempts = 0
        
        while attempts < max_attempts:
            candidate = secrets.token_hex(10)[:20].upper()
            
            try:
                # Спробуємо встановити код
                current_user.referral_code = candidate
                await db.commit()
                referral_code = candidate
                break
            except IntegrityError:
                # Конфлікт унікальності - генеруємо новий код
                await db.rollback()
                attempts += 1
        else:
            raise BadRequestException("Не вдалося згенерувати унікальний реферальний код")
        
        await db.refresh(current_user)
    
    return {
        "referral_code": current_user.referral_code,
        "referral_link": f"https://croco-sushi.com/ref/{current_user.referral_code}" if current_user.referral_code else None
    }

