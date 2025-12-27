import asyncio
import sys
import os

# Add backend directory to path so we can import app
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from sqlalchemy import text
from app.database import get_async_session_local

async def fix_constraint():
    print(f"Connecting to database to fix constraint...")
    session_factory = get_async_session_local()
    async with session_factory() as session:
        try:
            # 1. Drop existing constraint
            print("Dropping existing constraint 'check_order_status'...")
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
