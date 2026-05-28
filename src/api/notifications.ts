import http from './http';
import type { NotificationResponse } from '../types';

export const notificationsApi = {
  list: () => http.get<NotificationResponse>('/notifications'),
};
