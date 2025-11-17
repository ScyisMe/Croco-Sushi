"""Власні винятки для додатку"""
from fastapi import HTTPException, status


class CrocoSushiException(HTTPException):
    """Базовий клас для всіх винятків"""
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(CrocoSushiException):
    """Об'єкт не знайдено"""
    def __init__(self, detail: str = "Об'єкт не знайдено"):
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedException(CrocoSushiException):
    """Не авторизовано"""
    def __init__(self, detail: str = "Не авторизовано"):
        super().__init__(detail=detail, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(CrocoSushiException):
    """Доступ заборонено"""
    def __init__(self, detail: str = "Доступ заборонено"):
        super().__init__(detail=detail, status_code=status.HTTP_403_FORBIDDEN)


class ValidationException(CrocoSushiException):
    """Помилка валідації"""
    def __init__(self, detail: str = "Помилка валідації даних"):
        super().__init__(detail=detail, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class ConflictException(CrocoSushiException):
    """Конфлікт (наприклад, вже існує)"""
    def __init__(self, detail: str = "Конфлікт даних"):
        super().__init__(detail=detail, status_code=status.HTTP_409_CONFLICT)


class BadRequestException(CrocoSushiException):
    """Невірний запит"""
    def __init__(self, detail: str = "Невірний запит"):
        super().__init__(detail=detail, status_code=status.HTTP_400_BAD_REQUEST)


