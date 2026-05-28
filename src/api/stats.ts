import http from './http';

export interface StatsSummary {
  projects: {
    total: number;
    byStatus: Record<string, number>;
  };
  contacts: {
    total: number;
  };
  contracts: {
    total: number;
    totalAmount: number;
    salesAmount: number;
    purchaseAmount: number;
    byStatus: Record<string, number>;
  };
  payments: {
    total: number;
    incomeAmount: number;
    expenseAmount: number;
    incomePaid: number;
    incomePending: number;
    expensePaid: number;
    expensePending: number;
  };
  visitLogs: {
    total: number;
  };
  quotes: {
    total: number;
    totalAmount: number;
  };
  services: {
    total: number;
    byStatus: Record<string, number>;
  };
  tasks: {
    total: number;
    byStatus: Record<string, number>;
  };
  attachments: {
    total: number;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    code: string;
    status: string;
    budget: number;
    ownerName: string;
  }>;
  pendingPayments: Array<{
    id: string;
    paymentNumber: string;
    paymentDate: string;
    amount: number;
    status: string;
  }>;
}

export interface MonthlyTrend {
  label: string;
  year: number;
  month: number;
  income: number;
  expense: number;
}

export interface MonthlyTrendResponse {
  months: MonthlyTrend[];
}

export const statsApi = {
  getSummary: () => http.get<StatsSummary>('/stats/summary'),
  getMonthly: (months?: number) =>
    http.get<MonthlyTrendResponse>('/stats/monthly', { params: { months: months || 12 } }),
};
