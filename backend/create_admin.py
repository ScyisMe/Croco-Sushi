"""
SQL скрипт для створення адміністратора
"""
import asyncio
from app.database import get_engine
from app.core.security import get_password_hash


async def create_admin_sql():
    """Створити адміністратора через SQL"""
    engine = get_engine()
    # hashed_password = get_password_hash("admin123")
    hashed_password = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5gzHCc6MqrX56"
    
    sql = f"""
    INSERT INTO users (
        phone, email, name, hashed_password, is_active, 
        two_factor_enabled, newsletter_subscription, bonus_balance, loyalty_status,
        created_at, updated_at, role
    ) VALUES (
        '+380123456789', 
        'admin@crocosushi.com', 
        'Адміністратор', 
        '{hashed_password}', 
        true, 
        false, 
        false, 
        0, 
        'new',
        NOW(),
        NOW(),
        'ADMIN'
    )
    ON CONFLICT (phone) DO UPDATE 
    SET email = EXCLUDED.email,
        name = EXCLUDED.name;
    """
    
    async with engine.begin() as conn:
        await conn.execute(sqlalchemy.text(sql))
    
    print("✅ Адміністратора успішно створено!")
    print("Телефон: +380123456789")
    print("Email: admin@crocosushi.com")
    print("Пароль: admin123")
    print("\n⚠️  ВАЖЛИВО: Змініть пароль після першого входу!")


if __name__ == "__main__":
    import sqlalchemy
    asyncio.run(create_admin_sql())
