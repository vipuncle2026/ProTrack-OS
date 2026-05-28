import { StateCreator } from 'zustand';

export interface UiSlice {
  sidebarCollapsed: boolean;
  loading: boolean;
  error: string | null;
  toggleSidebar: () => void;
}

export const createUiSlice: StateCreator<any, [], [], UiSlice> = (set) => ({
  sidebarCollapsed: false,
  loading: false,
  error: null,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
});
