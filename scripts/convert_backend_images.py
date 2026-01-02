import os
import sys
import asyncio
from PIL import Image
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

# Add backend directory to path so we can import app modules
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.models.product import Product
from app.models.category import Category
from app.models.promotion import Promotion
from app.core.config import settings

# Adjust uploads directory
UPLOADS_DIR = r"backend/uploads"
EXTENSIONS = {".png", ".jpg", ".jpeg"}

# Database URL (ensure it's using async driver if needed, but for script sync might be easier or just use what app uses)
DATABASE_URL = "postgresql+asyncpg://admin_croco:admin_croco_password@postgres:5432/croco_sushi_db" 
# Note: In local dev environment, host is localhost if running script locally, but 'postgres' if inside container.
# Since I am running as agent on Windows host, I should try localhost first.
# Checking docker-compose.yml port mapping... usually 5432:5432.
# URL encode '!' as '%21'
DATABASE_URL_LOCAL = "postgresql+asyncpg://admin_croco:Spicy-Tuna-Roll-2025-Tasty%21@localhost:5432/croco_sushi"

async def convert_and_update_db():
    engine = create_async_engine(DATABASE_URL_LOCAL)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        # 1. Convert files in UPLOADS_DIR
        print("Converting files...")
        converted_mapping = {} # old_rel_path -> new_rel_path

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
                        
                        # Calculate relative path as stored in DB (usually "uploads/...")
                        # But typically it's just path relative to STATIC_DIR or UPLOADS_DIR.
                        # Let's verify what's in DB first.
                        # Actually, just map full filename to new filename for now.
                        converted_mapping[file] = new_filename
                        print(f"Converted: {file} -> {new_filename}")
                        
                        # Optionally delete original? User asked to "convert", implying replacement.
                        # Safe to keep for a moment until DB update confirms.
                    except Exception as e:
                        print(f"Failed to convert {file}: {e}")

        # 2. Update Products
        print("Updating Products...")
        result = await session.execute(select(Product))
        products = result.scalars().all()
        
        for product in products:
            changed = False
            # Update image_url
            if product.image_url:
                for ext in EXTENSIONS:
                    if product.image_url.endswith(ext):
                        product.image_url = os.path.splitext(product.image_url)[0] + ".webp"
                        changed = True
                        break
            
            # Update images list
            if product.images:
                new_images = []
                for img_url in product.images:
                    for ext in EXTENSIONS:
                        if img_url.endswith(ext):
                            img_url = os.path.splitext(img_url)[0] + ".webp"
                            changed = True
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

        # 4. Update Promotions (if they have images)
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
