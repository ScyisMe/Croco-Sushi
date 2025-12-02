import asyncio
import logging
from decimal import Decimal
from sqlalchemy import select
from app.database import get_async_session_local
from app.models.category import Category
from app.models.product import Product

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def add_more_products():
    session_factory = get_async_session_local()
    async with session_factory() as session:
        # Get Rolls category
        result = await session.execute(select(Category).where(Category.slug == "rolls"))
        cat_rolls = result.scalar_one_or_none()
        
        if not cat_rolls:
            logger.error("Category 'rolls' not found!")
            return

        # New Products (Batch 2)
        products = [
            Product(
                name="Запечений гострий лосось",
                slug="baked-spicy-salmon",
                description="Пікантний запечений рол з лососем, спайсі соусом та ікрою тобіко",
                price=Decimal("395.00"),
                weight=310,
                image_url="/images/products/baked-spicy-salmon.jpg",
                category_id=cat_rolls.id,
                is_popular=True,
                is_new=True,
                is_available=True
            ),
            Product(
                name="Лава Бол",
                slug="lava-balls",
                description="Ніжні рисові кульки з крабом та вершковим соусом",
                price=Decimal("285.00"),
                weight=250,
                image_url="/images/products/lava-balls.jpg",
                category_id=cat_rolls.id,
                is_popular=False,
                is_new=True,
                is_available=True
            ),
            Product(
                name="Чорна Каліфорнія",
                slug="black-california",
                description="Оригінальна Каліфорнія з чорним рисом, лососем та авокадо",
                price=Decimal("355.00"),
                weight=270,
                image_url="/images/products/black-california.jpg",
                category_id=cat_rolls.id,
                is_popular=True,
                is_new=True,
                is_available=True
            ),
            Product(
                name="Чорна Філадельфія",
                slug="black-philadelphia",
                description="Філадельфія з чорним рисом та подвійною порцією сиру",
                price=Decimal("375.00"),
                weight=290,
                image_url="/images/products/black-philadelphia.jpg",
                category_id=cat_rolls.id,
                is_popular=True,
                is_new=True,
                is_available=True
            ),
            Product(
                name="Чорний Дракон",
                slug="black-dragon",
                description="Ексклюзивний рол з чорним рисом та вугром",
                price=Decimal("465.00"),
                weight=300,
                image_url="/images/products/black-dragon.jpg",
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
        logger.info("Batch 2 products added successfully!")

if __name__ == "__main__":
    asyncio.run(add_more_products())
