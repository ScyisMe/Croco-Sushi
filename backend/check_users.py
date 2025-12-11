import asyncio
from app.database import get_async_session_local
from app.models.user import User
from sqlalchemy import select

async def check_users():
    session_factory = get_async_session_local()
    async with session_factory() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f"I found {len(users)} users:")
        for user in users:
            print(f"User: {user.email}, Role: {user.role}, Is Active: {user.is_active}")

if __name__ == "__main__":
    asyncio.run(check_users())
