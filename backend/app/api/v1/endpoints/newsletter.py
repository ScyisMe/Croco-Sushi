from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.newsletter import NewsletterSubscriber
from app.schemas.newsletter import NewsletterSubscribeRequest
from app.models.user import User

router = APIRouter()

@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe_newsletter(
    data: NewsletterSubscribeRequest,
    db: AsyncSession = Depends(get_db)
):
    """Підписка на розсилку новин"""
    # Check if email exists in subscribers
    result = await db.execute(select(NewsletterSubscriber).where(NewsletterSubscriber.email == data.email))
    existing_subscriber = result.scalar_one_or_none()

    if existing_subscriber:
        if not existing_subscriber.is_active:
            existing_subscriber.is_active = True
            await db.commit()
            return {"message": "Successfully subscribed"}
        return {"message": "Already subscribed"}

    # Check if user exists (optional logic: link them? For now just add to subscribers table for guests)
    # The requirement says "messages to emails that are signed up... authorized users AND those who entered email"
    # So we can store guest emails in NewsletterSubscriber. 
    # Registered users have their own flag `newsletter_subscription`.
    
    # We should also check if a user with this email exists and update their preference?
    # Or just keep it simple: if passed in footer, add to NewsletterSubscriber.
    
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if user:
        user.newsletter_subscription = True
        # We don't necessarily need to add to NewsletterSubscriber table if we query both tables for sending.
        # But for consistency, let's keep guests in one table.
        # If user exists, we rely on User model? Or duplicate?
        # Let's duplicate for now or handle logic in "Send".
        # Simplest approach: "NewsletterSubscriber" is for guests. Users are Users.
        pass
    else:
        # Create new subscriber
        new_subscriber = NewsletterSubscriber(email=data.email)
        db.add(new_subscriber)
    
    await db.commit()
    return {"message": "Successfully subscribed"}
