from fastapi import APIRouter

from app.api.v1.endpoints import categories, products, auth, orders, reviews, promotions, callback, users, delivery, settings, payments, promo_codes, newsletter, analytics
from app.api.v1.endpoints import upload
from app.api.v1.endpoints.admin.admin import admin_router

api_router = APIRouter()

# Публічні та користувацькі endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(promotions.router, prefix="/promotions", tags=["promotions"])
api_router.include_router(callback.router, prefix="/callback", tags=["callback"])
api_router.include_router(delivery.router, prefix="/delivery", tags=["delivery"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(promo_codes.router, prefix="/promo-codes", tags=["promo-codes"])
api_router.include_router(newsletter.router, prefix="/newsletter", tags=["newsletter"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

# Адмін endpoints
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])

