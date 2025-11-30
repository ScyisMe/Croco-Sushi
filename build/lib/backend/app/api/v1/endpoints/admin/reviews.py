"""Admin endpoints для управління відгуками"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel

from app.database import get_db
from app.core.dependencies import get_current_admin_user
from app.core.exceptions import NotFoundException
from app.models.user import User
from app.models.review import Review
from app.schemas.review import ReviewResponse, ReviewUpdate

router = APIRouter()


class ReviewReplyRequest(BaseModel):
    """Запит на відповідь на відгук"""
    reply: str


@router.get("", response_model=List[ReviewResponse])
async def get_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_published: Optional[bool] = None,
    rating: Optional[int] = Query(None, ge=1, le=5),
    product_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати список відгуків"""
    query = select(Review)
    
    if is_published is not None:
        query = query.where(Review.is_published == is_published)
    
    if rating:
        query = query.where(Review.rating == rating)
    
    if product_id:
        query = query.where(Review.product_id == product_id)
    
    query = query.order_by(Review.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    reviews = result.scalars().all()
    
    return reviews


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Оновити відгук"""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Відгук не знайдено")
    
    update_data = review_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(review, field):
            setattr(review, field, value)
    
    await db.commit()
    await db.refresh(review)
    
    return review


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Видалити відгук"""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Відгук не знайдено")
    
    # Правильний спосіб видалення в SQLAlchemy 2.0 async
    await db.execute(delete(Review).where(Review.id == review_id))
    await db.commit()
    
    return None


@router.put("/{review_id}/publish", response_model=ReviewResponse)
async def publish_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Опублікувати відгук"""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Відгук не знайдено")
    
    review.is_published = True
    await db.commit()
    await db.refresh(review)
    
    return review


@router.put("/{review_id}/hide", response_model=ReviewResponse)
async def hide_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Приховати відгук"""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Відгук не знайдено")
    
    review.is_published = False
    await db.commit()
    await db.refresh(review)
    
    return review


@router.post("/{review_id}/reply", response_model=ReviewResponse)
async def reply_to_review(
    review_id: int,
    reply_data: ReviewReplyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Відповісти на відгук"""
    from datetime import datetime, timezone
    
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Відгук не знайдено")
    
    review.admin_reply = reply_data.reply
    review.reply_date = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(review)
    
    return review

