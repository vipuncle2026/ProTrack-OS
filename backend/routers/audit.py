"""
操作审计查询接口
GET /api/audit-logs?page=1&limit=50
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from math import ceil
from database import get_db
from auth import get_current_user
import re
import models

router = APIRouter(tags=["操作审计"])


@router.get("/audit-logs")
def list_audit_logs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    search: str = Query(default=""),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    """查询操作审计日志，支持搜索"""
    query = db.query(models.AuditLog)

    if search.strip():
        pattern = f"%{search.strip()}%"
        query = query.filter(
            models.AuditLog.action.ilike(pattern)
        )

    query = query.order_by(desc(models.AuditLog.created_at))

    total = query.count()
    total_pages = max(1, ceil(total / limit)) if total > 0 else 1
    safe_page = min(page, total_pages) if total > 0 else 1
    offset_val = (safe_page - 1) * limit

    items = query.offset(offset_val).limit(limit).all()

    # 转为 camelCase 字典
    def _to_camel(s: str) -> str:
        parts = s.split("_")
        return parts[0] + "".join(p.title() for p in parts[1:])

    result_items = []
    for item in items:
        d = {}
        for col in models.AuditLog.__table__.columns:
            d[_to_camel(col.name)] = getattr(item, col.name)
        result_items.append(d)

    return {
        "items": result_items,
        "total": total,
        "page": safe_page,
        "limit": limit,
        "totalPages": total_pages,
    }
