from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/stats", tags=["统计"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """返回仪表盘所需的各模块聚合统计数据"""

    # ─── 项目统计 ──────────────────────────────────────────────────────────
    project_status_counts = dict(
        db.query(models.Project.status, func.count(models.Project.id))
        .group_by(models.Project.status)
        .all()
    )
    project_total = sum(project_status_counts.values())

    # ─── 联系人统计 ────────────────────────────────────────────────────────
    contact_total = db.query(func.count(models.Contact.id)).scalar() or 0

    # ─── 合同统计 ──────────────────────────────────────────────────────────
    contract_total = db.query(func.count(models.Contract.id)).scalar() or 0
    contract_amount_total = db.query(func.coalesce(func.sum(models.Contract.amount), 0)).scalar() or 0
    contract_sales_amount = (
        db.query(func.coalesce(func.sum(models.Contract.amount), 0))
        .filter(models.Contract.contract_type == "sales")
        .scalar()
    ) or 0
    contract_purchase_amount = (
        db.query(func.coalesce(func.sum(models.Contract.amount), 0))
        .filter(models.Contract.contract_type == "purchase")
        .scalar()
    ) or 0
    contract_status_counts = dict(
        db.query(models.Contract.status, func.count(models.Contract.id))
        .group_by(models.Contract.status)
        .all()
    )

    # ─── 款项统计 ──────────────────────────────────────────────────────────
    payment_total = db.query(func.count(models.Payment.id)).scalar() or 0
    payment_income_amount = (
        db.query(func.coalesce(func.sum(models.Payment.amount), 0))
        .filter(models.Payment.payment_type == "income")
        .scalar()
    ) or 0
    payment_expense_amount = (
        db.query(func.coalesce(func.sum(models.Payment.amount), 0))
        .filter(models.Payment.payment_type == "expense")
        .scalar()
    ) or 0
    # 收款：已收 / 待收
    income_paid = (
        db.query(func.coalesce(func.sum(models.Payment.amount), 0))
        .filter(models.Payment.payment_type == "income", models.Payment.status == "paid")
        .scalar()
    ) or 0
    income_pending = (
        db.query(func.coalesce(func.sum(models.Payment.amount), 0))
        .filter(models.Payment.payment_type == "income", models.Payment.status.in_(["pending", "partial", "overdue"]))
        .scalar()
    ) or 0
    # 付款：已付 / 待付
    expense_paid = (
        db.query(func.coalesce(func.sum(models.Payment.amount), 0))
        .filter(models.Payment.payment_type == "expense", models.Payment.status == "paid")
        .scalar()
    ) or 0
    expense_pending = (
        db.query(func.coalesce(func.sum(models.Payment.amount), 0))
        .filter(models.Payment.payment_type == "expense", models.Payment.status.in_(["pending", "partial", "overdue"]))
        .scalar()
    ) or 0

    # ─── 拜访统计 ──────────────────────────────────────────────────────────
    visit_total = db.query(func.count(models.VisitLog.id)).scalar() or 0

    # ─── 报价统计 ──────────────────────────────────────────────────────────
    quote_total = db.query(func.count(models.Quote.id)).scalar() or 0
    quote_amount_total = db.query(func.coalesce(func.sum(models.Quote.total), 0)).scalar() or 0

    # ─── 服务统计 ──────────────────────────────────────────────────────────
    service_total = db.query(func.count(models.Service.id)).scalar() or 0
    service_status_counts = dict(
        db.query(models.Service.status, func.count(models.Service.id))
        .group_by(models.Service.status)
        .all()
    )

    # ─── 任务统计 ──────────────────────────────────────────────────────────
    task_total = db.query(func.count(models.Task.id)).scalar() or 0
    task_status_counts = dict(
        db.query(models.Task.status, func.count(models.Task.id))
        .group_by(models.Task.status)
        .all()
    )

    # ─── 附件统计 ──────────────────────────────────────────────────────────
    attachment_total = (
        db.query(func.count(models.Contract.id))
        .filter(
            models.Contract.contract_file != "",
            models.Contract.contract_file.isnot(None),
        ).scalar() or 0
    ) + (
        db.query(func.count(models.Project.id))
        .filter(
            models.Project.project_file != "",
            models.Project.project_file.isnot(None),
        ).scalar() or 0
    ) + (
        db.query(func.count(models.Payment.id))
        .filter(
            models.Payment.invoice_file != "",
            models.Payment.invoice_file.isnot(None),
        ).scalar() or 0
    )

    # ─── 最近项目（仪表盘展示用，取最新5条）────────────────────────────────
    recent_projects = []
    projects = (
        db.query(models.Project)
        .order_by(models.Project.created_at.desc())
        .limit(5)
        .all()
    )
    for p in projects:
        recent_projects.append({
            "id": p.id,
            "name": p.name,
            "code": p.code or "",
            "status": p.status or "",
            "budget": p.budget or 0,
            "ownerName": p.owner_name or "",
        })

    # ─── 待回款提醒（仪表盘展示用，取最新3条非已付记录）────────────────────
    pending_payments = []
    payments = (
        db.query(models.Payment)
        .filter(models.Payment.status != "paid")
        .order_by(models.Payment.payment_date.desc())
        .limit(3)
        .all()
    )
    for pm in payments:
        pending_payments.append({
            "id": pm.id,
            "paymentNumber": pm.payment_number or "",
            "paymentDate": pm.payment_date or "",
            "amount": pm.amount or 0,
            "status": pm.status or "",
        })

    return {
        "projects": {
            "total": project_total,
            "byStatus": project_status_counts,
        },
        "contacts": {
            "total": contact_total,
        },
        "contracts": {
            "total": contract_total,
            "totalAmount": contract_amount_total,
            "salesAmount": contract_sales_amount,
            "purchaseAmount": contract_purchase_amount,
            "byStatus": contract_status_counts,
        },
        "payments": {
            "total": payment_total,
            "incomeAmount": payment_income_amount,
            "expenseAmount": payment_expense_amount,
            "incomePaid": income_paid,
            "incomePending": income_pending,
            "expensePaid": expense_paid,
            "expensePending": expense_pending,
        },
        "visitLogs": {
            "total": visit_total,
        },
        "quotes": {
            "total": quote_total,
            "totalAmount": quote_amount_total,
        },
        "services": {
            "total": service_total,
            "byStatus": service_status_counts,
        },
        "tasks": {
            "total": task_total,
            "byStatus": task_status_counts,
        },
        "attachments": {
            "total": attachment_total,
        },
        "recentProjects": recent_projects,
        "pendingPayments": pending_payments,
    }


@router.get("/monthly")
def get_monthly_trend(months: int = 12, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """返回近N个月的收款/付款趋势数据"""
    from datetime import datetime, timedelta

    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=months * 31)

    # 查询区间内所有 payments，按月份 + 类型分组
    rows = (
        db.query(
            extract("year", models.Payment.payment_date).label("year"),
            extract("month", models.Payment.payment_date).label("month"),
            models.Payment.payment_type,
            func.coalesce(func.sum(models.Payment.amount), 0).label("total"),
        )
        .filter(models.Payment.payment_date >= start_date.strftime("%Y-%m-%d"))
        .filter(models.Payment.payment_date <= end_date.strftime("%Y-%m-%d"))
        .group_by("year", "month", models.Payment.payment_type)
        .order_by("year", "month")
        .all()
    )

    # 构建 12 个月份的序列
    months_list = []
    for i in range(months - 1, -1, -1):
        d = end_date - timedelta(days=i * 31)
        year = d.year
        month = d.month
        months_list.append({
            "label": f"{month}月",
            "year": year,
            "month": month,
            "income": 0,
            "expense": 0,
        })

    # 填充数据
    for row in rows:
        for m in months_list:
            if m["year"] == row.year and m["month"] == row.month:
                if row.payment_type == "income":
                    m["income"] = int(row.total)
                elif row.payment_type == "expense":
                    m["expense"] = int(row.total)

    return {"months": months_list}
