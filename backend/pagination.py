"""统一分页 + 搜索工具"""

from typing import Optional, List
from sqlalchemy.orm import Query
from sqlalchemy import or_
from math import ceil


def paginate(
    query: Query,
    *,
    page: int = 1,
    limit: int = 50,
    search: str = "",
    search_fields: Optional[List[str]] = None,
) -> dict:
    """
    对 SQLAlchemy Query 应用搜索 + 分页，返回分页结果字典。

    :param query: 基础 Query 对象
    :param page: 页码，从 1 开始
    :param limit: 每页条数
    :param search: 搜索关键词
    :param search_fields: 可搜索的 model 属性名列表，如 ["name", "code"]
    :return: {"items": [...], "total": N, "page": N, "limit": N, "totalPages": N}
    """
    if search and search_fields:
        model = query.column_descriptions[0]["type"]
        conditions = []
        for field_name in search_fields:
            column = getattr(model, field_name, None)
            if column is not None:
                conditions.append(column.ilike(f"%{search}%"))
        if conditions:
            query = query.filter(or_(*conditions))

    total = query.count()
    total_pages = max(1, ceil(total / limit)) if total > 0 else 1
    # 防止页码超出范围
    safe_page = min(page, total_pages) if total > 0 else 1
    offset = (safe_page - 1) * limit

    items = query.offset(offset).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": safe_page,
        "limit": limit,
        "totalPages": total_pages,
    }
