"""直接成本路由"""
import models, schemas
from crud_router import CRUDRouterConfig, build_crud_router

router = build_crud_router(CRUDRouterConfig(
    model=models.DirectCost,
    create_schema=schemas.DirectCostCreate,
    update_schema=schemas.DirectCostUpdate,
    out_schema=schemas.DirectCostOut,
    prefix="/direct-costs",
    tag="直接成本",
    search_fields=["name", "notes"],
    field_map={
        "projectId": "project_id",
        "contractId": "contract_id",
        "costDate": "cost_date",
        "createdBy": "created_by",
    },
    out_defaults={},
    create_extra=lambda db, body, user: {"created_by": body.get("createdBy") or user.id},
))
