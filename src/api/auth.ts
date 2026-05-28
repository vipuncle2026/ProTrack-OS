import http from './http';
import type { User } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  login: (username: string, password: string) =>
    http.post<LoginResponse>('/auth/login', { username, password }),

  getMe: () => http.get<User>('/auth/me'),

  changePassword: (old_password: string, new_password: string) =>
    http.post('/auth/change-password', { old_password, new_password }),
};
