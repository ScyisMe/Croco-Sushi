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
    
    # 2. Try constructing from components if no full URL
    if not env_db_url:
        user = os.environ.get('POSTGRES_USER')
        password = os.environ.get('POSTGRES_PASSWORD')
        db = os.environ.get('POSTGRES_DB')
        host = os.environ.get('POSTGRES_SERVER', 'postgres') # Default docker service name
        port = os.environ.get('POSTGRES_PORT', '5432')
        
        if user and password and db:
            print(f"Constructing URL from env vars: User={user}, DB={db}, Host={host}")
            # Ensure proper encoding/format if needed, but simple string usually works for basic driver
            env_db_url = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"

    # 3. Apply to settings if found
    if env_db_url:
        print(f"Overriding settings.DATABASE_URL with environment value")
        # Mask password for logging
        safe_url = re.sub(r':([^@]+)@', ':****@', env_db_url)
        print(f"Using URL: {safe_url}")
        settings.DATABASE_URL = env_db_url
    else:
        print("Using default settings.DATABASE_URL")

    # 4. Final check for password patching if we fell back to settings (Legacy check)
    if not env_db_url and os.environ.get('POSTGRES_PASSWORD'):
        postgres_password = os.environ.get('POSTGRES_PASSWORD')
        current_url = settings.DATABASE_URL
        if ":postgres@" in current_url and postgres_password != "postgres":
             print("Patching default password with POSTGRES_PASSWORD")
             settings.DATABASE_URL = current_url.replace(":postgres@", f":{postgres_password}@")

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
