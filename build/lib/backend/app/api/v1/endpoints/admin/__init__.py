"""Admin endpoints"""
from app.api.v1.endpoints.admin import (
    categories, products, orders, users, reviews,
    promotions, promo_codes, delivery_zones,
    statistics, settings, audit_logs
)

__all__ = [
    "categories", "products", "orders", "users",
    "reviews", "promotions", "promo_codes", "delivery_zones",
    "statistics", "settings", "audit_logs"
]
