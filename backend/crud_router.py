"""
CRUDRouter 工厂 — 消除 7 个业务路由中的重复代码。

用法:
    router = CRUDRouter(
        model=models.Project,
        create_schema=schemas.ProjectCreate,
        update_schema=schemas.ProjectUpdate,
        out_schema=schemas.ProjectOut,
        prefix="/projects",
        tag="项目",
        search_fields=["name", "code"],
        field_map={"ownerId": "owner_id", "startDate": "start_date"},
        out_defaults={"status": "potential", "budget": 0},
        create_extra=lambda db, body, user: {"owner_id": body.get("ownerId") or user.id},
    ).build()
"""

from dataclasses import dataclass, field
from typing import Any, Callable, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models as _models
import schemas as _schemas
from auth import get_current_user
from utils import new_id, now_str, snake_to_camel
from pagination import paginate


@dataclass
class CRUDRouterConfig:
    model: Any  # SQLAlchemy model class
    create_schema: Any  # Pydantic create schema
    update_schema: Any  # Pydantic update schema
    out_schema: Any  # Pydantic out schema

    prefix: str
    tag: str
    search_fields: list[str] = field(default_factory=list)

    # 排序字段，默认 updated_at.desc()
    sort_field: Any = None

    # update 时的 camelCase → snake_case 字段映射
    field_map: dict[str, str] = field(default_factory=dict)

    # _out 序列化时的字段默认值（如 status 默认值）
    out_defaults: dict[str, Any] = field(default_factory=dict)

    # create 阶段注入的额外字段，返回 dict，可访问 db / body_dict / current_user
    create_extra: Optional[Callable[[Session, dict, _models.User], dict]] = None

    # _out 阶段注入的额外字段，返回 dict
    out_extra: Optional[Callable[[Any], dict]] = None

    # update 阶段对特定字段的自定义处理 (item_instance, snake_key, value) -> None
    update_hook: Optional[Callable[[Any, str, Any], None]] = None


def make_out(config: CRUDRouterConfig) -> Callable[[Any], dict]:
    """生成 _out 序列化函数"""
    def _out(obj: Any) -> dict:
        data = {}
        for col in obj.__table__.columns:
            val = getattr(obj, col.name)
            # None → "" 兜底，避免 Pydantic schema 校验 string type 失败
            data[col.name] = val if val is not None else ""

        # 应用默认值
        for k, v in config.out_defaults.items():
            if not data.get(k):
                data[k] = v

        # 驼峰转换
        result = snake_to_camel(data)

        # 自定义额外字段
        if config.out_extra:
            extra = config.out_extra(obj)
            result.update(extra)

        return config.out_schema(**result)
    return _out


def _resolve_sort(config: CRUDRouterConfig):
    """解析排序字段"""
    sort = config.sort_field
    if sort is None:
        sort = config.model.updated_at.desc()
    if not isinstance(sort, list):
        sort = [sort]
    return sort


def build_crud_router(config: CRUDRouterConfig) -> APIRouter:
    """根据配置构建带完整 CRUD 端点的 APIRouter"""
    router = APIRouter(prefix=config.prefix, tags=[config.tag])
    _out = make_out(config)

    model = config.model
    CreateSchema = config.create_schema
    UpdateSchema = config.update_schema

    # ─── LIST ──────────────────────────────────────────────────────────────
    @router.get("")
    def list_items(
        page: int = Query(1, ge=1),
        limit: int = Query(50, ge=1, le=200),
        search: str = Query(""),
        projectId: str = Query(""),
        db: Session = Depends(get_db),
        _=Depends(get_current_user),
    ):
        sort_cols = _resolve_sort(config)
        query = db.query(model).order_by(*sort_cols)

        # 通用：按项目 ID 过滤（适用含 project_id 列的模型）
        if projectId and hasattr(model, 'project_id'):
            query = query.filter(model.project_id == projectId)

        result = paginate(query, page=page, limit=limit, search=search, search_fields=config.search_fields)
        result["items"] = [_out(item) for item in result["items"]]
        return result

    # ─── CREATE ────────────────────────────────────────────────────────────
    @router.post("", status_code=201)
    def create_item(
        body: CreateSchema,
        db: Session = Depends(get_db),
        current_user: _models.User = Depends(get_current_user),
    ):
        data = body.model_dump()
        data["id"] = new_id()
        data["created_at"] = now_str()
        data["updated_at"] = now_str()

        # 回调：注入额外字段（如 created_by, owner_id）
        if config.create_extra:
            data.update(config.create_extra(db, data, current_user))

        # 将 camelCase 字段映射为 snake_case（兼容前后端命名差异）
        # 空字符串值跳过，避免写入无效外键引用
        for camel_k, snake_k in config.field_map.items():
            if camel_k in data:
                val = data.pop(camel_k)
                if val not in (None, ""):
                    data[snake_k] = val

        # 过滤：只保留 model 实际拥有的列，防止未映射的驼峰字段（如 createdBy）传入 model(**data) 导致 TypeError
        model_cols = {c.key for c in model.__table__.columns}
        data = {k: v for k, v in data.items() if k in model_cols}

        item = model(**data)
        db.add(item)
        db.commit()
        db.refresh(item)
        return _out(item)

    # ─── GET BY ID ─────────────────────────────────────────────────────────
    @router.get("/{item_id}")
    def get_item(item_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
        item = db.query(model).filter(model.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="记录不存在")
        return _out(item)

    # ─── UPDATE ────────────────────────────────────────────────────────────
    @router.patch("/{item_id}")
    def update_item(
        item_id: str,
        body: UpdateSchema,
        db: Session = Depends(get_db),
        _=Depends(get_current_user),
    ):
        item = db.query(model).filter(model.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="记录不存在")

        update_data = body.model_dump(exclude_none=True)
        for k, v in update_data.items():
            snake_k = config.field_map.get(k, k)
            if config.update_hook:
                config.update_hook(item, snake_k, v)
            elif hasattr(item, snake_k):
                setattr(item, snake_k, v)

        item.updated_at = now_str()
        db.commit()
        db.refresh(item)
        return _out(item)

    # ─── DELETE ────────────────────────────────────────────────────────────
    @router.delete("/{item_id}", status_code=204)
    def delete_item(item_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
        item = db.query(model).filter(model.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="记录不存在")
        db.delete(item)
        db.commit()

    return router
