"""联系人路由"""
import models, schemas
from crud_router import CRUDRouterConfig, build_crud_router

router = build_crud_router(CRUDRouterConfig(
    model=models.Contact,
    create_schema=schemas.ContactCreate,
    update_schema=schemas.ContactUpdate,
    out_schema=schemas.ContactOut,
    prefix="/contacts",
    tag="联系人",
    search_fields=["name", "company"],
    field_map={"projectId": "project_id", "isPrimary": "is_primary"},
    out_defaults={"role": "other", "isPrimary": False},
))
