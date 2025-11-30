import asyncio
from sqlalchemy import select
from app.database import get_async_session_local
from app.models.product import Product
from app.models.category import Category
from app.core.config import settings

async def seed_products():
    session_factory = get_async_session_local()
    async with session_factory() as session:
        # Ensure category exists
        result = await session.execute(select(Category).where(Category.slug == "rolls"))
        category = result.scalar_one_or_none()
        
        if not category:
            print("Creating 'Rolls' category...")
            category = Category(
                name="Роли",
                slug="rolls",
                description="Смачні роли",
                is_active=True,
                position=1
            )
            session.add(category)
            await session.commit()
            await session.refresh(category)
        
        products_data = [
            {
                "name": "Філадельфія Преміум",
                "slug": "philadelphia-premium-new",
                "description": "Лосось, крем-сир, авокадо, огірок, ікра тобіко",
                "price": 450.00,
                "weight": 320,
                "image_url": "/uploads/xDSC_0987-2500x1668.jpg.pagespeed.ic.9Xl9xQrPhn.webp",
                "is_popular": True,
                "is_new": True
            },
            {
                "name": "Золотий Дракон",
                "slug": "golden-dragon-new",
                "description": "Вугор, крем-сир, авокадо, унагі соус, кунжут",
                "price": 520.00,
                "weight": 310,
                "image_url": "/uploads/xDSC_1025-2500x1668.jpg.pagespeed.ic.cGWbklo--W.webp",
                "is_popular": True,
                "is_new": True
            },
            {
                "name": "Каліфорнія з Лососем",
                "slug": "california-salmon-new",
                "description": "Лосось, авокадо, огірок, ікра масаго, майонез",
                "price": 380.00,
                "weight": 290,
                "image_url": "/uploads/xDSC_1235-2500x1668.jpg.pagespeed.ic.XP0BTEsjLM.webp",
                "is_popular": True,
                "is_new": False
            },
            {
                "name": "Сет 'Насолода'",
                "slug": "pleasure-set-new",
                "description": "Філадельфія, Каліфорнія, Макі з лососем, Макі з авокадо",
                "price": 950.00,
                "weight": 900,
                "image_url": "/uploads/xDSC_1250-2500x1668.jpg.pagespeed.ic.3I5ngdU0GJ.webp",
                "is_popular": True,
                "is_new": True
            },
            {
                "name": "Унагі Макі",
                "slug": "unagi-maki-new",
                "description": "Вугор, рис, норі, унагі соус, кунжут",
                "price": 220.00,
                "weight": 110,
                "image_url": "/uploads/xDSC_1310-2500x1668.jpg.pagespeed.ic.lyMGsXJNu3.webp",
                "is_popular": False,
                "is_new": False
            }
        ]

        for p_data in products_data:
            # Check if product exists
            result = await session.execute(select(Product).where(Product.slug == p_data["slug"]))
            existing_product = result.scalar_one_or_none()
            
            if not existing_product:
                print(f"Adding product: {p_data['name']}")
                product = Product(
                    category_id=category.id,
                    **p_data
                )
                session.add(product)
            else:
                print(f"Product {p_data['name']} already exists, updating...")
                for key, value in p_data.items():
                    setattr(existing_product, key, value)
                existing_product.category_id = category.id
        
        await session.commit()
        print("Products added successfully!")

if __name__ == "__main__":
    asyncio.run(seed_products())
