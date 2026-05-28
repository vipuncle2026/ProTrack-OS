"""服务路由"""
import models, schemas
from crud_router import CRUDRouterConfig, build_crud_router

router = build_crud_router(CRUDRouterConfig(
    model=models.Service,
    create_schema=schemas.ServiceCreate,
    update_schema=schemas.ServiceUpdate,
    out_schema=schemas.ServiceOut,
    prefix="/services",
    tag="服务",
    search_fields=["title", "description"],
    field_map={
        "projectId": "project_id",
        "contractId": "contract_id",
        "serviceType": "service_type",
        "assignedTo": "assigned_to",
        "assignedName": "assigned_name",
        "startDate": "start_date",
        "endDate": "end_date",
        "estimatedHours": "estimated_hours",
        "actualHours": "actual_hours",
    },
    out_defaults={"status": "pending", "serviceType": "implementation"},
    out_extra=lambda obj: {"createdBy": ""},  # services 模型无 created_by 列，API 给空串
))
