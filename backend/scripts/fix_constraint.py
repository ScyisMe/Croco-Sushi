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
    
    # FORCE OVERRIDE: The VPS environment variables are stubborn and use the wrong user 'postgres'
    # We will ignore them and forcefully use the known working credentials.
    # PROVIDED BY USER: admin_croco:Spicy-Tuna-Roll-2025-Tasty!
    
    print("!!! FORCING OVERRIDE OF DATABASE CREDENTIALS !!!")
    print("Ignoring environment variables to bypass 'postgres' auth failure.")
    
    env_db_url = "postgresql+asyncpg://admin_croco:Spicy-Tuna-Roll-2025-Tasty!@postgres:5432/croco_sushi"
    
    print(f"Applying override to settings...")
    # Override the settings object which get_async_session_local uses
    settings.DATABASE_URL = env_db_url
    
    # Verify just in case
    # This rebuilds the engine with the new URL
    from app.database import get_engine, _engine
    # If engine was already created, we might need to dispose it?
    # But this is a fresh script run, so it should be fine.
    
    print(f"Connecting to database to fix constraint...")
    print(f"Using Connection String (masked): {env_db_url.replace('Spicy-Tuna-Roll-2025-Tasty!', '****')}")
    
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
