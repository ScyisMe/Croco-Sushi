#!/usr/bin/env python3
"""
Script to clear invalid image URLs from products.
"""

import asyncio
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://postgres:Lavanda1488@postgres:5432/croco_sushi"

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models.product import Product

async def fix_image_urls():
    """Clear invalid image URLs from products"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            print("🔧 Fixing product image URLs...")
            
            # Get all products
            result = await session.execute(select(Product))
            products = result.scalars().all()
            
            fixed_count = 0
            for product in products:
                if product.image_url:
                    # Check for invalid URLs (external pagespeed URLs, non-existent paths)
                    if any(x in product.image_url for x in ['pagespeed', 'http://', 'https://']):
                        print(f"  🗑️  Clearing invalid URL for: {product.name}")
                        print(f"      Old URL: {product.image_url[:80]}...")
                        product.image_url = None
                        fixed_count += 1
                    elif product.image_url.startswith('/images/') or product.image_url.startswith('/uploads/'):
                        # Keep local URLs but verify they might still be invalid
                        # For now, we'll leave local paths as they might be valid
                        pass
            
            await session.commit()
            print(f"\n✅ Fixed {fixed_count} products with invalid image URLs")
            print("Products now have null image_url and will show placeholder")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
            raise

if __name__ == "__main__":
    asyncio.run(fix_image_urls())
