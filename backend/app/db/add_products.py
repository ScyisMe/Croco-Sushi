import asyncio
import logging
from decimal import Decimal
from sqlalchemy import select
from app.database import get_async_session_local
from app.models.category import Category
from app.models.product import Product

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def add_products():
    session_factory = get_async_session_local()
    async with session_factory() as session:
        # Get Rolls category
        result = await session.execute(select(Category).where(Category.slug == "rolls"))
        cat_rolls = result.scalar_one_or_none()
        
        if not cat_rolls:
            logger.error("Category 'rolls' not found!")
            return

        # New Products
        products = [
            Product(
                name="Запечений рол з лососем",
                slug="baked-salmon",
                description="Теплий рол з лососем, вершковим сиром та соусом унагі",
                price=Decimal("385.00"),
                weight=300,
                image_url="/images/products/baked-salmon.png",
                category_id=cat_rolls.id,
                is_popular=True,
                is_new=True,
                is_available=True
            ),
            Product(
                name="Запечений рол з вугром",
                slug="baked-eel",
                description="Теплий рол з вугром, авокадо та сирним соусом",
                price=Decimal("415.00"),
                weight=290,
                image_url="/images/products/baked-eel.png",
                category_id=cat_rolls.id,
                is_popular=True,
                is_new=True,
                is_available=True
            ),
            Product(
                name="Філадельфія з тунцем",
                slug="philadelphia-tuna",
                description="Класична Філадельфія зі свіжим тунцем та огірком",
                price=Decimal("365.00"),
                weight=280,
                image_url="/images/products/philadelphia-tuna.jpg",
                category_id=cat_rolls.id,
                is_popular=False,
                is_new=True,
                is_available=True
            ),
            Product(
                name="Зелений Дракон",
                slug="green-dragon",
                description="Рол з вугром, покритий стиглим авокадо та кунжутом",
                price=Decimal("445.00"),
                weight=310,
                image_url="/images/products/green-dragon.jpg",
                category_id=cat_rolls.id,
                is_popular=True,
                is_available=True
            ),
            Product(
                name="Червоний Дракон",
                slug="red-dragon",
                description="Рол з тигровою креветкою, покритий свіжим лососем",
                price=Decimal("455.00"),
                weight=320,
                image_url="/images/products/red-dragon.jpg",
                category_id=cat_rolls.id,
                is_popular=True,
                is_available=True
            )
        ]

        # Check if products already exist to avoid duplicates
        for p in products:
            existing = await session.execute(select(Product).where(Product.slug == p.slug))
            if not existing.scalar_one_or_none():
                session.add(p)
                logger.info(f"Adding product: {p.name}")
            else:
                logger.info(f"Product {p.name} already exists. Skipping.")

        await session.commit()
        logger.info("Products added successfully!")

if __name__ == "__main__":
    asyncio.run(add_products())
