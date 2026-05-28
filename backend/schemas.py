from pydantic import BaseModel
from typing import Optional, List, Any, Literal


# ─── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str


# ─── User ─────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    username: str
    email: Optional[str] = ""
    fullName: str
    role: str
    departmentId: str
    departmentName: str
    avatar: str

    class Config:
        from_attributes = True


# ─── Project ──────────────────────────────────────────────────────────────────

class ProjectBase(BaseModel):
    name: str
    code: str
    type: Literal["software", "consulting", "integration", "other"]
    status: Literal["potential", "quoting", "contracted", "in_progress", "completed", "cancelled"] = "potential"
    description: str = ""
    budget: float = 0
    actualCost: float = 0
    ownerId: str = ""
    ownerName: str = ""
    departmentId: str = ""
    departmentName: str = ""
    startDate: str = ""
    endDate: str = ""
    projectFile: str = ""

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    type: Optional[Literal["software", "consulting", "integration", "other"]] = None
    status: Optional[Literal["potential", "quoting", "contracted", "in_progress", "completed", "cancelled"]] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    actualCost: Optional[float] = None
    ownerId: Optional[str] = None
    ownerName: Optional[str] = None
    departmentId: Optional[str] = None
    departmentName: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    projectFile: Optional[str] = None

class ProjectOut(ProjectBase):
    id: str
    createdAt: str
    updatedAt: str

    class Config:
        from_attributes = True


# ─── Contact ──────────────────────────────────────────────────────────────────

class ContactBase(BaseModel):
    name: str
    company: str = ""
    position: str = ""
    department: str = ""
    phone: str = ""
    mobile: str = ""
    email: str = ""
    projectId: str = ""
    role: Literal["decision_maker", "technical", "finance", "other"] = "other"
    isPrimary: bool = False
    notes: str = ""

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    projectId: Optional[str] = None
    role: Optional[Literal["decision_maker", "technical", "finance", "other"]] = None
    isPrimary: Optional[bool] = None
    notes: Optional[str] = None

class ContactOut(ContactBase):
    id: str
    createdAt: str
    updatedAt: str

    class Config:
        from_attributes = True


# ─── VisitLog ─────────────────────────────────────────────────────────────────

class VisitLogBase(BaseModel):
    projectId: str = ""
    contactId: str = ""
    contactName: str = ""
    visitDate: str = ""
    location: str = ""
    purpose: str = ""
    content: str = ""
    result: str = ""
    nextAction: str = ""
    attachments: List[str] = []
    createdBy: str = ""

class VisitLogCreate(VisitLogBase):
    pass

class VisitLogUpdate(BaseModel):
    projectId: Optional[str] = None
    contactId: Optional[str] = None
    contactName: Optional[str] = None
    visitDate: Optional[str] = None
    location: Optional[str] = None
    purpose: Optional[str] = None
    content: Optional[str] = None
    result: Optional[str] = None
    nextAction: Optional[str] = None
    attachments: Optional[List[str]] = None

class VisitLogOut(VisitLogBase):
    id: str
    createdAt: str
    updatedAt: str

    class Config:
        from_attributes = True


# ─── QuoteItem ────────────────────────────────────────────────────────────────

class QuoteItem(BaseModel):
    id: str
    description: str
    spec: str = ""
    quantity: float
    unitPrice: float
    amount: float
    taxRate: float = 6
    taxAmount: float = 0
    totalWithTax: float = 0


# ─── Quote ────────────────────────────────────────────────────────────────────

class QuoteBase(BaseModel):
    quoteNumber: str = ""
    projectId: str = ""
    contactId: str = ""
    quoteDate: str = ""
    validUntil: str = ""
    status: Literal["draft", "sent", "accepted", "rejected", "expired"] = "draft"
    subtotal: float = 0
    discount: float = 0
    taxRate: float = 6
    taxAmount: float = 0
    total: float = 0
    items: List[QuoteItem] = []
    notes: str = ""
    createdBy: str = ""

class QuoteCreate(QuoteBase):
    pass

class QuoteUpdate(BaseModel):
    quoteNumber: Optional[str] = None
    projectId: Optional[str] = None
    contactId: Optional[str] = None
    quoteDate: Optional[str] = None
    validUntil: Optional[str] = None
    status: Optional[Literal["draft", "sent", "accepted", "rejected", "expired"]] = None
    subtotal: Optional[float] = None
    discount: Optional[float] = None
    taxRate: Optional[float] = None
    taxAmount: Optional[float] = None
    total: Optional[float] = None
    items: Optional[List[QuoteItem]] = None
    notes: Optional[str] = None

class QuoteOut(QuoteBase):
    id: str
    createdAt: str
    updatedAt: str

    class Config:
        from_attributes = True


# ─── Contract ─────────────────────────────────────────────────────────────────

class ContractBase(BaseModel):
    contractNumber: str = ""
    projectId: str = ""
    name: str = ""
    contractType: Literal["sales", "purchase"] = "sales"
    status: Literal["draft", "reviewing", "signing", "executing", "completed", "terminated"] = "draft"
    amount: float = 0
    paymentMethod: str = ""
    signDate: str = ""
    startDate: str = ""
    endDate: str = ""
    contractFile: str = ""
    terms: str = ""
    createdBy: str = ""

class ContractCreate(ContractBase):
    pass

class ContractUpdate(BaseModel):
    contractNumber: Optional[str] = None
    projectId: Optional[str] = None
    name: Optional[str] = None
    contractType: Optional[Literal["sales", "purchase"]] = None
    status: Optional[Literal["draft", "reviewing", "signing", "executing", "completed", "terminated"]] = None
    amount: Optional[float] = None
    paymentMethod: Optional[str] = None
    signDate: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    contractFile: Optional[str] = None
    terms: Optional[str] = None

class ContractOut(ContractBase):
    id: str
    createdAt: str
    updatedAt: str

    class Config:
        from_attributes = True


# ─── Payment ──────────────────────────────────────────────────────────────────

class PaymentBase(BaseModel):
    paymentNumber: str = ""
    contractId: str = ""
    projectId: str = ""
    paymentType: Literal["income", "expense"] = "income"
    paymentDate: str = ""
    amount: float = 0
    paymentMethod: str = ""
    status: Literal["pending", "partial", "paid", "overdue", "cancelled"] = "pending"
    invoiceNumber: str = ""
    invoiceFile: str = ""
    notes: str = ""
    createdBy: str = ""

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    paymentNumber: Optional[str] = None
    contractId: Optional[str] = None
    projectId: Optional[str] = None
    paymentType: Optional[Literal["income", "expense"]] = None
    paymentDate: Optional[str] = None
    amount: Optional[float] = None
    paymentMethod: Optional[str] = None
    status: Optional[Literal["pending", "partial", "paid", "overdue", "cancelled"]] = None
    invoiceNumber: Optional[str] = None
    invoiceFile: Optional[str] = None
    notes: Optional[str] = None

class PaymentOut(PaymentBase):
    id: str
    createdAt: str
    updatedAt: str

    class Config:
        from_attributes = True


# ─── Service ──────────────────────────────────────────────────────────────────

class ServiceBase(BaseModel):
    projectId: str = ""
    contractId: str = ""
    serviceType: Literal["implementation", "maintenance", "training", "consulting", "other"] = "implementation"
    title: str = ""
    description: str = ""
    assignedTo: str = ""
    assignedName: str = ""
    status: Literal["pending", "in_progress", "completed", "cancelled"] = "pending"
    startDate: str = ""
    endDate: str = ""
    estimatedHours: float = 0
    actualHours: float = 0
    report: str = ""
    rating: int = 0
    createdBy: str = ""

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    projectId: Optional[str] = None
    contractId: Optional[str] = None
    serviceType: Optional[Literal["implementation", "maintenance", "training", "consulting", "other"]] = None
    title: Optional[str] = None
    description: Optional[str] = None
    assignedTo: Optional[str] = None
    assignedName: Optional[str] = None
    status: Optional[Literal["pending", "in_progress", "completed", "cancelled"]] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    actualHours: Optional[float] = None
    report: Optional[str] = None
    rating: Optional[int] = None

class ServiceOut(ServiceBase):
    id: str
    createdAt: str
    updatedAt: str

    class Config:
        from_attributes = True


# ─── Task ──────────────────────────────────────────────────────────────────────

class TaskBase(BaseModel):
    title: str
    description: str = ""
    projectId: str = ""
    assignedTo: str = ""
    assignedName: str = ""
    status: Literal["todo", "in_progress", "done", "blocked"] = "todo"
    priority: Literal["low", "medium", "high", "urgent"] = "medium"
    dueDate: str = ""
    completedAt: str = ""
    createdBy: str = ""

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    projectId: Optional[str] = None
    assignedTo: Optional[str] = None
    assignedName: Optional[str] = None
    status: Optional[Literal["todo", "in_progress", "done", "blocked"]] = None
    priority: Optional[Literal["low", "medium", "high", "urgent"]] = None
    dueDate: Optional[str] = None
    completedAt: Optional[str] = None

class TaskOut(TaskBase):
    id: str
    createdAt: str
    updatedAt: str

    class Config:
        from_attributes = True


# ─── Bulk Init ────────────────────────────────────────────────────────────────

class InitDataRequest(BaseModel):
    projects: List[Any] = []
    contacts: List[Any] = []
    visitLogs: List[Any] = []
    quotes: List[Any] = []
    contracts: List[Any] = []
    payments: List[Any] = []
    services: List[Any] = []


# ─── DirectCost ────────────────────────────────────────────────────────────────

class DirectCostBase(BaseModel):
    projectId: str = ""
    contractId: str = ""
    name: str
    amount: float = 0
    costDate: str = ""
    notes: str = ""
    createdBy: str = ""

class DirectCostCreate(DirectCostBase):
    pass

class DirectCostUpdate(BaseModel):
    projectId: Optional[str] = None
    contractId: Optional[str] = None
    name: Optional[str] = None
    amount: Optional[float] = None
    costDate: Optional[str] = None
    notes: Optional[str] = None

class DirectCostOut(DirectCostBase):
    id: str
    createdAt: str
    updatedAt: str

    class Config:
        from_attributes = True
