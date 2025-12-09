#!/usr/bin/env python3
"""
Script to add new categories with images.
Run: docker exec croco-sushi-backend python add_categories.py
"""

import asyncio
from decimal import Decimal
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models.category import Category

DATABASE_URL = "postgresql+asyncpg://postgres:Lavanda1488@postgres:5432/croco_sushi"

# New categories with images
NEW_CATEGORIES = [
    {
        "name": "Акційні пропозиції",
        "slug": "promo",
        "description": "Вигідні акційні пропозиції та знижки",
        "image_url": "/images/categories/promo.jpg",
        "position": 0
    },
    {
        "name": "Фірмові",
        "slug": "signature",
        "description": "Авторські роли від шеф-кухаря",
        "image_url": "/images/categories/signature.png",
        "position": 1
    },
    {
        "name": "Класичні",
        "slug": "classic",
        "description": "Традиційні класичні роли",
        "image_url": "/images/categories/classic.png",
        "position": 2
    },
]

async def add_categories():
    """Add new categories with images"""
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            print("🍱 Adding new categories...")
            
            for cat_data in NEW_CATEGORIES:
                # Check if category exists
                result = await session.execute(
                    select(Category).where(Category.slug == cat_data["slug"])
                )
                existing = result.scalar_one_or_none()
                
                if existing:
                    # Update image_url
                    existing.image_url = cat_data["image_url"]
                    existing.name = cat_data["name"]
                    existing.description = cat_data["description"]
                    existing.position = cat_data["position"]
                    print(f"  ✅ Updated category: {cat_data['name']}")
                else:
                    # Create new category
                    category = Category(
                        name=cat_data["name"],
                        slug=cat_data["slug"],
                        description=cat_data["description"],
                        image_url=cat_data["image_url"],
                        is_active=True,
                        position=cat_data["position"]
                    )
                    session.add(category)
                    print(f"  ✅ Created category: {cat_data['name']}")
            
            await session.commit()
            print("\n🎉 Categories added/updated successfully!")
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error: {e}")
            raise

if __name__ == "__main__":
    asyncio.run(add_categories())
