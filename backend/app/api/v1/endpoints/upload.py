"""API endpoints для завантаження файлів"""
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.database import get_db
from app.core.dependencies import get_current_active_user
from app.core.exceptions import ForbiddenException
from app.models.user import User
from app.utils.file_upload import (
    save_uploaded_file,
    save_image_with_processing,
    delete_file_by_url as delete_file_util,
    validate_image_file
)

router = APIRouter()


class UploadResponse(BaseModel):
    """Відповідь на завантаження файлу"""
    url: str
    thumbnail_url: Optional[str] = None
    message: str = "Файл успішно завантажено"


@router.post("/image", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    subdirectory: str = "images",
    create_thumbnail: bool = False,
    current_user: User = Depends(get_current_active_user)
):
    """Завантаження зображення (тільки для авторизованих користувачів)"""
    # Валідація subdirectory - захист від path traversal
    if ".." in subdirectory or "/" in subdirectory or "\\" in subdirectory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимий subdirectory"
        )
    
    # Валідація файлу
    validate_image_file(file)
    
    # Збереження зображення з обробкою
    file_path, file_url, thumbnail_url = await save_image_with_processing(
        file=file,
        subdirectory=subdirectory,
        prefix="img",
        create_thumbnail=create_thumbnail
    )
    
    return UploadResponse(
        url=file_url,
        thumbnail_url=thumbnail_url,
        message="Зображення успішно завантажено"
    )


@router.post("/image/admin", response_model=UploadResponse)
async def upload_image_admin(
    file: UploadFile = File(...),
    subdirectory: str = "admin",
    create_thumbnail: bool = True,
    current_user: User = Depends(get_current_active_user)
):
    """Завантаження зображення для адмін-панелі (тільки для адмінів)"""
    if not current_user.is_admin:
        raise ForbiddenException("Доступ заборонено")
    
    # Валідація subdirectory - захист від path traversal
    if ".." in subdirectory or "/" in subdirectory or "\\" in subdirectory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимий subdirectory"
        )
    
    # Валідація файлу
    validate_image_file(file)
    
    # Збереження зображення з обробкою
    file_path, file_url, thumbnail_url = await save_image_with_processing(
        file=file,
        subdirectory=subdirectory,
        prefix="admin",
        create_thumbnail=create_thumbnail
    )
    
    return UploadResponse(
        url=file_url,
        thumbnail_url=thumbnail_url,
        message="Зображення успішно завантажено"
    )


@router.post("/file", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    subdirectory: str = "files",
    current_user: User = Depends(get_current_active_user)
):
    """Завантаження файлу (тільки для авторизованих користувачів)"""
    # Валідація subdirectory - захист від path traversal
    if ".." in subdirectory or "/" in subdirectory or "\\" in subdirectory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимий subdirectory"
        )
    
    # Валідація файлу (для зображень)
    if file.content_type and file.content_type.startswith("image/"):
        validate_image_file(file)
    
    # Збереження файлу
    file_path, file_url = await save_uploaded_file(
        file=file,
        subdirectory=subdirectory,
        prefix="file"
    )
    
    return UploadResponse(
        url=file_url,
        message="Файл успішно завантажено"
    )


@router.delete("/file")
async def delete_file_endpoint(
    file_url: str,
    current_user: User = Depends(get_current_active_user)
):
    """Видалення файлу (тільки для авторизованих користувачів)"""
    # Адміни можуть видаляти будь-які файли
    # Інші користувачі - тільки свої (потрібна логіка перевірки)
    
    result = delete_file_util(file_url)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл не знайдено"
        )
    
    return {"message": "Файл успішно видалено"}

