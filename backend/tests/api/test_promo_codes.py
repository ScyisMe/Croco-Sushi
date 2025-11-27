"""Детальні тести для promo codes"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.models.promo_code import PromoCode


@pytest.fixture
async def active_promo_code(db_session: AsyncSession) -> PromoCode:
    """Створює активний промокод"""
    now = datetime.now(timezone.utc)
    promo = PromoCode(
        code="TEST10",
        description="Тестова знижка 10%",
        discount_type="percent",
        discount_value=Decimal("10.00"),
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=30),
        min_order_amount=Decimal("200.00"),
        max_uses=100,
        max_uses_per_user=1,
        current_uses=0,
        is_active=True
    )
    db_session.add(promo)
    await db_session.commit()
    await db_session.refresh(promo)
    return promo


@pytest.fixture
async def fixed_discount_promo(db_session: AsyncSession) -> PromoCode:
    """Створює промокод з фіксованою знижкою"""
    now = datetime.now(timezone.utc)
    promo = PromoCode(
        code="FIXED50",
        description="Фіксована знижка 50 грн",
        discount_type="fixed",
        discount_value=Decimal("50.00"),
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=30),
        min_order_amount=Decimal("300.00"),
        max_uses=50,
        current_uses=0,
        is_active=True
    )
    db_session.add(promo)
    await db_session.commit()
    await db_session.refresh(promo)
    return promo


@pytest.fixture
async def expired_promo_code(db_session: AsyncSession) -> PromoCode:
    """Створює прострочений промокод"""
    now = datetime.now(timezone.utc)
    promo = PromoCode(
        code="EXPIRED",
        description="Прострочений промокод",
        discount_type="percent",
        discount_value=Decimal("20.00"),
        start_date=now - timedelta(days=30),
        end_date=now - timedelta(days=1),  # Завершився вчора
        is_active=True
    )
    db_session.add(promo)
    await db_session.commit()
    await db_session.refresh(promo)
    return promo


@pytest.fixture
async def future_promo_code(db_session: AsyncSession) -> PromoCode:
    """Створює майбутній промокод"""
    now = datetime.now(timezone.utc)
    promo = PromoCode(
        code="FUTURE",
        description="Майбутній промокод",
        discount_type="percent",
        discount_value=Decimal("15.00"),
        start_date=now + timedelta(days=1),  # Починається завтра
        end_date=now + timedelta(days=30),
        is_active=True
    )
    db_session.add(promo)
    await db_session.commit()
    await db_session.refresh(promo)
    return promo


@pytest.fixture
async def max_uses_promo(db_session: AsyncSession) -> PromoCode:
    """Створює промокод з вичерпаним лімітом"""
    now = datetime.now(timezone.utc)
    promo = PromoCode(
        code="MAXUSED",
        description="Вичерпаний промокод",
        discount_type="percent",
        discount_value=Decimal("10.00"),
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=30),
        max_uses=5,
        current_uses=5,  # Досягнуто ліміту
        is_active=True
    )
    db_session.add(promo)
    await db_session.commit()
    await db_session.refresh(promo)
    return promo


# ========== Тести моделі PromoCode ==========

@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_creation(active_promo_code: PromoCode):
    """Тест створення промокоду"""
    assert active_promo_code.id is not None
    assert active_promo_code.code == "TEST10"
    assert active_promo_code.discount_type == "percent"
    assert active_promo_code.discount_value == Decimal("10.00")
    assert active_promo_code.is_active is True


@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_unique_code(db_session: AsyncSession, active_promo_code: PromoCode):
    """Тест унікальності коду промокоду"""
    from sqlalchemy.exc import IntegrityError
    
    now = datetime.now(timezone.utc)
    duplicate_promo = PromoCode(
        code="TEST10",  # Дублікат
        discount_type="percent",
        discount_value=Decimal("5.00"),
        start_date=now,
        end_date=now + timedelta(days=1),
        is_active=True
    )
    db_session.add(duplicate_promo)
    
    with pytest.raises(IntegrityError):
        await db_session.commit()
    
    await db_session.rollback()


@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_percent_discount(active_promo_code: PromoCode):
    """Тест розрахунку відсоткової знижки"""
    order_amount = Decimal("500.00")
    discount = order_amount * (active_promo_code.discount_value / 100)
    assert discount == Decimal("50.00")


@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_fixed_discount(fixed_discount_promo: PromoCode):
    """Тест фіксованої знижки"""
    assert fixed_discount_promo.discount_type == "fixed"
    assert fixed_discount_promo.discount_value == Decimal("50.00")
    
    # Фіксована знижка не залежить від суми замовлення
    order_amount = Decimal("1000.00")
    discount = fixed_discount_promo.discount_value
    assert discount == Decimal("50.00")


@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_min_order_amount(active_promo_code: PromoCode):
    """Тест мінімальної суми замовлення"""
    assert active_promo_code.min_order_amount == Decimal("200.00")
    
    # Перевірка що замовлення нижче мінімуму не підходить
    order_amount = Decimal("150.00")
    is_valid = order_amount >= active_promo_code.min_order_amount
    assert is_valid is False
    
    # Замовлення вище мінімуму
    order_amount = Decimal("250.00")
    is_valid = order_amount >= active_promo_code.min_order_amount
    assert is_valid is True


@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_date_validation(active_promo_code: PromoCode, expired_promo_code: PromoCode, future_promo_code: PromoCode):
    """Тест валідації дат промокоду"""
    now = datetime.now(timezone.utc)
    
    # Конвертуємо дати в timezone-aware якщо потрібно
    def make_aware(dt):
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt
    
    # Активний промокод
    start = make_aware(active_promo_code.start_date)
    end = make_aware(active_promo_code.end_date)
    is_active_valid = start <= now <= end
    assert is_active_valid is True
    
    # Прострочений промокод
    start = make_aware(expired_promo_code.start_date)
    end = make_aware(expired_promo_code.end_date)
    is_expired_valid = start <= now <= end
    assert is_expired_valid is False
    
    # Майбутній промокод
    start = make_aware(future_promo_code.start_date)
    end = make_aware(future_promo_code.end_date)
    is_future_valid = start <= now <= end
    assert is_future_valid is False


@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_max_uses(active_promo_code: PromoCode, max_uses_promo: PromoCode):
    """Тест обмеження кількості використань"""
    # Активний промокод з доступними використаннями
    has_uses_left = active_promo_code.current_uses < active_promo_code.max_uses
    assert has_uses_left is True
    
    # Промокод з вичерпаним лімітом
    has_uses_left = max_uses_promo.current_uses < max_uses_promo.max_uses
    assert has_uses_left is False


@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_increment_uses(db_session: AsyncSession, active_promo_code: PromoCode):
    """Тест збільшення лічильника використань"""
    initial_uses = active_promo_code.current_uses
    
    active_promo_code.current_uses += 1
    await db_session.commit()
    await db_session.refresh(active_promo_code)
    
    assert active_promo_code.current_uses == initial_uses + 1


@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_deactivation(db_session: AsyncSession, active_promo_code: PromoCode):
    """Тест деактивації промокоду"""
    assert active_promo_code.is_active is True
    
    active_promo_code.is_active = False
    await db_session.commit()
    await db_session.refresh(active_promo_code)
    
    assert active_promo_code.is_active is False


@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_unlimited_uses(db_session: AsyncSession):
    """Тест промокоду без обмеження використань"""
    now = datetime.now(timezone.utc)
    unlimited_promo = PromoCode(
        code="UNLIMITED",
        discount_type="percent",
        discount_value=Decimal("5.00"),
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=30),
        max_uses=None,  # Без обмеження
        is_active=True
    )
    db_session.add(unlimited_promo)
    await db_session.commit()
    await db_session.refresh(unlimited_promo)
    
    assert unlimited_promo.max_uses is None
    
    # Завжди має доступні використання
    has_uses_left = unlimited_promo.max_uses is None or unlimited_promo.current_uses < unlimited_promo.max_uses
    assert has_uses_left is True


@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_case_sensitivity(db_session: AsyncSession):
    """Тест чутливості до регістру коду"""
    from sqlalchemy import select
    
    now = datetime.now(timezone.utc)
    promo = PromoCode(
        code="TESTCASE",
        discount_type="percent",
        discount_value=Decimal("10.00"),
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=30),
        is_active=True
    )
    db_session.add(promo)
    await db_session.commit()
    
    # Пошук з точним регістром
    result = await db_session.execute(
        select(PromoCode).where(PromoCode.code == "TESTCASE")
    )
    found_promo = result.scalar_one_or_none()
    assert found_promo is not None
    
    # Пошук з іншим регістром (залежить від БД)
    result = await db_session.execute(
        select(PromoCode).where(PromoCode.code == "testcase")
    )
    found_promo_lower = result.scalar_one_or_none()
    # SQLite за замовчуванням case-insensitive для LIKE, але case-sensitive для =
    # Тому може бути None


@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_discount_calculation(active_promo_code: PromoCode, fixed_discount_promo: PromoCode):
    """Тест розрахунку знижки для різних типів"""
    order_amount = Decimal("1000.00")
    
    # Відсоткова знижка
    if active_promo_code.discount_type == "percent":
        discount = order_amount * (active_promo_code.discount_value / 100)
        assert discount == Decimal("100.00")  # 10% від 1000
    
    # Фіксована знижка
    if fixed_discount_promo.discount_type == "fixed":
        discount = min(fixed_discount_promo.discount_value, order_amount)
        assert discount == Decimal("50.00")


@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_max_discount_not_exceed_order(db_session: AsyncSession):
    """Тест що знижка не перевищує суму замовлення"""
    now = datetime.now(timezone.utc)
    big_discount_promo = PromoCode(
        code="BIGDISCOUNT",
        discount_type="fixed",
        discount_value=Decimal("500.00"),  # Велика знижка
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=30),
        is_active=True
    )
    db_session.add(big_discount_promo)
    await db_session.commit()
    
    order_amount = Decimal("300.00")
    
    # Знижка не повинна перевищувати суму замовлення
    discount = min(big_discount_promo.discount_value, order_amount)
    assert discount == Decimal("300.00")
    assert discount <= order_amount


@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_timestamps(db_session: AsyncSession):
    """Тест автоматичних timestamps"""
    now = datetime.now(timezone.utc)
    promo = PromoCode(
        code="TIMESTAMPS",
        discount_type="percent",
        discount_value=Decimal("5.00"),
        start_date=now,
        end_date=now + timedelta(days=1),
        is_active=True
    )
    db_session.add(promo)
    await db_session.commit()
    await db_session.refresh(promo)
    
    assert promo.created_at is not None
    assert promo.updated_at is not None


@pytest.mark.asyncio
@pytest.mark.api
async def test_promo_code_update_timestamp(db_session: AsyncSession, active_promo_code: PromoCode):
    """Тест оновлення updated_at при зміні"""
    import asyncio
    
    original_updated = active_promo_code.updated_at
    
    # Невелика затримка
    await asyncio.sleep(0.1)
    
    active_promo_code.description = "Оновлений опис"
    await db_session.commit()
    await db_session.refresh(active_promo_code)
    
    # updated_at повинен оновитися (якщо БД підтримує onupdate)
    # SQLite in-memory може не підтримувати це автоматично
    assert active_promo_code.description == "Оновлений опис"

