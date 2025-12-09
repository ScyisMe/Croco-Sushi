#!/usr/bin/env python3
"""
Seed script to populate the database with sample data.
Run this script to add sample clients, sushi products, and orders.
"""

import asyncio
import random
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Database URL
DATABASE_URL = "postgresql+asyncpg://postgres:Lavanda1488@postgres:5432/croco_sushi"

# Import models
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import Base
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.product import Product
from app.models.order import Order, OrderItem
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Sample data
SAMPLE_CLIENTS = [
    {"name": "Олександр Петренко", "phone": "+380501234567", "email": "alex.petrenko@gmail.com"},
    {"name": "Марія Коваленко", "phone": "+380671234568", "email": "maria.kovalenko@ukr.net"},
    {"name": "Іван Шевченко", "phone": "+380931234569", "email": "ivan.shevchenko@gmail.com"},
    {"name": "Анна Бондаренко", "phone": "+380661234570", "email": "anna.bondarenko@mail.com"},
    {"name": "Дмитро Ткаченко", "phone": "+380501234571", "email": "dmytro.tkachenko@gmail.com"},
    {"name": "Олена Кравченко", "phone": "+380671234572", "email": "olena.kravchenko@ukr.net"},
    {"name": "Андрій Мельник", "phone": "+380931234573", "email": "andrii.melnyk@gmail.com"},
    {"name": "Катерина Лисенко", "phone": "+380661234574", "email": "kateryna.lysenko@mail.com"},
    {"name": "Сергій Захарченко", "phone": "+380501234575", "email": "sergii.zakharchenko@gmail.com"},
    {"name": "Наталія Гончаренко", "phone": "+380671234576", "email": "natalia.goncharenko@ukr.net"},
    {"name": "Віктор Козак", "phone": "+380931234577", "email": "viktor.kozak@gmail.com"},
    {"name": "Юлія Романенко", "phone": "+380661234578", "email": "yulia.romanenko@mail.com"},
    {"name": "Олег Павленко", "phone": "+380501234579", "email": "oleg.pavlenko@gmail.com"},
    {"name": "Тетяна Савченко", "phone": "+380671234580", "email": "tetyana.savchenko@ukr.net"},
    {"name": "Максим Левченко", "phone": "+380931234581", "email": "maksym.levchenko@gmail.com"},
]

SAMPLE_CATEGORIES = [
    {"name": "Роли", "slug": "rolls", "description": "Класичні та оригінальні роли"},
    {"name": "Суші", "slug": "sushi", "description": "Традиційні японські суші"},
    {"name": "Сети", "slug": "sets", "description": "Вигідні сети для компанії"},
    {"name": "Гарячі страви", "slug": "hot-dishes", "description": "Гарячі страви японської кухні"},
    {"name": "Напої", "slug": "drinks", "description": "Напої до страв"},
]

SAMPLE_PRODUCTS = [
    # Роли
    {"name": "Філадельфія", "slug": "philadelphia", "category_slug": "rolls", "price": 289, "weight": 280, "calories": 350, "description": "Лосось, крем-сир, огірок, авокадо", "ingredients": "Рис, норі, лосось, крем-сир, огірок, авокадо"},
    {"name": "Каліфорнія", "slug": "california", "category_slug": "rolls", "price": 249, "weight": 250, "calories": 320, "description": "Краб, огірок, авокадо, тобіко", "ingredients": "Рис, норі, крабове м'ясо, огірок, авокадо, ікра тобіко"},
    {"name": "Дракон", "slug": "dragon", "category_slug": "rolls", "price": 329, "weight": 300, "calories": 380, "description": "Вугор, огірок, авокадо, унагі соус", "ingredients": "Рис, норі, вугор, огірок, авокадо, унагі соус, кунжут"},
    {"name": "Спайсі лосось", "slug": "spicy-salmon", "category_slug": "rolls", "price": 219, "weight": 230, "calories": 290, "description": "Гострий лосось, огірок, спайсі соус", "ingredients": "Рис, норі, лосось, огірок, спайсі соус, зелена цибуля"},
    {"name": "Темпура креветка", "slug": "tempura-shrimp", "category_slug": "rolls", "price": 269, "weight": 270, "calories": 340, "description": "Креветка темпура, авокадо, спайсі соус", "ingredients": "Рис, норі, креветка темпура, авокадо, спайсі соус, кунжут"},
    {"name": "Веган рол", "slug": "vegan-roll", "category_slug": "rolls", "price": 179, "weight": 220, "calories": 200, "description": "Авокадо, огірок, морква, болгарський перець", "ingredients": "Рис, норі, авокадо, огірок, морква, болгарський перець"},
    {"name": "Аляска", "slug": "alaska", "category_slug": "rolls", "price": 259, "weight": 260, "calories": 330, "description": "Лосось, ікра, авокадо", "ingredients": "Рис, норі, лосось, ікра червона, авокадо, майонез"},
    {"name": "Бонито", "slug": "bonito", "category_slug": "rolls", "price": 239, "weight": 250, "calories": 310, "description": "Тунець, огірок, стружка тунця", "ingredients": "Рис, норі, тунець, огірок, стружка тунця бонито"},
    
    # Суші
    {"name": "Суші з лососем", "slug": "sushi-salmon", "category_slug": "sushi", "price": 79, "weight": 40, "calories": 60, "description": "Класичні суші з лососем", "ingredients": "Рис, лосось, норі"},
    {"name": "Суші з тунцем", "slug": "sushi-tuna", "category_slug": "sushi", "price": 89, "weight": 40, "calories": 55, "description": "Суші з свіжим тунцем", "ingredients": "Рис, тунець, норі"},
    {"name": "Суші з вугром", "slug": "sushi-eel", "category_slug": "sushi", "price": 99, "weight": 45, "calories": 70, "description": "Суші з вугром та унагі соусом", "ingredients": "Рис, вугор, унагі соус, кунжут"},
    {"name": "Суші з креветкою", "slug": "sushi-shrimp", "category_slug": "sushi", "price": 85, "weight": 40, "calories": 50, "description": "Суші з тигровою креветкою", "ingredients": "Рис, креветка, норі"},
    {"name": "Суші з окунем", "slug": "sushi-seabass", "category_slug": "sushi", "price": 75, "weight": 40, "calories": 45, "description": "Суші з морським окунем", "ingredients": "Рис, окунь, норі"},
    
    # Сети
    {"name": "Сет Філадельфія", "slug": "set-philadelphia", "category_slug": "sets", "price": 799, "weight": 1200, "calories": 1500, "description": "32 шт: Філадельфія класик, Філадельфія лайт, Каліфорнія", "ingredients": "Філадельфія класик (8шт), Філадельфія лайт (8шт), Каліфорнія (8шт), Аляска (8шт)"},
    {"name": "Сет Дракон", "slug": "set-dragon", "category_slug": "sets", "price": 999, "weight": 1400, "calories": 1800, "description": "40 шт: Дракон, Спайсі лосось, Темпура креветка", "ingredients": "Дракон (10шт), Спайсі лосось (10шт), Темпура креветка (10шт), Бонито (10шт)"},
    {"name": "Сет Мікс", "slug": "set-mix", "category_slug": "sets", "price": 1299, "weight": 1800, "calories": 2200, "description": "48 шт: різноманітні роли та суші", "ingredients": "Філадельфія (8шт), Каліфорнія (8шт), Дракон (8шт), Суші асорті (24шт)"},
    {"name": "Сет для двох", "slug": "set-for-two", "category_slug": "sets", "price": 649, "weight": 900, "calories": 1100, "description": "24 шт: ідеальний вибір для пари", "ingredients": "Філадельфія (8шт), Спайсі лосось (8шт), Суші мікс (8шт)"},
    
    # Гарячі страви
    {"name": "Рамен з куркою", "slug": "ramen-chicken", "category_slug": "hot-dishes", "price": 199, "weight": 450, "calories": 520, "description": "Гарячий рамен з курячим філе", "ingredients": "Локшина, курка, яйце, зелена цибуля, норі, бульйон"},
    {"name": "Удон з морепродуктами", "slug": "udon-seafood", "category_slug": "hot-dishes", "price": 249, "weight": 400, "calories": 480, "description": "Локшина удон з креветками та кальмарами", "ingredients": "Локшина удон, креветки, кальмари, овочі, соус теріякі"},
    {"name": "Мисо суп", "slug": "miso-soup", "category_slug": "hot-dishes", "price": 89, "weight": 300, "calories": 120, "description": "Традиційний японський суп", "ingredients": "Місо паста, тофу, вакаме, зелена цибуля"},
    {"name": "Том Ям", "slug": "tom-yam", "category_slug": "hot-dishes", "price": 179, "weight": 350, "calories": 280, "description": "Гострий тайський суп з креветками", "ingredients": "Креветки, гриби, помідори, кокосове молоко, спеції"},
    
    # Напої
    {"name": "Зелений чай", "slug": "green-tea", "category_slug": "drinks", "price": 49, "weight": 300, "calories": 5, "description": "Традиційний японський зелений чай", "ingredients": "Чай зелений"},
    {"name": "Кока-Кола", "slug": "coca-cola", "category_slug": "drinks", "price": 39, "weight": 330, "calories": 140, "description": "Coca-Cola 0.33л", "ingredients": "Coca-Cola"},
    {"name": "Сік апельсиновий", "slug": "orange-juice", "category_slug": "drinks", "price": 59, "weight": 300, "calories": 110, "description": "Свіжовичавлений апельсиновий сік", "ingredients": "Апельсиновий сік"},
    {"name": "Саке", "slug": "sake", "category_slug": "drinks", "price": 199, "weight": 200, "calories": 200, "description": "Японське рисове вино", "ingredients": "Саке"},
]

ORDER_STATUSES = ["pending", "confirmed", "preparing", "delivering", "completed", "cancelled"]

async def seed_database():
    """Main function to seed the database"""
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            print("🌱 Starting database seeding...")
            
            # 1. Create categories
            print("\n📁 Creating categories...")
            categories = {}
            for cat_data in SAMPLE_CATEGORIES:
                # Check if category exists
                result = await session.execute(select(Category).where(Category.slug == cat_data["slug"]))
                existing = result.scalar_one_or_none()
                if not existing:
                    category = Category(
                        name=cat_data["name"],
                        slug=cat_data["slug"],
                        description=cat_data["description"],
                        is_active=True,
                        position=SAMPLE_CATEGORIES.index(cat_data)
                    )
                    session.add(category)
                    await session.flush()
                    categories[cat_data["slug"]] = category
                    print(f"  ✅ Created category: {cat_data['name']}")
                else:
                    categories[cat_data["slug"]] = existing
                    print(f"  ⏭️  Category exists: {cat_data['name']}")
            
            # 2. Create products
            print("\n🍣 Creating products...")
            products = []
            for prod_data in SAMPLE_PRODUCTS:
                # Check if product exists
                result = await session.execute(select(Product).where(Product.slug == prod_data["slug"]))
                existing = result.scalar_one_or_none()
                if not existing:
                    category = categories.get(prod_data["category_slug"])
                    product = Product(
                        name=prod_data["name"],
                        slug=prod_data["slug"],
                        category_id=category.id if category else None,
                        description=prod_data["description"],
                        ingredients=prod_data["ingredients"],
                        price=Decimal(str(prod_data["price"])),
                        weight=prod_data["weight"],
                        calories=prod_data["calories"],
                        is_available=True,
                        is_new=random.choice([True, False]),
                        is_popular=random.choice([True, False]),
                        position=SAMPLE_PRODUCTS.index(prod_data)
                    )
                    session.add(product)
                    await session.flush()
                    products.append(product)
                    print(f"  ✅ Created product: {prod_data['name']} - {prod_data['price']}₴")
                else:
                    products.append(existing)
                    print(f"  ⏭️  Product exists: {prod_data['name']}")
            
            # 3. Create clients
            print("\n👥 Creating clients...")
            clients = []
            for client_data in SAMPLE_CLIENTS:
                # Check if user exists
                result = await session.execute(select(User).where(User.phone == client_data["phone"]))
                existing = result.scalar_one_or_none()
                if not existing:
                    user = User(
                        name=client_data["name"],
                        phone=client_data["phone"],
                        email=client_data["email"],
                        hashed_password=get_password_hash("password123"),
                        is_active=True,
                        role=UserRole.CLIENT,
                        bonus_balance=random.randint(0, 500),
                        loyalty_status=random.choice(["new", "silver", "gold"]),
                        newsletter_subscription=random.choice([True, False])
                    )
                    session.add(user)
                    await session.flush()
                    clients.append(user)
                    print(f"  ✅ Created client: {client_data['name']}")
                else:
                    clients.append(existing)
                    print(f"  ⏭️  Client exists: {client_data['name']}")
            
            # 4. Create orders
            print("\n📦 Creating orders...")
            for i in range(30):  # Create 30 orders
                client = random.choice(clients)
                order_products = random.sample(products, random.randint(2, 5))
                
                # Calculate total
                total = Decimal("0")
                order_items = []
                for prod in order_products:
                    qty = random.randint(1, 3)
                    total += prod.price * qty
                    order_items.append({
                        "product": prod,
                        "quantity": qty
                    })
                
                # Random date in the last 30 days
                days_ago = random.randint(0, 30)
                order_date = datetime.now() - timedelta(days=days_ago)
                
                # Generate unique order number
                order_number = f"CS-{order_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
                
                # Check if order number exists
                result = await session.execute(select(Order).where(Order.order_number == order_number))
                if result.scalar_one_or_none():
                    order_number = f"CS-{order_date.strftime('%Y%m%d')}-{random.randint(10000, 99999)}"
                
                # Random status (more completed than others)
                status_weights = [0.1, 0.1, 0.1, 0.1, 0.5, 0.1]
                status = random.choices(ORDER_STATUSES, weights=status_weights)[0]
                
                order = Order(
                    order_number=order_number,
                    user_id=client.id,
                    status=status,
                    total_amount=total,
                    delivery_cost=Decimal("50") if total < 500 else Decimal("0"),
                    customer_name=client.name,
                    customer_phone=client.phone,
                    customer_email=client.email,
                    payment_method=random.choice(["cash", "card", "online"]),
                    comment=random.choice([None, "Без васабі", "Подзвоніть за 5 хв", "Залишити біля дверей"]),
                    created_at=order_date,
                    updated_at=order_date
                )
                session.add(order)
                await session.flush()
                
                # Create order items
                for item_data in order_items:
                    order_item = OrderItem(
                        order_id=order.id,
                        product_id=item_data["product"].id,
                        product_name=item_data["product"].name,
                        quantity=item_data["quantity"],
                        price=item_data["product"].price
                    )
                    session.add(order_item)
                
                print(f"  ✅ Created order #{order_number} for {client.name} - {total}₴ ({status})")
            
            await session.commit()
            print("\n🎉 Database seeding completed successfully!")
            print(f"  📁 Categories: {len(SAMPLE_CATEGORIES)}")
            print(f"  🍣 Products: {len(SAMPLE_PRODUCTS)}")
            print(f"  👥 Clients: {len(SAMPLE_CLIENTS)}")
            print(f"  📦 Orders: 30")
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error: {e}")
            raise

if __name__ == "__main__":
    asyncio.run(seed_database())
