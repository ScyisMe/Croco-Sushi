import asyncio
from app.database import get_async_session_local
from app.models.product import Product
from sqlalchemy import select

async def main():
    session_factory = get_async_session_local()
    async with session_factory() as session:
        result = await session.execute(select(Product))
        products = result.scalars().all()
        for p in products:
            print(f"Product: {p.name}, Image: {p.image_url}")

if __name__ == "__main__":
    asyncio.run(main())
