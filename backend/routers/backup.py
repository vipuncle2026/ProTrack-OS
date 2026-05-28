from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import os
import io
import json
import shutil
import zipfile
from database import get_db, BASE_DIR
import models
from auth import get_current_user
from utils import now_str

router = APIRouter(prefix="/backup", tags=["备份"])


# ─── 序列化辅助 ────────────────────────────────────────────────────────────────

def _model_to_dict(obj) -> dict:
    """将 SQLAlchemy 模型转为普通 dict"""
    d = {}
    for c in obj.__table__.columns:
        val = getattr(obj, c.name)
        d[c.name] = val
    return d


def _dict_to_model_data(d: dict, prefix: str = "") -> dict:
    """将下划线命名的 dict 转为前端 camelCase 命名的 dict"""
    mapping = {
        "id": "id", "name": "name", "code": "code", "type": "type",
        "status": "status", "description": "description",
        "budget": "budget", "actual_cost": "actualCost",
        "owner_id": "ownerId", "owner_name": "ownerName",
        "department_id": "departmentId", "department_name": "departmentName",
        "start_date": "startDate", "end_date": "endDate",
        "created_at": "createdAt", "updated_at": "updatedAt",
        "company": "company", "position": "position", "department": "department",
        "phone": "phone", "mobile": "mobile", "email": "email",
        "project_id": "projectId", "role": "role", "notes": "notes",
        "contact_id": "contactId", "contact_name": "contactName",
        "visit_date": "visitDate", "location": "location",
        "purpose": "purpose", "content": "content", "result": "result",
        "next_action": "nextAction", "attachments": "attachments",
        "created_by": "createdBy",
        "quote_number": "quoteNumber", "quote_date": "quoteDate",
        "valid_until": "validUntil", "subtotal": "subtotal",
        "discount": "discount", "tax_rate": "taxRate",
        "tax_amount": "taxAmount", "total": "total", "items": "items",
        "contract_number": "contractNumber", "amount": "amount",
        "contract_type": "contractType",
        "payment_method": "paymentMethod", "sign_date": "signDate",
        "contract_file": "contractFile", "terms": "terms",
        "payment_number": "paymentNumber", "payment_date": "paymentDate",
        "payment_type": "paymentType",
        "invoice_number": "invoiceNumber", "invoice_file": "invoiceFile",
        "service_type": "serviceType", "title": "title",
        "assigned_to": "assignedTo", "assigned_name": "assignedName",
        "estimated_hours": "estimatedHours", "actual_hours": "actualHours",
        "report": "report", "rating": "rating",
        "due_date": "dueDate", "priority": "priority",
        "completed_at": "completedAt",
        "cost_date": "costDate",
        "project_file": "projectFile",
    }
    result = {}
    for k, v in d.items():
        new_key = mapping.get(k, k)
        # JSON 可序列化处理
        if isinstance(v, (bytes, bytearray)):
            v = None
        result[new_key] = v
    return result


# ─── 请求体 Schema ─────────────────────────────────────────────────────────────

class RestoreRequest(BaseModel):
    projects: List[Dict] = []
    contacts: List[Dict] = []
    visitLogs: List[Dict] = []
    quotes: List[Dict] = []
    contracts: List[Dict] = []
    payments: List[Dict] = []
    services: List[Dict] = []
    tasks: List[Dict] = []
    directCosts: List[Dict] = []
    backupDate: Optional[str] = None


# ─── 工具函数 ──────────────────────────────────────────────────────────────────

def _clear_business_data(db: Session):
    """清空所有业务数据（保留 users 表），按外键依赖倒序删除"""
    db.query(models.DirectCost).delete()
    db.query(models.Task).delete()
    db.query(models.Service).delete()
    db.query(models.Payment).delete()
    db.query(models.Contract).delete()
    db.query(models.Quote).delete()
    db.query(models.VisitLog).delete()
    db.query(models.Contact).delete()
    db.query(models.Project).delete()
    db.flush()

    # 清理所有上传文件
    for subdir in ["contracts", "payments", "projects"]:
        uploads_dir = os.path.join(BASE_DIR, "uploads", subdir)
        if os.path.exists(uploads_dir):
            shutil.rmtree(uploads_dir)
            os.makedirs(uploads_dir, exist_ok=True)


def _get_all_data(db: Session) -> dict:
    """导出所有业务表数据（camelCase 格式）"""
    return {
        "projects": [_model_to_dict(r) for r in db.query(models.Project).all()],
        "contacts": [_model_to_dict(r) for r in db.query(models.Contact).all()],
        "visitLogs": [_model_to_dict(r) for r in db.query(models.VisitLog).all()],
        "quotes": [_model_to_dict(r) for r in db.query(models.Quote).all()],
        "contracts": [_model_to_dict(r) for r in db.query(models.Contract).all()],
        "payments": [_model_to_dict(r) for r in db.query(models.Payment).all()],
        "services": [_model_to_dict(r) for r in db.query(models.Service).all()],
        "tasks": [_model_to_dict(r) for r in db.query(models.Task).all()],
        "directCosts": [_model_to_dict(r) for r in db.query(models.DirectCost).all()],
    }


# ─── 接口 ──────────────────────────────────────────────────────────────────────

@router.get("/export")
def export_zip(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    导出完整备份 ZIP 包。
    - 仅管理员可操作
    - 包含 data.json（所有业务表数据）+ contracts/ 目录（上传的合同文件）
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="仅管理员可导出备份")

    data = _get_all_data(db)

    # 转为 camelCase 格式写入 JSON
    json_str = json.dumps({
        "projects": [_dict_to_model_data(r) for r in data["projects"]],
        "contacts": [_dict_to_model_data(r) for r in data["contacts"]],
        "visitLogs": [_dict_to_model_data(r) for r in data["visitLogs"]],
        "quotes": [_dict_to_model_data(r) for r in data["quotes"]],
        "contracts": [_dict_to_model_data(r) for r in data["contracts"]],
        "payments": [_dict_to_model_data(r) for r in data["payments"]],
        "services": [_dict_to_model_data(r) for r in data["services"]],
        "tasks": [_dict_to_model_data(r) for r in data["tasks"]],
        "directCosts": [_dict_to_model_data(r) for r in data["directCosts"]],
        "backupDate": now_str(),
    }, ensure_ascii=False, indent=2, default=str)

    # 构建内存 ZIP
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("data.json", json_str)

        # 打包合同文件
        contracts_dir = os.path.join(BASE_DIR, "uploads", "contracts")
        if os.path.exists(contracts_dir):
            for fname in os.listdir(contracts_dir):
                fpath = os.path.join(contracts_dir, fname)
                if os.path.isfile(fpath):
                    zf.write(fpath, f"contracts/{fname}")

        # 打包项目文件
        projects_dir = os.path.join(BASE_DIR, "uploads", "projects")
        if os.path.exists(projects_dir):
            for dirname in os.listdir(projects_dir):
                dirpath = os.path.join(projects_dir, dirname)
                if os.path.isdir(dirpath):
                    for fname in os.listdir(dirpath):
                        fpath = os.path.join(dirpath, fname)
                        if os.path.isfile(fpath):
                            zf.write(fpath, f"projects/{dirname}/{fname}")

        # 打包发票文件
        payments_dir = os.path.join(BASE_DIR, "uploads", "payments")
        if os.path.exists(payments_dir):
            for dirname in os.listdir(payments_dir):
                dirpath = os.path.join(payments_dir, dirname)
                if os.path.isdir(dirpath):
                    for fname in os.listdir(dirpath):
                        fpath = os.path.join(dirpath, fname)
                        if os.path.isfile(fpath):
                            zf.write(fpath, f"payments/{dirname}/{fname}")

    buf.seek(0)

    timestamp = now_str().replace(" ", "T").replace(":", "-")[:19]
    filename = f"protrack_backup_{timestamp}.zip"

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@router.post("/restore", status_code=200)
async def restore_zip(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    从备份 ZIP 文件恢复数据。
    - 仅管理员可操作
    - ZIP 需包含 data.json（业务数据）+ 可选的 contracts/ 目录（合同文件）
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="仅管理员可执行数据恢复操作")

    if not file.filename or not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="请上传 .zip 格式的备份文件")

    try:
        zip_bytes = await file.read()
        buf = io.BytesIO(zip_bytes)

        with zipfile.ZipFile(buf, "r") as zf:
            # 校验必备文件
            if "data.json" not in zf.namelist():
                raise HTTPException(status_code=400, detail="备份文件无效：缺少 data.json")

            # 读取 JSON 数据
            json_data = json.loads(zf.read("data.json").decode("utf-8"))

            # 清空现有业务数据（含上传文件）
            _clear_business_data(db)

            # 恢复数据库记录
            _restore_records(db, json_data, current_user.id)
            db.commit()

            # 恢复上传文件
            for member in zf.namelist():
                if member.endswith("/"):
                    continue
                # 合同文件
                if member.startswith("contracts/"):
                    dst_dir = os.path.join(BASE_DIR, "uploads", "contracts")
                    fname = os.path.basename(member)
                    os.makedirs(dst_dir, exist_ok=True)
                    with zf.open(member) as src:
                        with open(os.path.join(dst_dir, fname), "wb") as dst:
                            dst.write(src.read())
                # 项目文件 (path: projects/{project_id}/{filename})
                elif member.startswith("projects/"):
                    rel = member[len("projects/"):]
                    dst_path = os.path.join(BASE_DIR, "uploads", "projects", rel)
                    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                    with zf.open(member) as src:
                        with open(dst_path, "wb") as dst:
                            dst.write(src.read())
                # 发票文件 (path: payments/{payment_id}/{filename})
                elif member.startswith("payments/"):
                    rel = member[len("payments/"):]
                    dst_path = os.path.join(BASE_DIR, "uploads", "payments", rel)
                    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                    with zf.open(member) as src:
                        with open(dst_path, "wb") as dst:
                            dst.write(src.read())

        counts = {
            "projects": len(json_data.get("projects", [])),
            "contacts": len(json_data.get("contacts", [])),
            "visitLogs": len(json_data.get("visitLogs", [])),
            "quotes": len(json_data.get("quotes", [])),
            "contracts": len(json_data.get("contracts", [])),
            "payments": len(json_data.get("payments", [])),
            "services": len(json_data.get("services", [])),
            "tasks": len(json_data.get("tasks", [])),
            "directCosts": len(json_data.get("directCosts", [])),
        }

        return {
            "message": "数据恢复成功",
            "counts": counts,
        }

    except HTTPException:
        raise
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="文件损坏：无法解压 ZIP")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="备份文件无效：data.json 格式错误")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"数据恢复失败: {str(e)}")


def _restore_records(db: Session, data: dict, user_id: str):
    """将 JSON 数据写入数据库（把 camelCase 转回 snake_case）"""
    def _snake(d: dict) -> dict:
        """camelCase → snake_case"""
        mapping = {
            "id": "id", "name": "name", "code": "code", "type": "type",
            "status": "status", "description": "description",
            "budget": "budget", "actualCost": "actual_cost",
            "ownerId": "owner_id", "ownerName": "owner_name",
            "departmentId": "department_id", "departmentName": "department_name",
            "startDate": "start_date", "endDate": "end_date",
            "createdAt": "created_at", "updatedAt": "updated_at",
            "company": "company", "position": "position", "department": "department",
            "phone": "phone", "mobile": "mobile", "email": "email",
            "projectId": "project_id", "role": "role", "notes": "notes",
            "contactId": "contact_id", "contactName": "contact_name",
            "visitDate": "visit_date", "location": "location",
            "purpose": "purpose", "content": "content", "result": "result",
            "nextAction": "next_action", "attachments": "attachments",
            "createdBy": "created_by",
            "quoteNumber": "quote_number", "quoteDate": "quote_date",
            "validUntil": "valid_until", "subtotal": "subtotal",
            "discount": "discount", "taxRate": "tax_rate",
            "taxAmount": "tax_amount", "total": "total", "items": "items",
            "contractNumber": "contract_number", "amount": "amount",
            "contractType": "contract_type",
            "paymentMethod": "payment_method", "signDate": "sign_date",
            "contractFile": "contract_file", "terms": "terms",
            "paymentNumber": "payment_number", "paymentDate": "payment_date",
            "paymentType": "payment_type",
            "invoiceNumber": "invoice_number", "invoiceFile": "invoice_file",
            "serviceType": "service_type", "title": "title",
            "assignedTo": "assigned_to", "assignedName": "assigned_name",
            "estimatedHours": "estimated_hours", "actualHours": "actual_hours",
            "report": "report", "rating": "rating",
            "dueDate": "due_date", "priority": "priority",
            "completedAt": "completed_at",
            "costDate": "cost_date",
            "projectFile": "project_file",
        }
        return {mapping.get(k, k): v for k, v in d.items()}

    for p in data.get("projects", []):
        pd = _snake(p)
        db.add(models.Project(
            id=pd.get("id"), name=pd.get("name", ""),
            code=pd.get("code", ""), type=pd.get("type", ""),
            status=pd.get("status", "potential"),
            description=pd.get("description", ""),
            budget=pd.get("budget", 0), actual_cost=pd.get("actual_cost", 0),
            owner_id=pd.get("owner_id", ""), owner_name=pd.get("owner_name", ""),
            department_id=pd.get("department_id", ""),
            department_name=pd.get("department_name", ""),
            start_date=pd.get("start_date", ""), end_date=pd.get("end_date", ""),
            project_file=pd.get("project_file", ""),
            created_at=pd.get("created_at") or now_str(),
            updated_at=pd.get("updated_at") or now_str(),
        ))

    for c in data.get("contacts", []):
        cd = _snake(c)
        db.add(models.Contact(
            id=cd.get("id"), name=cd.get("name", ""),
            company=cd.get("company", ""), position=cd.get("position", ""),
            department=cd.get("department", ""),
            phone=cd.get("phone", ""), mobile=cd.get("mobile", ""),
            email=cd.get("email", ""), project_id=cd.get("project_id", ""),
            role=cd.get("role", "other"), notes=cd.get("notes", ""),
            created_at=cd.get("created_at") or now_str(),
            updated_at=cd.get("updated_at") or now_str(),
        ))

    for v in data.get("visitLogs", []):
        vd = _snake(v)
        db.add(models.VisitLog(
            id=vd.get("id"), project_id=vd.get("project_id", ""),
            contact_id=vd.get("contact_id", ""),
            contact_name=vd.get("contact_name", ""),
            visit_date=vd.get("visit_date", ""),
            location=vd.get("location", ""), purpose=vd.get("purpose", ""),
            content=vd.get("content", ""), result=vd.get("result", ""),
            next_action=vd.get("next_action", ""),
            attachments=vd.get("attachments", []),
            created_by=vd.get("created_by") or user_id,
            created_at=vd.get("created_at") or now_str(),
            updated_at=vd.get("updated_at") or now_str(),
        ))

    for q in data.get("quotes", []):
        qd = _snake(q)
        db.add(models.Quote(
            id=qd.get("id"), quote_number=qd.get("quote_number", ""),
            project_id=qd.get("project_id", ""), contact_id=qd.get("contact_id", ""),
            quote_date=qd.get("quote_date", ""), valid_until=qd.get("valid_until", ""),
            status=qd.get("status", "draft"), subtotal=qd.get("subtotal", 0),
            discount=qd.get("discount", 0), tax_rate=qd.get("tax_rate", 6),
            tax_amount=qd.get("tax_amount", 0), total=qd.get("total", 0),
            items=qd.get("items", []), notes=qd.get("notes", ""),
            created_by=qd.get("created_by") or user_id,
            created_at=qd.get("created_at") or now_str(),
            updated_at=qd.get("updated_at") or now_str(),
        ))

    for ct in data.get("contracts", []):
        ctd = _snake(ct)
        db.add(models.Contract(
            id=ctd.get("id"), contract_number=ctd.get("contract_number", ""),
            project_id=ctd.get("project_id", ""), name=ctd.get("name", ""),
            contract_type=ctd.get("contract_type", "sales"),
            status=ctd.get("status", "draft"), amount=ctd.get("amount", 0),
            payment_method=ctd.get("payment_method", ""),
            sign_date=ctd.get("sign_date", ""), start_date=ctd.get("start_date", ""),
            end_date=ctd.get("end_date", ""),
            contract_file=ctd.get("contract_file", ""), terms=ctd.get("terms", ""),
            created_by=ctd.get("created_by") or user_id,
            created_at=ctd.get("created_at") or now_str(),
            updated_at=ctd.get("updated_at") or now_str(),
        ))

    for pay in data.get("payments", []):
        pd = _snake(pay)
        db.add(models.Payment(
            id=pd.get("id"), payment_number=pd.get("payment_number", ""),
            contract_id=pd.get("contract_id", ""), project_id=pd.get("project_id", ""),
            payment_type=pd.get("payment_type", "income"),
            payment_date=pd.get("payment_date", ""), amount=pd.get("amount", 0),
            payment_method=pd.get("payment_method", ""),
            status=pd.get("status", "pending"),
            invoice_number=pd.get("invoice_number", ""),
            invoice_file=pd.get("invoice_file", ""),
            notes=pd.get("notes", ""),
            created_by=pd.get("created_by") or user_id,
            created_at=pd.get("created_at") or now_str(),
            updated_at=pd.get("updated_at") or now_str(),
        ))

    for svc in data.get("services", []):
        sd = _snake(svc)
        db.add(models.Service(
            id=sd.get("id"), project_id=sd.get("project_id", ""),
            contract_id=sd.get("contract_id", ""),
            service_type=sd.get("service_type", ""),
            title=sd.get("title", ""), description=sd.get("description", ""),
            assigned_to=sd.get("assigned_to", ""),
            assigned_name=sd.get("assigned_name", ""),
            status=sd.get("status", "pending"),
            start_date=sd.get("start_date", ""), end_date=sd.get("end_date", ""),
            estimated_hours=sd.get("estimated_hours", 0),
            actual_hours=sd.get("actual_hours", 0),
            report=sd.get("report", ""), rating=sd.get("rating", 0),
            created_at=sd.get("created_at") or now_str(),
            updated_at=sd.get("updated_at") or now_str(),
        ))

    for t in data.get("tasks", []):
        td = _snake(t)
        db.add(models.Task(
            id=td.get("id"), title=td.get("title", ""),
            description=td.get("description", ""),
            project_id=td.get("project_id", ""),
            status=td.get("status", "todo"),
            priority=td.get("priority", "medium"),
            due_date=td.get("due_date", ""),
            completed_at=td.get("completed_at", ""),
            created_by=td.get("created_by") or user_id,
            created_at=td.get("created_at") or now_str(),
            updated_at=td.get("updated_at") or now_str(),
        ))

    for dc in data.get("directCosts", []):
        dd = _snake(dc)
        db.add(models.DirectCost(
            id=dd.get("id"), project_id=dd.get("project_id", ""),
            contract_id=dd.get("contract_id", ""),
            name=dd.get("name", ""), amount=dd.get("amount", 0),
            cost_date=dd.get("cost_date", ""), notes=dd.get("notes", ""),
            created_by=dd.get("created_by") or user_id,
            created_at=dd.get("created_at") or now_str(),
            updated_at=dd.get("updated_at") or now_str(),
        ))


@router.post("/reset", status_code=200)
def reset_to_seed(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    清空所有业务数据，重置为干净系统（仅保留管理员账号）。
    需要 admin 角色。
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="仅管理员可执行初始化操作")

    try:
        _clear_business_data(db)
        db.commit()
        return {"message": "数据初始化成功，系统已重置为干净状态"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"初始化失败: {str(e)}")


@router.get("/download-db")
def download_database(
    current_user: models.User = Depends(get_current_user),
):
    """
    下载完整的 SQLite 数据库文件。
    仅管理员可操作。
    下载前自动执行 WAL checkpoint，确保所有数据写入主文件。
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="仅管理员可下载数据库文件")

    db_path = os.path.join(BASE_DIR, "protrack.db")
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="数据库文件不存在")

    # WAL 模式：强制 checkpoint 把 WAL 数据合并进主文件
    import sqlite3
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    conn.close()

    return FileResponse(
        path=db_path,
        filename="protrack_backup.db",
        media_type="application/octet-stream",
        headers={"Content-Disposition": "attachment; filename=protrack_backup.db"},
    )
