import asyncio
import sys
import os

# Додаємо поточну директорію до шляху пошуку модулів
sys.path.append(os.getcwd())

from app.database import get_async_session_local
from app.models.user import User
from sqlalchemy import select

async def check_users():
    session_maker = get_async_session_local()
    async with session_maker() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"ID: {user.id}, Phone: {user.phone}, Email: {user.email}, Role: {user.role}, Is Admin: {user.is_admin}")

if __name__ == "__main__":
    asyncio.run(check_users())
