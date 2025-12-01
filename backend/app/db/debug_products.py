import asyncio
import logging
from sqlalchemy import select
from app.database import get_async_session_local
from app.models.product import Product
from app.models.category import Category

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_data():
    session_factory = get_async_session_local()
    async with session_factory() as session:
        # Check Categories
        logger.info("--- Categories ---")
        result = await session.execute(select(Category))
        categories = result.scalars().all()
        for cat in categories:
            logger.info(f"ID: {cat.id}, Name: {cat.name}, Slug: {cat.slug}")

        # Check Products
        logger.info("--- Products ---")
        result = await session.execute(select(Product))
        products = result.scalars().all()
        if not products:
            logger.info("No products found!")
        for p in products:
            logger.info(f"ID: {p.id}, Name: {p.name}, Slug: {p.slug}, Available: {p.is_available}, CategoryID: {p.category_id}, Image: {p.image_url}")

if __name__ == "__main__":
    asyncio.run(debug_data())
