"""Admin endpoints для управління товарами"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from pydantic import BaseModel

from app.database import get_db
from app.core.dependencies import get_current_admin_user
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.user import User
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()


class BulkDeleteRequest(BaseModel):
    ids: List[int]


class BulkUpdateRequest(BaseModel):
    ids: List[int]
    data: dict  # {"is_available": False, "price": 100, ...}


@router.get("", response_model=List[ProductResponse])
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=1000),
    category_id: Optional[int] = None,
    is_available: Optional[bool] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати список товарів (адмін)"""
    query = select(Product)
    
    if category_id:
        query = query.where(Product.category_id == category_id)
    
    if is_available is not None:
        query = query.where(Product.is_available == is_available)
    
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    
    query = query.order_by(Product.position, Product.name).offset(skip).limit(limit)
    
    result = await db.execute(query)
    products = result.scalars().all()
    return products


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Створити товар"""
    # Перевірка чи slug вже існує
    result = await db.execute(select(Product).where(Product.slug == product_data.slug))
    existing = result.scalar_one_or_none()
    
    if existing:
        raise BadRequestException("Товар з таким slug вже існує")
    
    # Отримання максимальної позиції
    result = await db.execute(select(func.max(Product.position)))
    max_position = result.scalar_one_or_none()
    position = (max_position + 1) if max_position is not None else 0
    
    # Виключаємо position з model_dump, щоб не було конфлікту
    product_dict = product_data.model_dump(exclude={"position"})
    new_product = Product(
        **product_dict,
        position=position
    )
    
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    
    return new_product


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати товар за ID (адмін)"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise NotFoundException("Товар не знайдено")
    
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Оновити товар"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise NotFoundException("Товар не знайдено")
    
    # Перевірка slug, якщо змінюється
    if product_data.slug and product_data.slug != product.slug:
        result = await db.execute(
            select(Product).where(
                Product.slug == product_data.slug,
                Product.id != product_id
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise BadRequestException("Товар з таким slug вже існує")
    
    # Оновлення полів
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    await db.commit()
    await db.refresh(product)
    
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Видалити товар"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise NotFoundException("Товар не знайдено")
    
    # ORM-based delete
    await db.delete(product)
    await db.commit()
    
    return None


@router.post("/{product_id}/images", status_code=status.HTTP_201_CREATED)
async def upload_product_images(
    product_id: int,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Завантажити зображення товару"""
    # Валідація: обмеження кількості файлів
    if len(files) > 10:
        raise BadRequestException("Максимальна кількість зображень: 10")
    
    # Валідація типів файлів
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    max_size = 5 * 1024 * 1024  # 5MB
    
    for file in files:
        if file.content_type not in allowed_types:
            raise BadRequestException(
                f"Непідтримуваний тип файлу: {file.content_type}. "
                f"Дозволені: JPEG, PNG, WebP, GIF"
            )
        # Перевірка розміру (читаємо файл для перевірки)
        content = await file.read()
        if len(content) > max_size:
            raise BadRequestException(
                f"Файл {file.filename} перевищує максимальний розмір 5MB"
            )
        # Повертаємо курсор на початок для подальшого використання
        await file.seek(0)
    
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise NotFoundException("Товар не знайдено")
    
    # TODO: Реалізувати збереження файлів на диск/S3
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Завантаження зображень ще не реалізовано"
    )


@router.delete("/{product_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_image(
    product_id: int,
    image_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Видалити зображення товару"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise NotFoundException("Товар не знайдено")
    
    # TODO: Реалізувати видалення зображень
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Видалення зображень ще не реалізовано"
    )


@router.put("/bulk-update", status_code=status.HTTP_204_NO_CONTENT)
async def bulk_update_products(
    request: BulkUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Масове оновлення товарів"""
    # Валідація: обмежуємо кількість товарів для безпеки
    if not request.ids:
        raise BadRequestException("Список ID не може бути порожнім")
    
    if len(request.ids) > 100:
        raise BadRequestException("Максимальна кількість товарів для масового оновлення: 100")
    
    # Валідація: перевірка що всі ID - це числа
    if not all(isinstance(id, int) and id > 0 for id in request.ids):
        raise BadRequestException("Всі ID повинні бути додатніми числами")
    
    result = await db.execute(
        select(Product).where(Product.id.in_(request.ids))
    )
    products = result.scalars().all()
    
    # Білий список дозволених полів для оновлення (безпека)
    allowed_fields = {
        "is_available", "is_new", "is_popular", "position",
        "price", "old_price", "category_id"
    }
    
    for product in products:
        for field, value in request.data.items():
            # Перевірка що поле дозволене та існує
            if field in allowed_fields and hasattr(product, field):
                setattr(product, field, value)
    
    await db.commit()
    
    return None


@router.delete("/bulk-delete", status_code=status.HTTP_204_NO_CONTENT)
async def bulk_delete_products(
    request: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Масове видалення товарів"""
    # Валідація: перевірка списку ID
    if not request.ids:
        raise BadRequestException("Список ID не може бути порожнім")
    
    if len(request.ids) > 100:
        raise BadRequestException("Максимальна кількість товарів для видалення: 100")
    
    if not all(isinstance(id, int) and id > 0 for id in request.ids):
        raise BadRequestException("Всі ID повинні бути додатніми числами")
    
    result = await db.execute(
        select(Product).where(Product.id.in_(request.ids))
    )
    products = result.scalars().all()
    
    # ORM-based delete для кожного продукту
    for product in products:
        await db.delete(product)
    
    await db.commit()
    
    return None


@router.post("/import", status_code=status.HTTP_200_OK)
async def import_products(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Імпорт товарів з CSV/Excel"""
    # TODO: Реалізувати імпорт товарів з файлу
    # Перевірка формату файлу
    if not file.filename:
        raise BadRequestException("Файл не вказано")
    
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ['csv', 'xlsx', 'xls']:
        raise BadRequestException("Непідтримуваний формат файлу. Підтримуються: CSV, XLSX, XLS")
    
    # TODO: Читання файлу та створення товарів
    # Повертаємо заглушку
    return {
        "message": "Імпорт товарів буде реалізовано",
        "filename": file.filename,
        "format": file_extension
    }


@router.get("/export")
async def export_products(
    format: str = Query("csv", pattern="^(csv|excel)$"),
    category_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Експорт товарів в CSV/Excel"""
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    # Отримуємо товари
    query = select(Product)
    if category_id:
        query = query.where(Product.category_id == category_id)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    # TODO: Реалізувати повноцінний експорт з Excel підтримкою
    # Поки що експорт CSV
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Заголовки
        writer.writerow([
            "ID", "Назва", "Slug", "Опис", "Ціна", "Стара ціна",
            "Категорія", "Доступний", "Новинка", "Популярний"
        ])
        
        # Дані
        for product in products:
            writer.writerow([
                product.id, product.name, product.slug, product.description or "",
                product.price, product.old_price or "", product.category_id,
                product.is_available, product.is_new, product.is_popular
            ])
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=products.csv"}
        )
    else:
        # TODO: Excel експорт
        return {"message": "Excel експорт буде реалізовано", "format": format}

