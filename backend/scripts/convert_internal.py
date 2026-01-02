import os
import sys
import asyncio
from PIL import Image
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

# Ensure /app is in path (it usually is in docker)
sys.path.append("/app")

from app.models.product import Product
from app.models.category import Category
from app.models.promotion import Promotion
from app.core.config import settings

# Uploads dir inside container
UPLOADS_DIR = "/app/backend/uploads"
EXTENSIONS = {".png", ".jpg", ".jpeg"}

# Use credentials from environment variables (available inside container)
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    # Fallback or construct from components if simpler url is needed
    # But usually app starts with DATABASE_URL set.
    # Note: asyncpg requires postgresql+asyncpg://
    # If env var is postgresql://, we might need to fix it.
    pass

# Helper to ensure async driver
def fix_db_url(url):
    if url and url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

DATABASE_URL = fix_db_url(DATABASE_URL) or fix_db_url(settings.DATABASE_URL)

async def convert_and_update_db():
    print(f"Connecting to DB: {DATABASE_URL}")
    engine = create_async_engine(DATABASE_URL, echo=True)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        # 1. Convert files
        print("Converting files...")
        for root, dirs, files in os.walk(UPLOADS_DIR):
            for file in files:
                base, ext = os.path.splitext(file)
                if ext.lower() in EXTENSIONS:
                    file_path = os.path.join(root, file)
                    new_filename = base + ".webp"
                    new_file_path = os.path.join(root, new_filename)
                    
                    try:
                        with Image.open(file_path) as img:
                            img.save(new_file_path, "WEBP")
                        print(f"Converted: {file} -> {new_filename}")
                    except Exception as e:
                        print(f"Failed to convert {file}: {e}")

        # 2. Update Products
        print("Updating Products...")
        result = await session.execute(select(Product))
        products = result.scalars().all()
        
        for product in products:
            changed = False
            if product.image_url:
                for ext in EXTENSIONS:
                    if product.image_url.endswith(ext):
                        product.image_url = os.path.splitext(product.image_url)[0] + ".webp"
                        changed = True
                        break
            
            if product.images:
                new_images = []
                for img_url in product.images:
                    img_changed = False
                    for ext in EXTENSIONS:
                        if img_url.endswith(ext):
                            new_images.append(os.path.splitext(img_url)[0] + ".webp")
                            img_changed = True
                            changed = True
                            break
                    if not img_changed:
                        new_images.append(img_url)
                if changed:
                    product.images = new_images

            if changed:
                session.add(product)
                print(f"Updated product {product.id}")

        # 3. Update Categories
        print("Updating Categories...")
        result = await session.execute(select(Category))
        categories = result.scalars().all()
        
        for category in categories:
            if category.image_url:
                for ext in EXTENSIONS:
                    if category.image_url.endswith(ext):
                        category.image_url = os.path.splitext(category.image_url)[0] + ".webp"
                        session.add(category)
                        print(f"Updated category {category.id}")
                        break

        # 4. Update Promotions
        print("Updating Promotions...")
        result = await session.execute(select(Promotion))
        promotions = result.scalars().all()
        
        for promo in promotions:
             if promo.image_url:
                for ext in EXTENSIONS:
                    if promo.image_url.endswith(ext):
                        promo.image_url = os.path.splitext(promo.image_url)[0] + ".webp"
                        session.add(promo)
                        print(f"Updated promotion {promo.id}")
                        break

        await session.commit()
        print("Database update complete.")

if __name__ == "__main__":
    asyncio.run(convert_and_update_db())
