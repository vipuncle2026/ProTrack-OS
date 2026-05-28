"""任务路由"""
import models, schemas
from crud_router import CRUDRouterConfig, build_crud_router

router = build_crud_router(CRUDRouterConfig(
    model=models.Task,
    create_schema=schemas.TaskCreate,
    update_schema=schemas.TaskUpdate,
    out_schema=schemas.TaskOut,
    prefix="/tasks",
    tag="任务",
    search_fields=["title"],
    field_map={
        "projectId": "project_id",
        "assignedTo": "assigned_to",
        "assignedName": "assigned_name",
        "dueDate": "due_date",
        "completedAt": "completed_at",
        "createdBy": "created_by",
    },
    out_defaults={"status": "todo", "priority": "medium", "completedAt": "", "dueDate": "", "description": ""},
    create_extra=lambda db, body, user: {
        "created_by": body.get("createdBy") or user.id,
        "assigned_name": body.get("assignedName") or user.full_name,
    },
))
