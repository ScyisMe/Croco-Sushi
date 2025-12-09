import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.user import User, UserRole

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres:Lavanda1488@postgres:5432/croco_sushi')
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        result = await session.execute(select(User).where(User.role.in_([UserRole.ADMIN, UserRole.MANAGER])))
        users = result.scalars().all()
        print('Admins/Managers:')
        for u in users:
            print(f'{u.email} - {u.role.value} - {u.phone}')

asyncio.run(main())
