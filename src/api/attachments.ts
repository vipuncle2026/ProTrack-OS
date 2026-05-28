import http from './http';
import type { AttachmentItem } from '../types';
import type { PaginatedResponse, ListParams } from './resources';

export const attachmentsApi = {
  list: (params?: ListParams) =>
    http.get<PaginatedResponse<AttachmentItem>>('/attachments', { params }),
};
