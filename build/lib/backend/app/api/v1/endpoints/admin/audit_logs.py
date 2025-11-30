"""Admin endpoints для Audit Log"""
from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from pydantic import BaseModel, ConfigDict

from app.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.models.audit_log import AuditLog

router = APIRouter()


class AuditLogResponse(BaseModel):
    """Відповідь з audit log"""
    id: int
    user_id: Optional[int]
    action: str
    resource_type: str
    resource_id: Optional[int]
    old_values: Optional[dict]
    new_values: Optional[dict]
    ip_address: Optional[str]
    user_agent: Optional[str]
    details: Optional[dict]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


@router.get("", response_model=List[AuditLogResponse])
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    user_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Отримати список audit logs"""
    query = select(AuditLog)
    
    conditions = []
    
    if action:
        conditions.append(AuditLog.action == action)
    
    if resource_type:
        conditions.append(AuditLog.resource_type == resource_type)
    
    if user_id:
        conditions.append(AuditLog.user_id == user_id)
    
    if date_from:
        conditions.append(func.date(AuditLog.created_at) >= date_from)
    
    if date_to:
        conditions.append(func.date(AuditLog.created_at) <= date_to)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return logs


@router.get("/export")
async def export_audit_logs(
    format: str = Query("csv", pattern="^(csv|excel)$"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Експорт audit logs"""
    # TODO: Реалізувати експорт в CSV/Excel
    
    return {
        "message": "Експорт audit logs",
        "format": format,
        "date_from": date_from,
        "date_to": date_to
    }

