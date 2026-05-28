"""
操作审计中间件 — 自动记录所有 API 写操作
"""
import json
import re
from datetime import datetime, timezone
from fastapi import Request
from sqlalchemy.orm import Session
from database import SessionLocal
from utils import new_id
import models


# 路径 → 操作描述映射
PATH_ACTION_MAP = [
    (r"/api/projects(?:/[^/]+)?$", {"POST": "创建项目", "PATCH": "更新项目", "DELETE": "删除项目"}),
    (r"/api/contacts(?:/[^/]+)?$", {"POST": "创建联系人", "PATCH": "更新联系人", "DELETE": "删除联系人"}),
    (r"/api/visit-logs(?:/[^/]+)?$", {"POST": "创建拜访日志", "PATCH": "更新拜访日志", "DELETE": "删除拜访日志"}),
    (r"/api/quotes(?:/[^/]+)?$", {"POST": "创建报价", "PATCH": "更新报价", "DELETE": "删除报价"}),
    (r"/api/contracts(?:/[^/]+)?$", {"POST": "创建合同", "PATCH": "更新合同", "DELETE": "删除合同"}),
    (r"/api/payments(?:/[^/]+)?$", {"POST": "创建款项", "PATCH": "更新款项", "DELETE": "删除款项"}),
    (r"/api/services(?:/[^/]+)?$", {"POST": "创建服务", "PATCH": "更新服务", "DELETE": "删除服务"}),
    (r"/api/tasks(?:/[^/]+)?$", {"POST": "创建任务", "PATCH": "更新任务", "DELETE": "删除任务"}),
    (r"/api/direct-costs(?:/[^/]+)?$", {"POST": "创建直接成本", "PATCH": "更新直接成本", "DELETE": "删除直接成本"}),
    (r"/api/backup/restore", {"POST": "恢复备份数据"}),
    (r"/api/backup/reset", {"POST": "初始化系统数据"}),
    (r"/api/auth/login", {"POST": "用户登录"}),
    (r"/api/auth/change-password", {"POST": "修改密码"}),
    (r"/api/auth/set-security-code", {"POST": "设置安全码"}),
]


def get_action_from_path(method: str, path: str) -> str:
    """根据请求方法和路径生成操作描述"""
    for pattern, actions in PATH_ACTION_MAP:
        if re.search(pattern, path):
            if isinstance(actions, dict):
                return actions.get(method, "") or f"{method} {path}"
            return actions
    return ""


async def audit_middleware(request: Request, call_next):
    """自动记录 POST/PATCH/PUT/DELETE 操作"""
    method = request.method
    path = request.url.path

    # 只记录写操作（跳过 GET / search / health / stats 等读操作）
    if method in ("GET", "HEAD", "OPTIONS"):
        return await call_next(request)

    # 读取请求体
    body_bytes = None
    try:
        body_bytes = await request.body()
    except Exception:
        pass

    # 先执行请求
    response = await call_next(request)

    # 如果是写操作且成功（2xx），记录日志
    if 200 <= response.status_code < 300:
        action = get_action_from_path(method, path)
        client_ip = request.client.host if request.client else ""

        # 从 token 中尝试提取用户信息
        username = ""
        full_name = ""
        user_id = ""

        try:
            auth_header = request.headers.get("authorization", "")
            if auth_header.startswith("Bearer "):
                from auth import SECRET_KEY, ALGORITHM
                from jose import jwt
                token = auth_header[7:]
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                user_id = payload.get("sub", "")
                # 从数据库查一下用户名
                db: Session = SessionLocal()
                try:
                    user = db.query(models.User).filter(models.User.id == user_id).first()
                    if user:
                        username = user.username or ""
                        full_name = user.full_name or ""
                finally:
                    db.close()
        except Exception:
            pass

        # 写入审计日志
        detail_parts = []
        if action:
            detail_parts.append(action)
        if body_bytes:
            try:
                body_text = body_bytes.decode("utf-8")[:500]
                # 脱敏密码
                body_text = re.sub(r'"password"\s*:\s*"[^"]*"', '"password":"***"', body_text)
                body_text = re.sub(r'"oldPassword"\s*:\s*"[^"]*"', '"oldPassword":"***"', body_text)
                body_text = re.sub(r'"newPassword"\s*:\s*"[^"]*"', '"newPassword":"***"', body_text)
                detail_parts.append(body_text)
            except Exception:
                pass

        db: Session = SessionLocal()
        try:
            log = models.AuditLog(
                id=new_id(),
                user_id=user_id,
                username=username,
                full_name=full_name,
                method=method,
                path=path,
                action=action,
                detail=" | ".join(detail_parts) if detail_parts else "",
                ip=client_ip,
                created_at=datetime.now(timezone.utc).isoformat(),
            )
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    return response
