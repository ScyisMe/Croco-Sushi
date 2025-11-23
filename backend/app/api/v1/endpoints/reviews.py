"""API endpoints для відгуків"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.dependencies import get_current_active_user, get_optional_user
from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException
from app.models.review import Review
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate, ReviewWithUser

router = APIRouter()


@router.get("/", response_model=List[ReviewWithUser])
async def get_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    product_id: Optional[int] = None,
    rating: Optional[int] = Query(None, ge=1, le=5),
    db: AsyncSession = Depends(get_db)
):
    """Отримання публічних відгуків"""
    query = select(Review).where(Review.is_published == True)
    
    if product_id:
        query = query.where(Review.product_id == product_id)
    
    if rating:
        query = query.where(Review.rating == rating)
    
    # Використовуємо selectinload для запобігання N+1 проблеми
    query = query.options(selectinload(Review.user))
    query = query.order_by(Review.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    reviews = result.scalars().all()
    
    # Додаємо інформацію про користувачів
    reviews_with_users = []
    for review in reviews:
        # Створюємо dict з даних відгуку через model_validate для безпечної серіалізації
        review_dict = ReviewResponse.model_validate(review).model_dump()
        review_dict["user_name"] = None
        review_dict["user_phone"] = None
        
        if review.user:
            review_dict["user_name"] = review.user.name
            # Маскуємо телефон для публічності
            if review.user.phone:
                phone = review.user.phone
                review_dict["user_phone"] = f"{phone[:3]}***{phone[-2:]}" if len(phone) > 5 else "***"
        
        reviews_with_users.append(ReviewWithUser.model_validate(review_dict))
    
    return reviews_with_users


@router.get("/product/{product_id}", response_model=List[ReviewWithUser])
async def get_product_reviews(
    product_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Отримання відгуків по товару"""
    # Перевірка чи існує товар
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise NotFoundException("Товар не знайдено")
    
    # Викликаємо get_reviews з явною передачею всіх параметрів
    return await get_reviews(
        skip=skip,
        limit=limit,
        product_id=product_id,
        rating=None,  # Явно вказуємо None для rating
        db=db
    )


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Створення відгуку"""
    # Валідація: має бути або order_id, або product_id
    if not review_data.order_id and not review_data.product_id:
        raise BadRequestException("Потрібно вказати order_id або product_id")
    
    # Перевірка чи існує замовлення або товар
    if review_data.order_id:
        result = await db.execute(select(Order).where(Order.id == review_data.order_id))
        order = result.scalar_one_or_none()
        
        if not order:
            raise NotFoundException("Замовлення не знайдено")
        
        if current_user and order.user_id != current_user.id:
            raise ForbiddenException("Це не ваше замовлення")
    
    if review_data.product_id:
        result = await db.execute(select(Product).where(Product.id == review_data.product_id))
        product = result.scalar_one_or_none()
        
        if not product:
            raise NotFoundException("Товар не знайдено")
    
    # Перевірка чи користувач вже залишив відгук (для order_id або product_id)
    if current_user:
        query_conditions = [Review.user_id == current_user.id]
        
        if review_data.order_id:
            query_conditions.append(Review.order_id == review_data.order_id)
        
        if review_data.product_id:
            query_conditions.append(Review.product_id == review_data.product_id)
        
        result = await db.execute(
            select(Review).where(and_(*query_conditions))
        )
        existing_review = result.scalar_one_or_none()
        if existing_review:
            if review_data.order_id:
                raise BadRequestException("Ви вже залишили відгук на це замовлення")
            elif review_data.product_id:
                raise BadRequestException("Ви вже залишили відгук на цей товар")
    
    # Створення відгуку з обробкою race condition
    from sqlalchemy.exc import IntegrityError
    
    try:
        new_review = Review(
            user_id=current_user.id if current_user else None,
            order_id=review_data.order_id,
            product_id=review_data.product_id,
            rating=review_data.rating,
            comment=review_data.comment,
            images=review_data.images,
            is_published=False  # Потребує модерації
        )
        
        db.add(new_review)
        await db.commit()
        await db.refresh(new_review)
        
        return new_review
    
    except IntegrityError:
        await db.rollback()
        # Можливий race condition - перевіряємо знову
        if current_user:
            query_conditions = [Review.user_id == current_user.id]
            if review_data.order_id:
                query_conditions.append(Review.order_id == review_data.order_id)
            if review_data.product_id:
                query_conditions.append(Review.product_id == review_data.product_id)
            
            result = await db.execute(
                select(Review).where(and_(*query_conditions))
            )
            existing_review = result.scalar_one_or_none()
            if existing_review:
                if review_data.order_id:
                    raise BadRequestException("Ви вже залишили відгук на це замовлення")
                elif review_data.product_id:
                    raise BadRequestException("Ви вже залишили відгук на цей товар")
        
        raise BadRequestException("Помилка створення відгуку")


@router.get("/me", response_model=List[ReviewResponse])
async def get_my_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Отримання моїх відгуків"""
    result = await db.execute(
        select(Review)
        .where(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    reviews = result.scalars().all()
    
    return reviews


@router.put("/me/{review_id}", response_model=ReviewResponse)
async def update_my_review(
    review_id: int,
    review_data: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Оновлення мого відгуку"""
    result = await db.execute(
        select(Review).where(
            and_(
                Review.id == review_id,
                Review.user_id == current_user.id
            )
        )
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Відгук не знайдено")
    
    if review.is_published:
        raise BadRequestException("Не можна редагувати опублікований відгук")
    
    # Оновлення полів
    if review_data.rating is not None:
        review.rating = review_data.rating
    if review_data.comment is not None:
        review.comment = review_data.comment
    if review_data.images is not None:
        review.images = review_data.images
    
    await db.commit()
    await db.refresh(review)
    
    return review


@router.delete("/me/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Видалення мого відгуку"""
    result = await db.execute(
        select(Review).where(
            and_(
                Review.id == review_id,
                Review.user_id == current_user.id
            )
        )
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Відгук не знайдено")
    
    # Правильний спосіб видалення в SQLAlchemy 2.0 async
    await db.execute(delete(Review).where(Review.id == review_id))
    await db.commit()
    
    return None







