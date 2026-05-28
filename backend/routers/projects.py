"""项目路由"""
import os, uuid
from fastapi import UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from database import get_db, BASE_DIR
import models, schemas
from crud_router import CRUDRouterConfig, build_crud_router

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "projects")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_MIMETYPES = {"application/pdf", "image/jpeg", "image/png"}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

router = build_crud_router(CRUDRouterConfig(
    model=models.Project,
    create_schema=schemas.ProjectCreate,
    update_schema=schemas.ProjectUpdate,
    out_schema=schemas.ProjectOut,
    prefix="/projects",
    tag="项目",
    search_fields=["name", "code"],
    field_map={
        "actualCost": "actual_cost",
        "ownerId": "owner_id",
        "ownerName": "owner_name",
        "departmentId": "department_id",
        "departmentName": "department_name",
        "startDate": "start_date",
        "endDate": "end_date",
        "projectFile": "project_file",
    },
    out_defaults={"status": "potential", "budget": 0, "actualCost": 0},
    create_extra=lambda db, body, user: (lambda oid=body.pop("ownerId", ""), oname=body.pop("ownerName", ""): {
        "owner_id": oid if oid and "-" in oid else user.id,
        "owner_name": oname or user.full_name,
    })(),
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
def upload_project_file(entity_id: str, file: UploadFile = File(...)):
    db = next(get_db())
    project = db.query(models.Project).filter(models.Project.id == entity_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    err = _validate_file(file)
    if err:
        raise HTTPException(status_code=400, detail=err)

    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件大小超过 20MB 限制")

    project_dir = os.path.join(UPLOAD_DIR, entity_id)
    os.makedirs(project_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1].lower()
    safe_name = uuid.uuid4().hex + ext
    file_path = os.path.join(project_dir, safe_name)

    with open(file_path, "wb") as f:
        f.write(content)

    project.project_file = file.filename
    from datetime import datetime
    project.updated_at = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    db.commit()

    return {"filename": file.filename, "ok": True}


@router.get("/{entity_id}/file")
def download_project_file(entity_id: str):
    db = next(get_db())
    project = db.query(models.Project).filter(models.Project.id == entity_id).first()
    if not project or not project.project_file:
        raise HTTPException(status_code=404, detail="项目文件不存在")

    project_dir = os.path.join(UPLOAD_DIR, entity_id)
    if not os.path.isdir(project_dir):
        raise HTTPException(status_code=404, detail="项目文件不存在")

    files = os.listdir(project_dir)
    if not files:
        raise HTTPException(status_code=404, detail="项目文件不存在")

    file_path = os.path.join(project_dir, files[0])
    ext = os.path.splitext(project.project_file)[1].lower()
    media_type = "application/pdf" if ext == ".pdf" else f"image/{ext[1:]}"
    if ext == ".jpg":
        media_type = "image/jpeg"

    return FileResponse(
        file_path,
        media_type=media_type,
        filename=project.project_file,
        content_disposition_type="inline" if ext in {".pdf", ".jpg", ".jpeg", ".png"} else "attachment",
    )
