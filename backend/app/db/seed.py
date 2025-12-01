import asyncio
import logging
from sqlalchemy import select
from app.database import get_async_session_local
from app.models.category import Category
from app.models.product import Product
from decimal import Decimal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_data():
    session_factory = get_async_session_local()
    async with session_factory() as session:
        # Check if data exists
        result = await session.execute(select(Category))
        if result.scalars().first():
            logger.info("Data already exists. Skipping seed.")
            return

        logger.info("Seeding data...")

        # Categories
        cat_rolls = Category(
            name="Роли",
            slug="rolls",
            description="Смачні роли зі свіжих інгредієнтів",
            image_url="/images/categories/rolls.png",
            position=1
        )
        cat_sets = Category(
            name="Сети",
            slug="sets",
            description="Вигідні набори для компанії",
            image_url="/images/categories/sets.png",
            position=2
        )
        cat_sushi = Category(
            name="Суші",
            slug="sushi",
            description="Класичні суші та гункани",
            image_url="/images/categories/sushi.png",
            position=3
        )
        cat_drinks = Category(
            name="Напої",
            slug="drinks",
            description="Освіжаючі напої",
            image_url="/images/categories/drinks.png",
            position=4
        )

        session.add_all([cat_rolls, cat_sets, cat_sushi, cat_drinks])
        await session.flush()  # To get IDs

        # Products
        p1 = Product(
            name="Філадельфія з лососем",
            slug="philadelphia-salmon",
            description="Класичний рол з ніжним вершковим сиром, свіжим огірком та лососем",
            price=Decimal("345.00"),
            weight=280,
            image_url="/images/products/phila-salmon.png",
            category_id=cat_rolls.id,
            is_popular=True,
            is_hit=True,
            is_available=True
        )
        p2 = Product(
            name="Каліфорнія з креветкою",
            slug="california-shrimp",
            description="Рол в ікрі тобіко з тигровою креветкою, авокадо та огірком",
            price=Decimal("295.00"),
            weight=260,
            image_url="/images/products/california-shrimp.png",
            category_id=cat_rolls.id,
            is_popular=True,
            is_new=True,
            is_available=True
        )
        p3 = Product(
            name="Золотий Дракон",
            slug="golden-dragon",
            description="Елітний рол з вугром, авокадо, унагі соусом та кунжутом",
            price=Decimal("425.00"),
            weight=300,
            image_url="/images/products/golden-dragon.png",
            category_id=cat_rolls.id,
            is_popular=True,
            is_promotion=True,
            old_price=Decimal("485.00"),
            is_available=True
        )
        p4 = Product(
            name="Сет Філадельфія",
            slug="set-philadelphia",
            description="Набір з 4-х видів ролів Філадельфія: з лососем, вугром, тунцем та креветкою",
            price=Decimal("1250.00"),
            weight=1100,
            image_url="/images/products/set-phila.png",
            category_id=cat_sets.id,
            is_popular=True,
            is_hit=True,
            is_available=True
        )

        session.add_all([p1, p2, p3, p4])
        await session.commit()
        logger.info("Data seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
