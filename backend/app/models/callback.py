from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, Text
import enum

from app.database import Base

class CallbackStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Callback(Base):
    __tablename__ = "callbacks"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, nullable=False, index=True)
    name = Column(String, nullable=True)
    comment = Column(Text, nullable=True)
    status = Column(Enum(CallbackStatus), default=CallbackStatus.NEW, nullable=False)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
