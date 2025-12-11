import asyncio
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import async_session_maker
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from sqlalchemy import select

load_dotenv()

async def create_manager():
    async with async_session_maker() as db:
        print("Creating manager user...")
        
        email = "manager@croco.sushi"
        phone = "+380000000001"
        password = "manager_password"
        
        # Check if user exists
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if user:
            print(f"User {email} already exists.")
            if user.role != UserRole.MANAGER:
                print("Updating role to MANAGER...")
                user.role = UserRole.MANAGER
                await db.commit()
                print("Role updated.")
            return

        # Create new user
        new_manager = User(
            email=email,
            phone=phone,
            name="Manager",
            hashed_password=get_password_hash(password),
            role=UserRole.MANAGER,
            is_active=True
        )
        
        db.add(new_manager)
        await db.commit()
        print(f"Manager user created successfully!")
        print(f"Email: {email}")
        print(f"Password: {password}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(create_manager())
