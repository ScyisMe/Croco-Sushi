from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.schemas.product import ProductResponse

class FavoriteResponse(BaseModel):
    id: int
    product_id: int
    product: ProductResponse
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
