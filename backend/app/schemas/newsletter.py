from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

class NewsletterSubscribeRequest(BaseModel):
    email: EmailStr

class NewsletterSubscriberResponse(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class NewsletterSendRequest(BaseModel):
    subject: str
    body: str  # HTML or Text
    recipients: Optional[List[EmailStr]] = None  # If None, send to all active
