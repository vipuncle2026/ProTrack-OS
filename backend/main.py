import os
from pathlib import Path

# ─── 加载 .env（位于本文件同目录）─────────────────────────────────────────────
_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=_env_file)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from alembic.config import Config as AlembicConfig
from alembic import command as alembic_command
import models  # noqa: 确保 models 在 alembic 运行前已被 import
from routers import auth, projects, contacts, visit_logs, quotes, contracts, payments, services, backup, stats, tasks, notifications, direct_costs, profits, search, audit, attachments
from seed import seed_data
from middleware import audit_middleware

# ─── 数据库迁移（启动时确保 schema 最新）──────────────────────────────────────
def run_migrations():
    alembic_cfg = AlembicConfig(str(Path(__file__).parent / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(Path(__file__).parent / "alembic"))
    alembic_command.upgrade(alembic_cfg, "head")

run_migrations()

# ─── 种子数据（首次启动，受 SEED_DATA 环境变量控制）────────────────────────────
seed_data()

# ─── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="ProTrack API", version="1.0.0")

# CORS：从环境变量读取允许的来源列表
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "*").strip()
if _raw_origins == "*":
    _allowed_origins = ["*"]
else:
    _allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(contacts.router, prefix="/api")
app.include_router(visit_logs.router, prefix="/api")
app.include_router(quotes.router, prefix="/api")
app.include_router(contracts.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(services.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(backup.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(direct_costs.router, prefix="/api")
app.include_router(profits.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(attachments.router, prefix="/api")

# 审计中间件（记录所有写操作）
app.middleware("http")(audit_middleware)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ProTrack API"}
