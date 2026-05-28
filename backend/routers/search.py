"""
全局搜索接口 — 并发搜索项目/联系人/合同/服务/任务
GET /api/search?q=xxx&limit=5
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models

router = APIRouter(tags=["搜索"])


@router.get("/search")
def global_search(
    q: str = Query(default="", description="搜索关键词"),
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    if not q.strip():
        return {"items": []}

    pattern = f"%{q.strip()}%"
    items: list[dict] = []

    # ── 项目 ──
    projects = (
        db.query(models.Project)
        .filter(or_(models.Project.name.ilike(pattern), models.Project.code.ilike(pattern)))
        .order_by(models.Project.updated_at.desc())
        .limit(limit)
        .all()
    )
    for p in projects:
        items.append({
            "type": "project",
            "id": p.id,
            "title": p.name,
            "subtitle": p.code or "",
            "status": p.status or "",
            "link": "/projects",
        })

    # ── 联系人 ──
    contacts = (
        db.query(models.Contact)
        .filter(or_(models.Contact.name.ilike(pattern), models.Contact.company.ilike(pattern)))
        .order_by(models.Contact.updated_at.desc())
        .limit(limit)
        .all()
    )
    for c in contacts:
        items.append({
            "type": "contact",
            "id": c.id,
            "title": c.name,
            "subtitle": c.company or "",
            "status": c.position or "",
            "link": "/contacts",
        })

    # ── 合同 ──
    contracts = (
        db.query(models.Contract)
        .filter(
            or_(
                models.Contract.name.ilike(pattern),
                models.Contract.contract_number.ilike(pattern),
            )
        )
        .order_by(models.Contract.updated_at.desc())
        .limit(limit)
        .all()
    )
    for c in contracts:
        ct_label = "销售合同" if c.contract_type == "sales" else "采购合同"
        items.append({
            "type": "contract",
            "id": c.id,
            "title": c.name,
            "subtitle": c.contract_number or "",
            "status": f"{ct_label} · {c.status or ''}",
            "link": "/contracts",
        })

    # ── 服务 ──
    services = (
        db.query(models.Service)
        .filter(models.Service.title.ilike(pattern))
        .order_by(models.Service.updated_at.desc())
        .limit(limit)
        .all()
    )
    for s in services:
        st_label = {
            "implementation": "实施", "training": "培训",
            "maintenance": "运维", "support": "支持",
        }.get(s.service_type or "", s.service_type or "")
        items.append({
            "type": "service",
            "id": s.id,
            "title": s.title,
            "subtitle": st_label,
            "status": s.status or "",
            "link": "/services",
        })

    # ── 任务 ──
    tasks = (
        db.query(models.Task)
        .filter(models.Task.title.ilike(pattern))
        .order_by(models.Task.updated_at.desc())
        .limit(limit)
        .all()
    )
    for t in tasks:
        items.append({
            "type": "task",
            "id": t.id,
            "title": t.title,
            "subtitle": "",
            "status": t.status or "",
            "link": "/tasks",
        })

    return {"items": items}
