from fastapi import APIRouter, status
from pydantic import BaseModel

from app.core.metrics import upsell_conversion

router = APIRouter()

class UpsellEvent(BaseModel):
    product_id: int
    product_name: str

@router.post("/upsell", status_code=status.HTTP_200_OK)
async def track_upsell(event: UpsellEvent):
    """
    Track successful upsell conversion.
    Called by frontend when user adds an item from upsell section.
    """
    upsell_conversion.inc()
    return {"status": "ok"}
