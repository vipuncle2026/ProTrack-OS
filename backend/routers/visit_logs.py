"""拜访记录路由"""
import models, schemas
from crud_router import CRUDRouterConfig, build_crud_router

router = build_crud_router(CRUDRouterConfig(
    model=models.VisitLog,
    create_schema=schemas.VisitLogCreate,
    update_schema=schemas.VisitLogUpdate,
    out_schema=schemas.VisitLogOut,
    prefix="/visit-logs",
    tag="拜访记录",
    search_fields=["purpose", "content", "result"],
    sort_field=models.VisitLog.visit_date.desc(),
    field_map={
        "projectId": "project_id",
        "contactId": "contact_id",
        "contactName": "contact_name",
        "visitDate": "visit_date",
        "nextAction": "next_action",
        "createdBy": "created_by",
    },
    out_defaults={"attachments": []},
    create_extra=lambda db, body, user: {"created_by": body.get("createdBy") if body.get("createdBy") and "-" in body.get("createdBy") else user.id},
))
