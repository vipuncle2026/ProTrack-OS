"""回款路由"""
import os, uuid
from fastapi import UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from database import get_db, BASE_DIR
import models, schemas
from crud_router import CRUDRouterConfig, build_crud_router

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "payments")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_MIMETYPES = {"application/pdf", "image/jpeg", "image/png"}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

router = build_crud_router(CRUDRouterConfig(
    model=models.Payment,
    create_schema=schemas.PaymentCreate,
    update_schema=schemas.PaymentUpdate,
    out_schema=schemas.PaymentOut,
    prefix="/payments",
    tag="款项",
    search_fields=["payment_number", "notes"],
    sort_field=models.Payment.payment_date.desc(),
    field_map={
        "paymentNumber": "payment_number",
        "contractId": "contract_id",
        "projectId": "project_id",
        "paymentType": "payment_type",
        "paymentDate": "payment_date",
        "paymentMethod": "payment_method",
        "invoiceNumber": "invoice_number",
        "invoiceFile": "invoice_file",
        "createdBy": "created_by",
    },
    out_defaults={"status": "pending", "payment_type": "income"},
    create_extra=lambda db, body, user: {"created_by": body.get("createdBy") or user.id},
))


def _validate_file(file: UploadFile) -> str:
    """校验文件，返回不通过原因，通过返回空字符串"""
    if not file.filename:
        return "文件名为空"
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return f"不支持的文件格式（{ext}），仅支持 PDF / JPG / PNG"
    if file.content_type and file.content_type not in ALLOWED_MIMETYPES:
        return f"不支持的文件类型（{file.content_type}），仅支持 PDF / JPG / PNG"
    return ""


@router.post("/{entity_id}/upload")
def upload_invoice(entity_id: str, file: UploadFile = File(...)):
    db = next(get_db())
    payment = db.query(models.Payment).filter(models.Payment.id == entity_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="款项记录不存在")

    err = _validate_file(file)
    if err:
        raise HTTPException(status_code=400, detail=err)

    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件大小超过 20MB 限制")

    payment_dir = os.path.join(UPLOAD_DIR, entity_id)
    os.makedirs(payment_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1].lower()
    safe_name = uuid.uuid4().hex + ext
    file_path = os.path.join(payment_dir, safe_name)

    with open(file_path, "wb") as f:
        f.write(content)

    payment.invoice_file = file.filename
    from datetime import datetime
    payment.updated_at = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    db.commit()

    return {"filename": file.filename, "ok": True}


@router.get("/{entity_id}/invoice-file")
def download_invoice(entity_id: str):
    db = next(get_db())
    payment = db.query(models.Payment).filter(models.Payment.id == entity_id).first()
    if not payment or not payment.invoice_file:
        raise HTTPException(status_code=404, detail="发票文件不存在")

    payment_dir = os.path.join(UPLOAD_DIR, entity_id)
    if not os.path.isdir(payment_dir):
        raise HTTPException(status_code=404, detail="发票文件不存在")

    files = os.listdir(payment_dir)
    if not files:
        raise HTTPException(status_code=404, detail="发票文件不存在")

    file_path = os.path.join(payment_dir, files[0])
    ext = os.path.splitext(payment.invoice_file)[1].lower()
    media_type = "application/pdf" if ext == ".pdf" else f"image/{ext[1:]}"
    if ext == ".jpg":
        media_type = "image/jpeg"

    return FileResponse(
        file_path,
        media_type=media_type,
        filename=payment.invoice_file,
        content_disposition_type="inline" if ext in {".pdf", ".jpg", ".jpeg", ".png"} else "attachment",
    )
