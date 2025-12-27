import asyncio
import sys
import os
import re

# Add backend directory to path so we can import app
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from sqlalchemy import text
from app.database import get_async_session_local
from app.core.config import settings

async def fix_constraint():
    print("Configuring database connection...")
    
    # 1. Try explicit DATABASE_URL from environment
    env_db_url = os.environ.get('DATABASE_URL')
    
    # Debug: Print what we found (masking password)
    if env_db_url:
        safe_env = re.sub(r':([^@]+)@', ':****@', env_db_url)
        print(f"Found DATABASE_URL in env: {safe_env}")
        if "postgres" in env_db_url and "admin_croco" not in env_db_url:
            print("WARNING: Env URL seems to be using default 'postgres' user.")
    else:
        print("No DATABASE_URL found in environment variables.")

    # FALLBACK: Explicitly use the credentials provided if env is missing or default
    # This is a temporary fix to bypass Docker environment issues
    if not env_db_url or "postgres:postgres" in env_db_url:
        print("Using HARDCODED credentials for repair script (Bypassing Env Vars)")
        # PROVIDED BY USER
        env_db_url = "postgresql+asyncpg://admin_croco:Spicy-Tuna-Roll-2025-Tasty!@postgres:5432/croco_sushi"
    
    # Apply to settings
    if env_db_url:
        print(f"Overriding settings.DATABASE_URL...")
        settings.DATABASE_URL = env_db_url
        
        # Verify user in final URL
        match = re.search(r'://([^:]+):', env_db_url)
        if match:
            print(f"Final Connection User: {match.group(1)}")
    
    print(f"Connecting to database to fix constraint...")
    session_factory = get_async_session_local()
    async with session_factory() as session:
        try:
            # 1. Drop existing constraint
            print("Dropping existing constraint 'check_order_status'...")
            # We use text() for raw SQL
            await session.execute(text("ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_order_status"))
            
            # 2. Add new constraint with 'ready' status
            print("Adding new constraint 'check_order_status'...")
            # Note: We must include ALL valid statuses
            await session.execute(text("ALTER TABLE orders ADD CONSTRAINT check_order_status CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled'))"))
            
            await session.commit()
            print("Constraint successfully updated! 'ready' status should now be accepted.")
        except Exception as e:
            print(f"Error executing database update: {e}")
            await session.rollback()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(fix_constraint())
