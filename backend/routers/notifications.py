"""通知路由 - 返回日期感知的待处理警报"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["通知"])


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _days_later(n: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=n)).strftime("%Y-%m-%d")


@router.get("")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = _today()
    week_later = _days_later(7)
    month_later = _days_later(30)
    notifications: list[dict] = []

    # 1. 逾期回款（payment_date < today AND status != paid）
    overdue_payments = (
        db.query(models.Payment)
        .filter(models.Payment.status != "paid")
        .filter(models.Payment.payment_date < today)
        .all()
    )
    for p in overdue_payments:
        notifications.append({
            "id": f"pay-overdue-{p.id}",
            "type": "payment_overdue",
            "title": "回款逾期",
            "message": f"#{p.payment_number} 应于 {p.payment_date} 回款 ¥{p.amount:,.0f}，已逾期",
            "link": "/payments",
            "date": p.payment_date,
            "priority": "high",
            "createdAt": today,
        })

    # 2. 即将到期的报价（valid_until 在未来7天内 AND status = 'sent'）
    expiring_quotes = (
        db.query(models.Quote)
        .filter(models.Quote.status == "sent")
        .filter(models.Quote.valid_until >= today)
        .filter(models.Quote.valid_until <= week_later)
        .all()
    )
    for q in expiring_quotes:
        notifications.append({
            "id": f"quote-expire-{q.id}",
            "type": "quote_expiring",
            "title": "报价即将到期",
            "message": f"#{q.quote_number} 有效期至 {q.valid_until}",
            "link": "/quotes",
            "date": q.valid_until,
            "priority": "medium",
            "createdAt": today,
        })

    # 3. 即将到期的合同（end_date 在未来30天内）
    expiring_contracts = (
        db.query(models.Contract)
        .filter(models.Contract.status.in_(["signed", "executing"]))
        .filter(models.Contract.end_date >= today)
        .filter(models.Contract.end_date <= month_later)
        .all()
    )
    for c in expiring_contracts:
        notifications.append({
            "id": f"contract-expire-{c.id}",
            "type": "contract_expiring",
            "title": "合同即将到期",
            "message": f"#{c.contract_number} {c.name} 将于 {c.end_date} 到期",
            "link": "/contracts",
            "date": c.end_date,
            "priority": "medium",
            "createdAt": today,
        })

    # 4. 逾期任务（due_date < today AND status != 'done'）
    overdue_tasks = (
        db.query(models.Task)
        .filter(models.Task.status != "done")
        .filter(models.Task.due_date != "")
        .filter(models.Task.due_date < today)
        .all()
    )
    for t in overdue_tasks:
        notifications.append({
            "id": f"task-overdue-{t.id}",
            "type": "task_overdue",
            "title": "任务逾期",
            "message": f"{t.title} 截止日期 {t.due_date}，当前状态: {t.status}",
            "link": "/tasks",
            "date": t.due_date,
            "priority": "high",
            "createdAt": today,
        })

    # 按优先级排序：high > medium > low
    priority_order = {"high": 0, "medium": 1, "low": 2}
    notifications.sort(key=lambda n: (priority_order.get(n["priority"], 9), n["date"]))

    return {
        "items": notifications,
        "total": len(notifications),
        "unreadCount": len(notifications),
    }
