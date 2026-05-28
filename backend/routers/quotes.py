"""报价路由"""
import models, schemas
from crud_router import CRUDRouterConfig, build_crud_router


def _convert_items(items_raw: list) -> list[dict]:
    """将 Pydantic QuoteItem 列表转为 dict 列表"""
    return [item.model_dump() if hasattr(item, 'model_dump') else item for item in (items_raw or [])]


router = build_crud_router(CRUDRouterConfig(
    model=models.Quote,
    create_schema=schemas.QuoteCreate,
    update_schema=schemas.QuoteUpdate,
    out_schema=schemas.QuoteOut,
    prefix="/quotes",
    tag="报价",
    search_fields=["quote_number", "notes"],
    field_map={
        "quoteNumber": "quote_number",
        "projectId": "project_id",
        "contactId": "contact_id",
        "quoteDate": "quote_date",
        "validUntil": "valid_until",
        "taxRate": "tax_rate",
        "taxAmount": "tax_amount",
        "createdBy": "created_by",
    },
    out_defaults={"status": "draft", "taxRate": 6},

    # create: 序列化 items + 注入 created_by
    create_extra=lambda db, body, user: {
        "items": _convert_items(body.get("items", [])),
        "created_by": body.get("createdBy") if body.get("createdBy") and "-" in body.get("createdBy") else user.id,
    },

    # update: 处理 items 字段序列化
    update_hook=lambda item, snake_k, v: (
        setattr(item, 'items', _convert_items(v)) if snake_k == 'items'
        else setattr(item, snake_k, v) if hasattr(item, snake_k) else None
    ),

    # _out: items JSON → QuoteItem 对象
    out_extra=lambda obj: {
        "items": [schemas.QuoteItem(**i) for i in (obj.items or []) if isinstance(i, dict)]
    },
))
