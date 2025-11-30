"""
Скрипт для створення адміністратора

Використання:
docker-compose exec backend python create_admin.py
"""
import asyncio
import sys
sys.path.insert(0, '/app')

from app.database import get_db, AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import select


async def create_admin():
    """Створити адміністратора"""
    async with AsyncSessionLocal() as db:
        # Перевіряємо чи адмін вже існує
        result = await db.execute(
            select(User).where(User.phone == "+380123456789")
        )
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print("❌ Адміністратор з таким номером вже існує!")
            print(f"Телефон: {existing_admin.phone}")
            print(f"Email: {existing_admin.email or 'не вказано'}")
            return
        
        # Створюємо адміністратора
        admin = User(
            phone="+380123456789",
            email="admin@crocosushi.com",
            name="Адміністратор",
            hashed_password=get_password_hash("admin123"),
            is_active=True,
            is_admin=True,
            role="admin"
        )
        
        db.add(admin)
        await db.commit()
        await db.refresh(admin)
        
        print("✅ Адміністратора успішно створено!")
        print(f"Телефон: {admin.phone}")
        print(f"Email: {admin.email}")
        print(f"Пароль: admin123")
        print("\n⚠️  ВАЖЛИВО: Змініть пароль після першого входу!")


if __name__ == "__main__":
    asyncio.run(create_admin())
