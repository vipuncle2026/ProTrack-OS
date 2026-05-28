import http from './http';
import type { AuditLog } from '../types';
import type { PaginatedResponse, ListParams } from './resources';

export const auditApi = {
  list: (params?: ListParams) =>
    http.get<PaginatedResponse<AuditLog>>('/audit-logs', { params }),
};
