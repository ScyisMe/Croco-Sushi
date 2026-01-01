from sqlalchemy import Column, String, Boolean
from app.database import Base

class Setting(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)
    description = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)
