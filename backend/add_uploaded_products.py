import asyncio
from sqlalchemy import select
from app.database import get_async_session_local
from app.models.product import Product
from app.models.category import Category

async def seed_new_products():
    session_factory = get_async_session_local()
    async with session_factory() as session:
        # Ensure category exists (assuming 'rolls' for now, maybe 'desserts' for mochi?)
        # Let's put rolls in 'rolls' and mochi in 'desserts' if it exists, or create it.
        
        # 1. Rolls Category
        result = await session.execute(select(Category).where(Category.slug == "rolls"))
        rolls_category = result.scalar_one_or_none()
        if not rolls_category:
            print("Creating 'Rolls' category...")
            rolls_category = Category(name="Роли", slug="rolls", description="Смачні роли", is_active=True, position=1)
            session.add(rolls_category)
            await session.commit()
            await session.refresh(rolls_category)

        # 2. Desserts Category (for Mochi)
        result = await session.execute(select(Category).where(Category.slug == "desserts"))
        desserts_category = result.scalar_one_or_none()
        if not desserts_category:
            print("Creating 'Desserts' category...")
            desserts_category = Category(name="Десерти", slug="desserts", description="Солодкі десерти", is_active=True, position=2)
            session.add(desserts_category)
            await session.commit()
            await session.refresh(desserts_category)

        new_products = [
            # Image 0: Red Masago Shrimp
            {
                "name": "Ебі Масаго Рол",
                "slug": "ebi-masago-roll",
                "description": "Креветка, крем-сир, авокадо, огірок, ікра масаго",
                "price": 420.00,
                "weight": 300,
                "image_url": "/uploads/ebi_masago_roll.jpg",
                "is_popular": True,
                "is_new": True,
                "category_id": rolls_category.id
            },
            # Image 1: Bonito Roll
            {
                "name": "Боніто Делайт",
                "slug": "bonito-delight",
                "description": "Смажений лосось, крем-сир, авокадо, стружка тунця, унагі соус",
                "price": 390.00,
                "weight": 290,
                "image_url": "/uploads/bonito_roll.jpg",
                "is_popular": True,
                "is_new": True,
                "category_id": rolls_category.id
            },
            # Image 2: Strawberry Mochi
            {
                "name": "Полуничні Моті",
                "slug": "strawberry-mochi",
                "description": "Ніжний десерт з рисового тіста з полуничною начинкою",
                "price": 180.00,
                "weight": 150,
                "image_url": "/uploads/strawberry_mochi.jpg",
                "is_popular": True,
                "is_new": True,
                "category_id": desserts_category.id
            },
            # Image 3: California Gold (Red Tobiko/Crab)
            {
                "name": "Каліфорнія Голд",
                "slug": "california-gold",
                "description": "Сніжний краб, огірок, авокадо, крем-сир, ікра масаго",
                "price": 350.00,
                "weight": 280,
                "image_url": "/uploads/california_gold.jpg",
                "is_popular": False,
                "is_new": True,
                "category_id": rolls_category.id
            }
        ]

        for p_data in new_products:
            # Check if product exists
            result = await session.execute(select(Product).where(Product.slug == p_data["slug"]))
            existing_product = result.scalar_one_or_none()
            
            if not existing_product:
                print(f"Adding product: {p_data['name']}")
                product = Product(**p_data)
                session.add(product)
            else:
                print(f"Product {p_data['name']} already exists, updating...")
                for key, value in p_data.items():
                    setattr(existing_product, key, value)
        
        await session.commit()
        print("New uploaded products added successfully!")

if __name__ == "__main__":
    asyncio.run(seed_new_products())
