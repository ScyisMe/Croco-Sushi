import sqlalchemy
from sqlalchemy import create_engine, text
import os
import sys

def fix_db():
    # 1. Get raw URL
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("Error: DATABASE_URL not set")
        sys.exit(1)

    # 2. Fix driver for sync execution (asyncpg -> psycopg2)
    # We strip the async driver to use the standard sync one for this maintenance script
    if 'postgresql+asyncpg' in db_url:
        db_url = db_url.replace('postgresql+asyncpg', 'postgresql+psycopg2')
    elif 'postgres://' in db_url:
        db_url = db_url.replace('postgres://', 'postgresql+psycopg2://')
        
    print(f'Connecting to DB...')
    try:
        engine = create_engine(db_url)
        
        with engine.begin() as conn:
            target_rev = '14f5860962b3'
            print(f'Forcing DB version to {target_rev}...')
            
            # Try update first
            result = conn.execute(text(f"UPDATE alembic_version SET version_num = '{target_rev}'"))
            
            # If no rows updated, it means table is empty or doesn't exist? 
            # Usually alembic_version table exists but might be empty if init failed weirdly.
            # But here we assume it exists because user had previous migrations.
            
            if result.rowcount == 0:
                 # Check if table exists/is empty
                 conn.execute(text(f"INSERT INTO alembic_version (version_num) VALUES ('{target_rev}')"))
            
            print(f'Success! Database version forced to {target_rev}.')
            print('You can now run: alembic revision --autogenerate -m "Add callback table"')
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fix_db()
