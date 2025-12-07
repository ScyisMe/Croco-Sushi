
import asyncio
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def reset_admin():
    db_url = settings.DATABASE_URL
    logger.info(f"Connecting to database at {db_url}...")
    
    # Create engine directly from settings
    engine = create_async_engine(db_url)
    
    async with AsyncSession(engine) as session:
        email = "admin@croco.com"
        password = "admin123"
        
        logger.info(f"Checking for user {email}...")
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if user:
            logger.info("User found. Updating password...")
            user.hashed_password = get_password_hash(password)
            user.role = UserRole.ADMIN
            user.is_active = True
            await session.commit()
            logger.info("Password updated successfully.")
        else:
            logger.info("User not found. Creating new admin user...")
            new_user = User(
                email=email,
                name="Super Admin",
                phone="+380000000000",
                hashed_password=get_password_hash(password),
                role=UserRole.ADMIN,
                is_active=True
            )
            session.add(new_user)
            await session.commit()
            logger.info("Admin user created successfully.")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_admin())
