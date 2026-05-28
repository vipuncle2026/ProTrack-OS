from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON, ForeignKey
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # admin/manager/sales/finance/user
    department_id = Column(String)
    department_name = Column(String)
    avatar = Column(String, default="")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True)
    type = Column(String)  # software/consulting/integration/other
    status = Column(String, default="potential")
    # potential/quoting/contracted/in_progress/completed/cancelled
    description = Column(Text, default="")
    budget = Column(Float, default=0)
    actual_cost = Column(Float, default=0)
    owner_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    owner_name = Column(String)
    department_id = Column(String)
    department_name = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    project_file = Column(String, default="")
    created_at = Column(String)
    updated_at = Column(String)


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    company = Column(String, default="")
    position = Column(String, default="")
    department = Column(String, default="")
    phone = Column(String, default="")
    mobile = Column(String, default="")
    email = Column(String, default="")
    project_id = Column(String, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    role = Column(String, default="other")  # decision_maker/technical/finance/other
    is_primary = Column(Boolean, default=False)
    notes = Column(Text, default="")
    created_at = Column(String)
    updated_at = Column(String)


class VisitLog(Base):
    __tablename__ = "visit_logs"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    contact_id = Column(String, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    contact_name = Column(String)
    visit_date = Column(String)
    location = Column(String, default="")
    purpose = Column(String, default="")
    content = Column(Text, default="")
    result = Column(Text, default="")
    next_action = Column(Text, default="")
    attachments = Column(JSON, default=list)
    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(String)
    updated_at = Column(String)


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(String, primary_key=True, index=True)
    quote_number = Column(String, unique=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    contact_id = Column(String, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    quote_date = Column(String)
    valid_until = Column(String)
    status = Column(String, default="draft")  # draft/sent/accepted/rejected/expired
    subtotal = Column(Float, default=0)
    discount = Column(Float, default=0)
    tax_rate = Column(Float, default=6)
    tax_amount = Column(Float, default=0)
    total = Column(Float, default=0)
    items = Column(JSON, default=list)
    notes = Column(Text, default="")
    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(String)
    updated_at = Column(String)


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(String, primary_key=True, index=True)
    contract_number = Column(String, unique=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String)
    contract_type = Column(String, default="sales")  # sales/purchase
    status = Column(String, default="draft")  # draft/reviewing/signing/executing/completed/terminated
    amount = Column(Float, default=0)
    payment_method = Column(String, default="")
    sign_date = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    contract_file = Column(String, default="")
    terms = Column(Text, default="")
    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(String)
    updated_at = Column(String)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, index=True)
    payment_number = Column(String, unique=True, index=True)
    contract_id = Column(String, ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    payment_type = Column(String, default="income")  # income/expense
    payment_date = Column(String)
    amount = Column(Float, default=0)
    payment_method = Column(String, default="")
    status = Column(String, default="pending")  # pending/partial/paid/overdue/cancelled
    invoice_number = Column(String, default="")
    invoice_file = Column(String, default="")
    notes = Column(Text, default="")
    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(String)
    updated_at = Column(String)


class Service(Base):
    __tablename__ = "services"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    contract_id = Column(String, ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True, index=True)
    service_type = Column(String)  # implementation/maintenance/training/consulting/other
    title = Column(String)
    description = Column(Text, default="")
    assigned_to = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_name = Column(String)
    status = Column(String, default="pending")  # pending/in_progress/completed/cancelled
    start_date = Column(String)
    end_date = Column(String)
    estimated_hours = Column(Float, default=0)
    actual_hours = Column(Float, default=0)
    report = Column(Text, default="")
    rating = Column(Integer, default=0)
    created_at = Column(String)
    updated_at = Column(String)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    project_id = Column(String, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_to = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_name = Column(String)
    status = Column(String, default="todo")  # todo/in_progress/done/blocked
    priority = Column(String, default="medium")  # low/medium/high/urgent
    due_date = Column(String)
    completed_at = Column(String)
    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(String)
    updated_at = Column(String)


class DirectCost(Base):
    __tablename__ = "direct_costs"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    contract_id = Column(String, ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String, nullable=False)  # 费用名称
    amount = Column(Float, default=0)
    cost_date = Column(String)
    notes = Column(Text, default="")
    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(String)
    updated_at = Column(String)


class AuditLog(Base):
    """操作审计日志"""
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    username = Column(String, default="")
    full_name = Column(String, default="")
    method = Column(String, nullable=False)  # GET/POST/PATCH/DELETE
    path = Column(String, nullable=False)    # /api/projects
    action = Column(String, default="")       # 操作描述：创建项目、更新联系人等
    detail = Column(Text, default="")         # 详细信息
    ip = Column(String, default="")
    created_at = Column(String)
