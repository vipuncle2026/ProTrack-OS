"""合同路由"""
import os
import shutil
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

import models, schemas
from auth import get_current_user
from crud_router import CRUDRouterConfig, build_crud_router
from database import BASE_DIR, get_db
from utils import now_str

# ─── 上传配置 ──────────────────────────────────────────────────────────────────
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "contracts")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_MIMETYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

router = build_crud_router(CRUDRouterConfig(
    model=models.Contract,
    create_schema=schemas.ContractCreate,
    update_schema=schemas.ContractUpdate,
    out_schema=schemas.ContractOut,
    prefix="/contracts",
    tag="合同",
    search_fields=["name", "contract_number"],
    field_map={
        "contractNumber": "contract_number",
        "projectId": "project_id",
        "contractType": "contract_type",
        "paymentMethod": "payment_method",
        "signDate": "sign_date",
        "startDate": "start_date",
        "endDate": "end_date",
        "contractFile": "contract_file",
        "createdBy": "created_by",
    },
    out_defaults={"status": "draft", "contract_type": "sales"},
    create_extra=lambda db, body, user: {"created_by": body.get("createdBy") or user.id},
))


# ─── 文件上传 ──────────────────────────────────────────────────────────────────

def _validate_file(file: UploadFile) -> str:
    """校验文件，返回安全文件名"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名为空")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"不支持的文件格式：{ext}，仅支持 PDF / JPG / PNG")

    # 检查 MIME 类型（浏览器上报的，不能完全信任但可做初步过滤）
    if file.content_type and file.content_type not in ALLOWED_MIMETYPES:
        raise HTTPException(status_code=400, detail=f"不支持的文件类型：{file.content_type}")

    return file.filename


@router.post("/{contract_id}/upload")
async def upload_contract_file(
    contract_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """上传合同文件（PDF/JPG/PNG，最大 20MB）"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    _validate_file(file)

    # 读取文件内容并校验大小
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件大小超过 20MB 限制")

    # 创建合同专属目录
    contract_dir = os.path.join(UPLOAD_DIR, contract_id)
    os.makedirs(contract_dir, exist_ok=True)

    # 生成唯一文件名，保留原始扩展名
    ext = os.path.splitext(file.filename)[1].lower()
    safe_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(contract_dir, safe_name)

    with open(file_path, "wb") as f:
        f.write(content)

    # 更新合同记录（保存原始文件名用于展示）
    contract.contract_file = file.filename
    contract.updated_at = now_str()
    db.commit()
    db.refresh(contract)

    return {"message": "文件上传成功", "filename": file.filename, "contractId": contract_id}


# ─── 文件下载 / 预览 ──────────────────────────────────────────────────────────

CONTENT_TYPE_MAP = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}


@router.get("/{contract_id}/file")
def download_contract_file(
    contract_id: str,
    db: Session = Depends(get_db),
):
    """下载/预览合同文件"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")
    if not contract.contract_file:
        raise HTTPException(status_code=404, detail="该合同没有上传文件")

    contract_dir = os.path.join(UPLOAD_DIR, contract_id)
    if not os.path.exists(contract_dir):
        raise HTTPException(status_code=404, detail="合同文件目录不存在")

    # 找到目录中的文件（目录下只有一个文件）
    files = [f for f in os.listdir(contract_dir) if os.path.isfile(os.path.join(contract_dir, f))]
    if not files:
        raise HTTPException(status_code=404, detail="合同文件不存在")

    file_path = os.path.join(contract_dir, files[0])
    ext = os.path.splitext(files[0])[1].lower()
    media_type = CONTENT_TYPE_MAP.get(ext, "application/octet-stream")

    # PDF 用 inline 让浏览器预览，图片也 inline，其他 attachment
    disposition = "inline" if ext in (".pdf", ".jpg", ".jpeg", ".png") else "attachment"

    return FileResponse(
        path=file_path,
        filename=contract.contract_file or files[0],
        media_type=media_type,
        headers={"Content-Disposition": f'{disposition}; filename="{contract.contract_file or files[0]}"'},
    )
