from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional


class AddressBase(BaseModel):
    city: str = "Бровари"
    street: str
    house: str
    apartment: Optional[str] = None
    entrance: Optional[str] = None
    floor: Optional[str] = None
    intercom: Optional[str] = None
    comment: Optional[str] = Field(None, max_length=500)
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    city: Optional[str] = None
    street: Optional[str] = None
    house: Optional[str] = None
    apartment: Optional[str] = None
    entrance: Optional[str] = None
    floor: Optional[str] = None
    intercom: Optional[str] = None
    comment: Optional[str] = Field(None, max_length=500)
    is_default: Optional[bool] = None


class AddressResponse(AddressBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


