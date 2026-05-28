import { StateCreator } from 'zustand';
import type { User } from '../../types';

export interface AuthSlice {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  setAuthLoading: (loading: boolean) => void;
}

export const createAuthSlice: StateCreator<any, [], [], AuthSlice> = (set) => ({
  currentUser: null,
  isAuthenticated: false,
  isAuthLoading: true,

  login: (user) => set({ currentUser: user, isAuthenticated: true, isAuthLoading: false }),

  setAuthLoading: (loading) => set({ isAuthLoading: loading }),

  logout: () => {
    localStorage.removeItem('token');
    set({
      currentUser: null,
      isAuthenticated: false,
      sidebarCollapsed: false,
      isDataInitialized: false,
      projects: [],
      contacts: [],
      visitLogs: [],
      quotes: [],
      contracts: [],
      payments: [],
      services: [],
    });
  },
});
