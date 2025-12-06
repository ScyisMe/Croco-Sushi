
import asyncio
import os
import sys

# Add the project root to the python path
sys.path.append(os.getcwd())

# Patch DATABASE_URL for local execution (outside docker)
os.environ["DATABASE_URL"] = os.environ.get("DATABASE_URL", "").replace("postgres@", "localhost@").replace("postgres:", "localhost:")
# If the above replacement isn't enough (e.g. if it was postgres:5432), try to be more robust or just hardcode if needed
# Actually, the user's .env likely has postgresql+asyncpg://user:pass@postgres:5432/db
# We want postgresql+asyncpg://user:pass@localhost:5432/db

from app.core.config import settings
# Force update settings if they were already loaded (though we haven't imported them yet)
# But let's just do a manual string replace on the loaded settings to be safe if import happened
new_url = str(settings.DATABASE_URL).replace("@postgres", "@localhost")
# settings.DATABASE_URL might be a pydantic PostgresDsn object or string depending on version. 
# Let's rely on the env var being set BEFORE import if possible, but config imports env immediately.

# Better approach: Manually create engine with corrected URL
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def fix_addresses_schema():
    print("Fixing addresses schema...")
    
    # Hardcode local URL based on .env content
    # Try postgres user (default)
    db_url = "postgresql+asyncpg://postgres:postgres@localhost:5432/croco_sushi"
    print(f"Connecting to: {db_url}")
    
    engine = create_async_engine(db_url)
    
    async with engine.begin() as conn:
        try:
            # Drop the not null constraint on user_id
            await conn.execute(text("ALTER TABLE addresses ALTER COLUMN user_id DROP NOT NULL"))
            print("Successfully made user_id nullable in addresses table.")
        except Exception as e:
            print(f"Error updating schema: {e}")

if __name__ == "__main__":
    asyncio.run(fix_addresses_schema())
