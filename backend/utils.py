"""
通用 CRUD 工具函数，减少重复代码
"""
from typing import TypeVar, Type, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid

T = TypeVar("T")


def now_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def new_id() -> str:
    return str(uuid.uuid4())


def camel_to_snake(name: str) -> str:
    """简单驼峰转下划线"""
    import re
    s1 = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


def model_to_dict(obj: Any) -> dict:
    """SQLAlchemy model → dict（保留原始列名）"""
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


def snake_to_camel(d: dict) -> dict:
    """下划线字段名 → 驼峰，用于返回给前端"""
    import re
    def _convert(s: str) -> str:
        parts = s.split("_")
        return parts[0] + "".join(p.title() for p in parts[1:])
    return {_convert(k): v for k, v in d.items()}
