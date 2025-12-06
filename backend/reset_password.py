import asyncio
import sys
import os

# Додаємо поточну директорію до шляху пошуку модулів
sys.path.append(os.getcwd())

from app.database import get_async_session_local
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import select

async def reset_password():
    session_maker = get_async_session_local()
    async with session_maker() as session:
        result = await session.execute(select(User).where(User.email == "admin@crocosushi.com"))
        user = result.scalar_one_or_none()
        
        if user:
            print(f"Found admin user: {user.email}")
            user.hashed_password = get_password_hash("admin1234")
            await session.commit()
            print("Password reset to 'admin1234'")
        else:
            print("Admin user not found")

if __name__ == "__main__":
    asyncio.run(reset_password())
