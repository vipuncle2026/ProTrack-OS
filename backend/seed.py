"""
seed.py - 种子数据管理

环境变量:
  SEED_DATA = admin_only | full | false
    - admin_only (默认): 仅创建管理员账号，干净的空白系统
    - full: 管理员 + 全套演示数据（项目/合同/报价等）
    - false: 跳过，什么都不做

命令行:
  python3 seed.py           正常初始化（无用户时才写入）
  python3 seed.py --reset   强制重置：清空所有数据 → 重新初始化
"""

import os
import sys
from pathlib import Path

_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=_env_file)

from database import SessionLocal
from auth import hash_password
from utils import new_id, now_str
import models


# 按外键依赖顺序排列，reset 时从叶子节点开始删
_TABLE_DELETE_ORDER = [
    "tasks",
    "visit_logs",
    "payments",
    "services",
    "quotes",
    "contracts",
    "contacts",
    "projects",
    "users",
]


def _get_admin_config():
    """读取管理员配置"""
    return (
        os.environ.get("ADMIN_USERNAME", "admin"),
        os.environ.get("ADMIN_PASSWORD", "admin123"),
    )


def create_admin(db):
    """仅创建管理员账号，不写入任何演示数据"""
    username, password = _get_admin_config()
    if db.query(models.User).filter(models.User.username == username).count() > 0:
        print(f"ℹ️  管理员账号 {username} 已存在，跳过")
        return None

    admin = models.User(
        id=new_id(),
        username=username,
        email="admin@protrack.com",
        full_name="管理员",
        hashed_password=hash_password(password),
        role="admin",
        department_id="1",
        department_name="项目管理部",
        avatar="",
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"✅ 管理员账号已创建: {username} / {password}")
    return admin


def seed_demo_data(db, admin):
    """写入全套演示数据（项目/联系人/合同/报价/付款/服务/拜访/任务）"""
    now = now_str()

    # --- 项目 ---
    projects_data = [
        models.Project(
            id="p1", name="智慧城市管理系统", code="PRJ-2024-001",
            type="software", status="in_progress",
            description="为某市政府开发智慧城市综合管理平台",
            budget=5000000, actual_cost=3200000,
            owner_id=admin.id, owner_name="管理员",
            department_id="1", department_name="项目管理部",
            start_date="2024-01-15", end_date="2024-12-31",
            created_at="2024-01-15", updated_at="2024-05-10",
        ),
        models.Project(
            id="p2", name="企业ERP系统实施", code="PRJ-2024-002",
            type="integration", status="contracted",
            description="为某制造企业实施SAP ERP系统",
            budget=8000000, actual_cost=0,
            owner_id=admin.id, owner_name="管理员",
            department_id="1", department_name="项目管理部",
            start_date="2024-03-01", end_date="2025-02-28",
            created_at="2024-02-20", updated_at="2024-03-01",
        ),
        models.Project(
            id="p3", name="移动应用开发咨询", code="PRJ-2024-003",
            type="consulting", status="quoting",
            description="为某电商公司提供移动应用开发咨询服务",
            budget=1500000, actual_cost=0,
            owner_id=admin.id, owner_name="管理员",
            department_id="1", department_name="项目管理部",
            start_date="2024-06-01", end_date="2024-11-30",
            created_at="2024-05-15", updated_at="2024-05-15",
        ),
    ]
    for p in projects_data:
        db.add(p)
    db.flush()  # 先让项目入库，后续联系人/合同等外键依赖它

    # --- 联系人 ---
    for c in [
        models.Contact(
            id="c1", name="陈主任", company="某市政府",
            position="信息中心主任", department="信息中心",
            phone="010-12345678", mobile="13800138000",
            email="chen@example.gov.cn", project_id="p1",
            role="decision_maker", notes="项目主要决策人，需要定期汇报进度",
            created_at="2024-01-15", updated_at="2024-05-10",
        ),
        models.Contact(
            id="c2", name="张工", company="某市政府",
            position="高级工程师", department="信息中心",
            phone="010-12345679", mobile="13800138001",
            email="zhang@example.gov.cn", project_id="p1",
            role="technical", notes="技术对接人，负责技术方案沟通",
            created_at="2024-01-15", updated_at="2024-05-10",
        ),
        models.Contact(
            id="c3", name="刘总", company="某制造企业",
            position="CEO", department="管理层",
            phone="021-98765432", mobile="13900139000",
            email="liu@example.com", project_id="p2",
            role="decision_maker", notes="项目发起人，关注项目ROI",
            created_at="2024-02-20", updated_at="2024-03-01",
        ),
    ]:
        db.add(c)

    # --- 合同 ---
    db.add(models.Contract(
        id="ct1", contract_number="CT-2024-001", project_id="p1",
        name="智慧城市管理系统采购合同", status="executing",
        amount=5300000, payment_method="分阶段付款",
        sign_date="2024-01-15", start_date="2024-01-15", end_date="2024-12-31",
        contract_file="", terms="分三个阶段验收，每个阶段验收后支付30%，10%作为质保金",
        created_by=admin.id, created_at="2024-01-15", updated_at="2024-05-10",
    ))

    # --- 付款 ---
    for pay in [
        models.Payment(
            id="pay1", payment_number="PAY-2024-001", contract_id="ct1",
            project_id="p1", payment_date="2024-02-01", amount=1590000,
            payment_method="银行转账", status="paid",
            invoice_number="INV-2024-001", invoice_file="",
            notes="第一阶段预付款", created_by=admin.id,
            created_at="2024-02-01", updated_at="2024-02-01",
        ),
        models.Payment(
            id="pay2", payment_number="PAY-2024-002", contract_id="ct1",
            project_id="p1", payment_date="2024-05-15", amount=1590000,
            payment_method="银行转账", status="paid",
            invoice_number="INV-2024-002", invoice_file="",
            notes="第二阶段验收款", created_by=admin.id,
            created_at="2024-05-15", updated_at="2024-05-15",
        ),
    ]:
        db.add(pay)

    # --- 服务 ---
    db.add(models.Service(
        id="svc1", project_id="p1", contract_id="ct1",
        service_type="implementation", title="系统部署与配置",
        description="完成系统环境部署、功能配置和初始化工作",
        assigned_to=admin.id, assigned_name="管理员",
        status="in_progress", start_date="2024-03-01", end_date="2024-05-31",
        estimated_hours=800, actual_hours=520,
        report="已完成基础环境搭建，正在进行功能配置", rating=0,
        created_at="2024-03-01", updated_at="2024-05-10",
    ))

    # --- 报价 ---
    db.add(models.Quote(
        id="q1", quote_number="QT-2024-001", project_id="p1",
        contact_id="c1", quote_date="2024-01-10", valid_until="2024-04-10",
        status="accepted", subtotal=5000000, discount=0,
        tax_rate=6, tax_amount=300000, total=5300000,
        items=[
            {"id": "qi1", "description": "智慧城市管理平台软件授权", "quantity": 1, "unitPrice": 3000000, "amount": 3000000},
            {"id": "qi2", "description": "系统实施服务", "quantity": 1, "unitPrice": 1500000, "amount": 1500000},
            {"id": "qi3", "description": "培训服务", "quantity": 10, "unitPrice": 50000, "amount": 500000},
        ],
        notes="含一年免费维保", created_by=admin.id,
        created_at="2024-01-10", updated_at="2024-01-15",
    ))

    # --- 拜访记录 ---
    db.add(models.VisitLog(
        id="v1", project_id="p1", contact_id="c1", contact_name="陈主任",
        visit_date="2024-05-10", location="某市政府会议室",
        purpose="项目进度汇报",
        content="向陈主任汇报了系统开发进度，演示了Demo版本，获得认可",
        result="客户对进度满意，同意进入下一阶段",
        next_action="准备下一阶段详细设计文档",
        attachments=[], created_by=admin.id,
        created_at="2024-05-10", updated_at="2024-05-10",
    ))

    # --- 任务 ---
    tasks_data = [
        models.Task(
            id="t1", title="需求分析文档编写", project_id="p1", assigned_to=admin.id,
            status="done", priority="high", created_by=admin.id,
            due_date="2024-02-01", completed_at="2024-01-28",
            created_at="2024-01-15", updated_at="2024-01-28",
        ),
        models.Task(
            id="t2", title="系统架构设计", project_id="p1", assigned_to=admin.id,
            status="done", priority="high", created_by=admin.id,
            due_date="2024-03-01", completed_at="2024-02-25",
            created_at="2024-02-01", updated_at="2024-02-25",
        ),
        models.Task(
            id="t3", title="前端页面开发", project_id="p1", assigned_to=admin.id,
            status="in_progress", priority="medium", created_by=admin.id,
            due_date="2024-06-01",
            created_at="2024-03-01", updated_at="2024-05-10",
        ),
        models.Task(
            id="t4", title="数据库设计与优化", project_id="p1", assigned_to=admin.id,
            status="done", priority="medium", created_by=admin.id,
            due_date="2024-03-15", completed_at="2024-03-12",
            created_at="2024-02-15", updated_at="2024-03-12",
        ),
        models.Task(
            id="t5", title="接口联调测试", project_id="p1", assigned_to=admin.id,
            status="todo", priority="medium", created_by=admin.id,
            due_date="2024-07-01",
            created_at="2024-05-01", updated_at="2024-05-01",
        ),
        models.Task(
            id="t6", title="ERP模块需求调研", project_id="p2", assigned_to=admin.id,
            status="blocked", priority="high", created_by=admin.id,
            description="等待客户提供详细业务流程文档",
            due_date="2024-04-01",
            created_at="2024-03-01", updated_at="2024-03-20",
        ),
        models.Task(
            id="t7", title="系统部署方案编写", project_id="p2", assigned_to=admin.id,
            status="todo", priority="low", created_by=admin.id,
            due_date="2024-08-01",
            created_at="2024-04-01", updated_at="2024-04-01",
        ),
        models.Task(
            id="t8", title="竞品分析报告", project_id="p3", assigned_to=admin.id,
            status="todo", priority="low", created_by=admin.id,
            due_date="2024-06-15",
            created_at="2024-05-15", updated_at="2024-05-15",
        ),
    ]
    for t in tasks_data:
        db.add(t)


def reset_database(db):
    """清空所有数据（按外键依赖倒序删除，避免约束冲突）"""
    for table_name in _TABLE_DELETE_ORDER:
        table = getattr(models, table_name.capitalize(), None)
        if table is None:
            # 尝试单数形式
            for cls in [models.User, models.Project, models.Contact,
                        models.VisitLog, models.Quote, models.Contract,
                        models.Payment, models.Service, models.Task]:
                if cls.__tablename__ == table_name:
                    table = cls
                    break
        if table:
            count = db.query(table).count()
            db.query(table).delete()
            print(f"  {table_name}: 删除 {count} 条")
    db.commit()
    print("🗑️  数据库已清空")


def seed_data(reset: bool = False):
    """
    种子数据入口

    SEED_DATA 取值:
      - admin_only: 仅创建管理员，干净的空白系统
      - full: 管理员 + 全套演示数据
      - false: 跳过
    """
    mode = os.environ.get("SEED_DATA", "admin_only").lower()

    if mode == "false":
        print("ℹ️  SEED_DATA=false，跳过种子数据写入")
        return

    # 向后兼容：true / 1 → full
    if mode in ("true", "1"):
        mode = "full"

    if mode not in ("admin_only", "full"):
        print(f"⚠️  未知的 SEED_DATA 值: {mode}，使用默认 admin_only")
        mode = "admin_only"

    db = SessionLocal()
    try:
        if reset:
            reset_database(db)
        elif mode == "admin_only" and db.query(models.User).count() > 0:
            print("ℹ️  管理员账号已存在，跳过初始化")
            return
        elif mode == "full" and db.query(models.User).count() > 0:
            print("ℹ️  数据已存在，跳过种子数据写入")
            return

        print(f"🔧 初始化模式: {'管理员账号（干净系统）' if mode == 'admin_only' else '管理员 + 演示数据'}")
        admin = create_admin(db)
        if admin is None:
            return

        if mode == "full":
            seed_demo_data(db, admin)
            db.commit()
            print("✅ 种子数据写入完成（含演示数据）")
        else:
            print("✅ 初始化完成（干净系统，仅管理员账号）")

    except Exception as e:
        db.rollback()
        print(f"❌ 初始化失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    reset = "--reset" in sys.argv
    seed_data(reset=reset)
