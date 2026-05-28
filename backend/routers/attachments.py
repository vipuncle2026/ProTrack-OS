"""附件中心 - 聚合展示项目文件、合同文件、发票文件"""
from math import ceil
from fastapi import APIRouter, Query
from database import get_db
import models

router = APIRouter(tags=["附件中心"])


@router.get("/attachments")
def list_attachments(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str = Query("", max_length=200),
):
    db = next(get_db())

    all_items = []

    # ── 合同文件 ──────────────────────────────────────────────
    contracts = db.query(models.Contract).filter(
        models.Contract.contract_file != "",
        models.Contract.contract_file.isnot(None),
    ).all()
    for c in contracts:
        project = db.query(models.Project).filter(models.Project.id == c.project_id).first()
        all_items.append({
            "type": "contract",
            "id": c.id,
            "name": c.name or c.contract_number or "",
            "fileName": c.contract_file,
            "projectName": project.name if project else "",
            "module": "合同管理",
            "date": c.sign_date or c.created_at or "",
            "fileUrl": f"/api/contracts/{c.id}/file",
        })

    # ── 项目文件 ──────────────────────────────────────────────
    projects = db.query(models.Project).filter(
        models.Project.project_file != "",
        models.Project.project_file.isnot(None),
    ).all()
    for p in projects:
        all_items.append({
            "type": "project",
            "id": p.id,
            "name": p.name,
            "fileName": p.project_file,
            "projectName": p.name,
            "module": "项目管理",
            "date": p.updated_at or p.created_at or "",
            "fileUrl": f"/api/projects/{p.id}/file",
        })

    # ── 发票文件 ──────────────────────────────────────────────
    payments = db.query(models.Payment).filter(
        models.Payment.invoice_file != "",
        models.Payment.invoice_file.isnot(None),
    ).all()
    for pm in payments:
        project = db.query(models.Project).filter(models.Project.id == pm.project_id).first()
        all_items.append({
            "type": "payment",
            "id": pm.id,
            "name": pm.payment_number or "",
            "fileName": pm.invoice_file,
            "projectName": project.name if project else "",
            "module": "款项管理",
            "date": pm.payment_date or pm.created_at or "",
            "fileUrl": f"/api/payments/{pm.id}/invoice-file",
        })

    # ── 搜索 ──────────────────────────────────────────────────
    if search:
        s = search.lower()
        all_items = [
            it for it in all_items
            if s in (it["name"].lower() if it["name"] else "")
            or s in (it["fileName"].lower() if it["fileName"] else "")
        ]

    # ── 排序（按日期倒序）────────────────────────────────────
    all_items.sort(key=lambda x: x["date"] or "", reverse=True)

    # ── 分页 ──────────────────────────────────────────────────
    total = len(all_items)
    total_pages = max(1, ceil(total / limit)) if total > 0 else 1
    safe_page = min(page, total_pages) if total > 0 else 1
    offset = (safe_page - 1) * limit
    page_items = all_items[offset:offset + limit]

    return {
        "items": page_items,
        "total": total,
        "page": safe_page,
        "limit": limit,
        "totalPages": total_pages,
    }
