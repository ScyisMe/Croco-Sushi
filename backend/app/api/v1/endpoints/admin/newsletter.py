from typing import List, Any
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.newsletter import NewsletterSubscriber
from app.models.user import User
from app.schemas.newsletter import NewsletterSubscriberResponse, NewsletterSendRequest
from app.core.email import send_email_smtp

router = APIRouter()

def send_newsletter_background(recipients: List[str], subject: str, body: str):
    """Background task to send emails."""
    for email in recipients:
        try:
            send_email_smtp(
                to_email=email,
                subject=subject,
                body=body, # Plain text
                html_body=body # Assuming body is HTML as well, or we can strip tags for plain text
            )
        except Exception as e:
            print(f"Failed to send email to {email}: {e}")

@router.get("/subscribers", response_model=List[NewsletterSubscriberResponse])
async def read_subscribers(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """Retrieve newsletter subscribers."""
    result = await db.execute(select(NewsletterSubscriber).offset(skip).limit(limit))
    subscribers = result.scalars().all()
    return subscribers

@router.post("/send")
async def send_newsletter(
    data: NewsletterSendRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """Send newsletter to subscribers."""
    recipients = []
    
    # 1. Get recipients
    if data.recipients:
        recipients = data.recipients
    else:
        # Get all active guest subscribers
        result_guests = await db.execute(select(NewsletterSubscriber).where(NewsletterSubscriber.is_active == True))
        guests = result_guests.scalars().all()
        recipients.extend([g.email for g in guests])
        
        # Get all active user subscribers
        result_users = await db.execute(select(User).where(User.newsletter_subscription == True))
        users = result_users.scalars().all()
        recipients.extend([u.email for u in users if u.email])
    
    unique_recipients = list(set(recipients))
    
    if not unique_recipients:
        return {"message": "No recipients found"}

    # 2. Queue background task
    background_tasks.add_task(send_newsletter_background, unique_recipients, data.subject, data.body)
    
    return {"message": f"Newsletter queued for {len(unique_recipients)} recipients"}
