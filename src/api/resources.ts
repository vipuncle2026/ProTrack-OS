import http from './http';
import type { Project, Contact, VisitLog, Quote, Contract, Payment, Service, Task, DirectCost, ProfitResponse } from '../types';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  projectId?: string;
}

// ─── Projects ──────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: (params?: ListParams) =>
    http.get<PaginatedResponse<Project>>('/projects', { params }),
  get: (id: string) => http.get<Project>(`/projects/${id}`),
  create: (data: Record<string, unknown>) =>
    http.post<Project>('/projects', data),
  update: (id: string, data: Partial<Project>) =>
    http.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) => http.delete(`/projects/${id}`),
  upload: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post(`/projects/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFileUrl: (id: string) => `/api/projects/${id}/file`,
};

// ─── Contacts ──────────────────────────────────────────────────────────────────
export const contactsApi = {
  list: (params?: ListParams) =>
    http.get<PaginatedResponse<Contact>>('/contacts', { params }),
  get: (id: string) => http.get<Contact>(`/contacts/${id}`),
  create: (data: Record<string, unknown>) =>
    http.post<Contact>('/contacts', data),
  update: (id: string, data: Partial<Contact>) =>
    http.patch<Contact>(`/contacts/${id}`, data),
  delete: (id: string) => http.delete(`/contacts/${id}`),
};

// ─── Visit Logs ────────────────────────────────────────────────────────────────
export const visitLogsApi = {
  list: (params?: ListParams) =>
    http.get<PaginatedResponse<VisitLog>>('/visit-logs', { params }),
  get: (id: string) => http.get<VisitLog>(`/visit-logs/${id}`),
  create: (data: Record<string, unknown>) =>
    http.post<VisitLog>('/visit-logs', data),
  update: (id: string, data: Partial<VisitLog>) =>
    http.patch<VisitLog>(`/visit-logs/${id}`, data),
  delete: (id: string) => http.delete(`/visit-logs/${id}`),
};

// ─── Quotes ────────────────────────────────────────────────────────────────────
export const quotesApi = {
  list: (params?: ListParams) =>
    http.get<PaginatedResponse<Quote>>('/quotes', { params }),
  get: (id: string) => http.get<Quote>(`/quotes/${id}`),
  create: (data: Record<string, unknown>) =>
    http.post<Quote>('/quotes', data),
  update: (id: string, data: Partial<Quote>) =>
    http.patch<Quote>(`/quotes/${id}`, data),
  delete: (id: string) => http.delete(`/quotes/${id}`),
};

// ─── Contracts ─────────────────────────────────────────────────────────────────
export const contractsApi = {
  list: (params?: ListParams) =>
    http.get<PaginatedResponse<Contract>>('/contracts', { params }),
  get: (id: string) => http.get<Contract>(`/contracts/${id}`),
  create: (data: Record<string, unknown>) =>
    http.post<Contract>('/contracts', data),
  update: (id: string, data: Partial<Contract>) =>
    http.patch<Contract>(`/contracts/${id}`, data),
  delete: (id: string) => http.delete(`/contracts/${id}`),
  upload: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post(`/contracts/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFileUrl: (id: string) => `/api/contracts/${id}/file`,
};

// ─── Payments ──────────────────────────────────────────────────────────────────
export const paymentsApi = {
  list: (params?: ListParams) =>
    http.get<PaginatedResponse<Payment>>('/payments', { params }),
  get: (id: string) => http.get<Payment>(`/payments/${id}`),
  create: (data: Record<string, unknown>) =>
    http.post<Payment>('/payments', data),
  update: (id: string, data: Partial<Payment>) =>
    http.patch<Payment>(`/payments/${id}`, data),
  delete: (id: string) => http.delete(`/payments/${id}`),
  upload: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post(`/payments/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFileUrl: (id: string) => `/api/payments/${id}/invoice-file`,
};

// ─── Services ──────────────────────────────────────────────────────────────────
export const servicesApi = {
  list: (params?: ListParams) =>
    http.get<PaginatedResponse<Service>>('/services', { params }),
  get: (id: string) => http.get<Service>(`/services/${id}`),
  create: (data: Record<string, unknown>) =>
    http.post<Service>('/services', data),
  update: (id: string, data: Partial<Service>) =>
    http.patch<Service>(`/services/${id}`, data),
  delete: (id: string) => http.delete(`/services/${id}`),
};

// ─── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: (params?: ListParams) =>
    http.get<PaginatedResponse<Task>>('/tasks', { params }),
  get: (id: string) => http.get<Task>(`/tasks/${id}`),
  create: (data: Record<string, unknown>) =>
    http.post<Task>('/tasks', data),
  update: (id: string, data: Partial<Task>) =>
    http.patch<Task>(`/tasks/${id}`, data),
  delete: (id: string) => http.delete(`/tasks/${id}`),
};

// ─── DirectCosts ────────────────────────────────────────────────────────────────
export const directCostsApi = {
  list: (params?: ListParams) =>
    http.get<PaginatedResponse<DirectCost>>('/direct-costs', { params }),
  get: (id: string) => http.get<DirectCost>(`/direct-costs/${id}`),
  create: (data: Record<string, unknown>) =>
    http.post<DirectCost>('/direct-costs', data),
  update: (id: string, data: Partial<DirectCost>) =>
    http.patch<DirectCost>(`/direct-costs/${id}`, data),
  delete: (id: string) => http.delete(`/direct-costs/${id}`),
};

// ─── Profits ────────────────────────────────────────────────────────────────────
export const profitsApi = {
  getSummary: () => http.get<ProfitResponse>('/profits/summary'),
};
