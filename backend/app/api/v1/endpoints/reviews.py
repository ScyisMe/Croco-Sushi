"""API endpoints для відгуків"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, UploadFile, File, Form
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
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate, ReviewWithUser, GoogleReviewResponse
from app.core.config import settings
from app.utils.file_upload import save_image_with_processing, validate_image_file


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


@router.get("/google", response_model=List[GoogleReviewResponse])
async def get_google_reviews():
    """Отримання відгуків з Google Maps"""
    import random
    
    # Helper to generate random time string
    def get_random_time():
        days = random.randint(1, 14)
        if days == 1:
            return "1 день тому"
        elif days < 5:
            return f"{days} дні тому"
        elif days < 7:
            return f"{days} днів тому"
        elif days == 7:
            return "тиждень тому"
        elif days < 14:
            return "1 тиждень тому"
        else: # days == 14
            return "2 тижні тому"

    # Mock data for demonstration
    base_reviews = [
        {"author": "Олена П.", "rating": 5, "text": "Найкращі суші у Львові! Завжди свіжі та дуже смачні. Доставка швидка."},
        {"author": "Ігор К.", "rating": 5, "text": "Чудовий сервіс і неймовірний смак. Рекомендую філадельфію!"},
        {"author": "Марія С.", "rating": 4, "text": "Смачно, але довелось трохи почекати доставку в годину пік."},
        {"author": "Андрій В.", "rating": 5, "text": "Філадельфія просто космос, багато риби, рис не розвалюється."},
        {"author": "Вікторія Л.", "rating": 5, "text": "Замовляємо вже втретє, все супер. Дуже подобається пакування."},
        {"author": "Максим Д.", "rating": 4, "text": "Хороші роли, свіжа риба. Соєвий соус був трохи солоний для мене."},
        {"author": "Тетяна М.", "rating": 5, "text": "Дуже швидка доставка, приїхали за 40 хвилин на Сихів. Гарячі роли були гарячими!"},
        {"author": "Сергій Б.", "rating": 5, "text": "Свіжі інгредієнти, рис зварений ідеально. Ціна відповідає якості."},
        {"author": "Юлія Р.", "rating": 5, "text": "Рекомендую сет 'Дракон', це щось неймовірне. Обов'язково замовимо ще."},
        {"author": "Олег Г.", "rating": 4, "text": "Все смачно, порції великі. Забули покласти одну пару паличок, але вибачились."},
        {"author": "Надія І.", "rating": 5, "text": "Найсмачніші запечені роли, що я куштувала у Львові. Дякую кухарям!"},
        {"author": "Дмитро К.", "rating": 5, "text": "Дякую за приємний бонус до замовлення! Дуже клієнтоорієнтований сервіс."},
        {"author": "Оксана Ф.", "rating": 5, "text": "Завжди замовляємо тут на офіс, колеги в захваті. Завжди вчасно."},
        {"author": "Павло Т.", "rating": 4, "text": "Суші смачні, ціни адекватні. Сайт зручний для замовлення."},
        {"author": "Ірина Ш.", "rating": 5, "text": "Презентація страв на висоті, як у ресторані. Дуже естетично і смачно."},
        {"author": "Василь Н.", "rating": 5, "text": "Великі порції, наїлися досхочу. Риби не шкодують."},
        {"author": "Галина В.", "rating": 5, "text": "Привітний кур'єр і оператори. Замовлення прийняли дуже швидко."},
        {"author": "Роман З.", "rating": 4, "text": "Трохи забагато рису в каліфорнії, але загалом дуже смачно і свіжо."},
        {"author": "Катерина Л.", "rating": 5, "text": "Мої улюблені суші тепер тільки Croco! Жодного разу не підвели."},
        {"author": "Богдан С.", "rating": 5, "text": "Все супер, так тримати! Успіхів вам і процвітання."}
    ]
    
    # Select 3 random reviews from the base list
    selected_reviews = random.sample(base_reviews, 3)
    
    mock_reviews = []
    # Use a fixed set of avatars rotated
    avatars = [
        "https://lh3.googleusercontent.com/a/ACg8ocI-...", 
        "https://lh3.googleusercontent.com/a/..." 
    ]
    
    for i, review in enumerate(selected_reviews):
        # Generate random time for each
        mock_reviews.append({
            "author_name": review["author"],
            "rating": review["rating"],
            "relative_time_description": get_random_time(),
            "text": review["text"],
            "profile_photo_url": avatars[i % len(avatars)]
        })

    return mock_reviews



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
@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    rating: int = Form(..., ge=1, le=5),
    comment: Optional[str] = Form(None),
    order_id: Optional[int] = Form(None),
    product_id: Optional[int] = Form(None),
    images: List[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Створення відгуку (підтримує завантаження фото)"""
    # Створюємо об'єкт схеми для валідації логіки (не файлів)
    review_data = ReviewCreate(
        rating=rating,
        comment=comment,
        order_id=order_id,
        product_id=product_id,
        images=[] # Images обробляємо окремо
    )

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
        elif review_data.product_id:
            query_conditions.append(Review.product_id == review_data.product_id)
        else:
            # General review: check if user already has a review where BOTH order_id and product_id are NULL
            query_conditions.append(Review.order_id.is_(None))
            query_conditions.append(Review.product_id.is_(None))
        
        result = await db.execute(
            select(Review).where(and_(*query_conditions))
        )
        existing_review = result.scalars().first()
        if existing_review:
            if review_data.order_id:
                raise BadRequestException("Ви вже залишили відгук на це замовлення")
            elif review_data.product_id:
                raise BadRequestException("Ви вже залишили відгук на цей товар")
            # else:
            #      Allow multiple general reviews (restaurant feedback can happen multiple times)
            #      pass
    
    # Обробка зображень
    image_urls = []
    if images:
        for image in images:
            validate_image_file(image)
            _, file_url, _ = await save_image_with_processing(
                file=image,
                subdirectory="reviews",
                prefix="review",
                create_thumbnail=False
            )
            image_urls.append(file_url)

    # Створення відгуку з обробкою race condition
    from sqlalchemy.exc import IntegrityError
    
    try:
        new_review = Review(
            user_id=current_user.id if current_user else None,
            order_id=review_data.order_id,
            product_id=review_data.product_id,
            rating=review_data.rating,
            comment=review_data.comment,
            images=image_urls,
            is_published=True  # Автоматична публікація для зручності
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
                else:
                    raise BadRequestException("Ви вже залишили загальний відгук про сайт")
        
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







