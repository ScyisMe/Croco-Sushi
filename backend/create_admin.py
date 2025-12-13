
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.core.config import settings

# Use settings from config
DATABASE_URL = settings.DATABASE_URL

async def create_admin():
    print(f"Connecting to database...")
    engine = create_async_engine(DATABASE_URL)
    
    async with AsyncSession(engine) as session:
        # Check if admin exists
        email = "admin@croco.com"
        result = await session.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"Admin user '{email}' already exists.")
            # Update password just in case
            existing_user.hashed_password = get_password_hash("admin123")
            existing_user.role = UserRole.ADMIN
            existing_user.is_active = True
            await session.commit()
            print(f"Updated password for '{email}'.")
        else:
            new_admin = User(
                email=email,
                name="Super Admin",
                phone="+380000000000",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                is_active=True
            )
            session.add(new_admin)
            await session.commit()
            print(f"Created admin user: {email} / admin123")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_admin())
