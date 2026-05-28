export interface Project {
  id: string;
  name: string;
  code: string;
  type: 'software' | 'consulting' | 'integration' | 'other';
  status: 'potential' | 'quoting' | 'contracted' | 'in_progress' | 'completed' | 'terminated';
  description: string;
  budget: number;
  actualCost: number;
  ownerId: string;
  ownerName: string;
  departmentId: string;
  departmentName: string;
  startDate: string;
  endDate: string;
  projectFile: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  position: string;
  department: string;
  phone: string;
  mobile: string;
  email: string;
  projectId: string;
  role: 'decision_maker' | 'technical' | 'finance' | 'other';
  isPrimary: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitLog {
  id: string;
  projectId: string;
  contactId: string;
  contactName: string;
  visitDate: string;
  location: string;
  purpose: string;
  content: string;
  result: string;
  nextAction: string;
  attachments: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  projectId: string;
  contactId: string;
  quoteDate: string;
  validUntil: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  items: QuoteItem[];
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  spec: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  totalWithTax: number;
}

export interface Contract {
  id: string;
  contractNumber: string;
  projectId: string;
  name: string;
  contractType: 'sales' | 'purchase';
  status: 'draft' | 'approving' | 'signed' | 'executing' | 'completed';
  amount: number;
  paymentMethod: string;
  signDate: string;
  startDate: string;
  endDate: string;
  contractFile: string;
  terms: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  contractId: string;
  projectId: string;
  paymentType: 'income' | 'expense';
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'partial' | 'paid';
  invoiceNumber: string;
  invoiceFile: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  projectId: string;
  contractId: string;
  serviceType: 'implementation' | 'training' | 'maintenance' | 'support';
  title: string;
  description: string;
  assignedTo: string;
  assignedName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  startDate: string;
  endDate: string;
  estimatedHours: number;
  actualHours: number;
  report: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'sales' | 'finance' | 'user';
  departmentId: string;
  departmentName: string;
  avatar: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string;
  assignedName: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  completedAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface NotificationResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
}

export interface DirectCost {
  id: string;
  projectId: string;
  contractId: string;
  name: string;
  amount: number;
  costDate: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfitItem {
  projectId: string;
  projectName: string;
  projectStatus: string;
  salesAmount: number;
  purchaseAmount: number;
  directCostAmount: number;
  profit: number;
  margin: number;
  salesContractCount: number;
  purchaseContractCount: number;
  directCostCount: number;
}

export interface ProfitSummary {
  totalSalesAmount: number;
  totalPurchaseAmount: number;
  totalDirectCostAmount: number;
  totalProfit: number;
  totalMargin: number;
}

export interface ProfitResponse {
  items: ProfitItem[];
  summary: ProfitSummary;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  method: string;
  path: string;
  action: string;
  detail: string;
  ip: string;
  createdAt: string;
}

export interface AttachmentItem {
  type: 'contract' | 'project' | 'payment';
  id: string;
  name: string;
  fileName: string;
  projectName: string;
  module: string;
  date: string;
  fileUrl: string;
}
