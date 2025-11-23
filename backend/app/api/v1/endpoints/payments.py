"""API endpoints для платежів"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/webhook")
async def payment_webhook():
    """Webhook для обробки платежів від платіжних систем"""
    # TODO: Реалізувати обробку webhook від платіжних систем
    pass


@router.get("/methods")
async def get_payment_methods():
    """Отримання доступних методів оплати"""
    # TODO: Реалізувати отримання методів оплати
    return {
        "methods": [
            {"id": "cash", "name": "Готівка", "available": True},
            {"id": "card", "name": "Карта", "available": True},
            {"id": "online", "name": "Онлайн оплата", "available": False}
        ]
    }

