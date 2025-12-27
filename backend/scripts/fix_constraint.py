import asyncio
import sys
import os

# Add backend directory to path so we can import app
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from sqlalchemy import text
from app.database import get_async_session_local
from app.core.config import settings
import re

async def fix_constraint():
    # Patch DATABASE_URL if POSTGRES_PASSWORD is set (similar to alembic env.py)
    postgres_password = os.environ.get('POSTGRES_PASSWORD')
    if postgres_password:
        print(f"Found POSTGRES_PASSWORD in environment, patching DATABASE_URL...")
        # Simple replacement for password part
        # Assumes format: driver://user:password@host...
        try:
            current_url = settings.DATABASE_URL
            if "://" in current_url and "@" in current_url:
                # Regex to replace password: match between second colon and @
                # pattern: ://username:PASSWORD@
                # We Capture ://username:
                match = re.search(r'(://[^:]+):([^@]+)@', current_url)
                if match:
                    prefix = match.group(1)
                    # Construct new URL
                    # Escape password for URL if needed? 
                    # Usually asyncpg handles it, but if we inject raw string, special chars might break url.
                    # Ideally we should use make_url/URL from sqlalchemy but let's try direct replacement first if simple
                    # Or better: construct new URL properly
                    
                    # Safer approach using string replacement if we trust the structure
                    # But simpler: check if the default password 'postgres' is there and replace it
                    if ":postgres@" in current_url and postgres_password != "postgres":
                         settings.DATABASE_URL = current_url.replace(":postgres@", f":{postgres_password}@")
                    elif match:
                         # Replace whatever password was there
                         settings.DATABASE_URL = re.sub(r'(://[^:]+):[^@]+@', rf'\1:{postgres_password}@', current_url)
            
            print("DATABASE_URL patched.")
        except Exception as e:
            print(f"Warning: Failed to patch DATABASE_URL: {e}")

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
