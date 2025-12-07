from pydantic import BaseModel, Field


class CallbackRequest(BaseModel):
    """Запит на передзвін"""
    phone: str = Field(..., min_length=10, max_length=20, description="Номер телефону")
    name: str = Field(default="Гість", description="Ім'я")


class CallbackResponse(BaseModel):
    """Відповідь на запит передзвону"""
    success: bool
    message: str







