"""Головний роутер для адмін endpoints"""
from fastapi import APIRouter

from app.api.v1.endpoints.admin import (
    categories, products, orders, users, reviews,
    promotions, promo_codes, delivery_zones,
    statistics, settings, audit_logs, newsletter
)

admin_router = APIRouter()

admin_router.include_router(
    categories.router,
    prefix="/categories",
    tags=["admin-categories"]
)
admin_router.include_router(
    products.router,
    prefix="/products",
    tags=["admin-products"]
)
admin_router.include_router(
    orders.router,
    prefix="/orders",
    tags=["admin-orders"]
)
admin_router.include_router(
    users.router,
    prefix="/users",
    tags=["admin-users"]
)
admin_router.include_router(
    reviews.router,
    prefix="/reviews",
    tags=["admin-reviews"]
)
admin_router.include_router(
    promotions.router,
    prefix="/promotions",
    tags=["admin-promotions"]
)
admin_router.include_router(
    promo_codes.router,
    prefix="/promo-codes",
    tags=["admin-promo-codes"]
)
admin_router.include_router(
    delivery_zones.router,
    prefix="/delivery-zones",
    tags=["admin-delivery-zones"]
)
admin_router.include_router(
    statistics.router,
    prefix="/statistics",
    tags=["admin-statistics"]
)
admin_router.include_router(
    settings.router,
    prefix="/settings",
    tags=["admin-settings"]
)
admin_router.include_router(
    audit_logs.router,
    prefix="/audit-logs",
    tags=["admin-audit-logs"]
)
admin_router.include_router(
    newsletter.router,
    prefix="/newsletter",
    tags=["admin-newsletter"]
)

