from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.callback import CallbackStatus

class CallbackRequest(BaseModel):
    """Запит на передзвін"""
    phone: str = Field(..., min_length=10, max_length=20, description="Номер телефону")
    name: str = Field(default="Гість", description="Ім'я")

class CallbackUpdate(BaseModel):
    """Оновлення статусу запиту"""
    status: CallbackStatus
    comment: Optional[str] = None

class CallbackSchema(BaseModel):
    """Повна інформація про запит"""
    id: int
    phone: str
    name: Optional[str] = None
    status: CallbackStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    comment: Optional[str] = None

    class Config:
        from_attributes = True

class CallbackResponse(BaseModel):
    """Відповідь на створення запиту"""
    success: bool
    message: str
