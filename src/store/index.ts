/**
 * Zustand Store — 模块化架构
 *
 * 拆分策略:
 *   authSlice    — 登录/登出/当前用户
 *   appSlice     — 侧边栏/loading/error
 *   backupSlice  — 备份历史记录
 *   entitySlice  — 7 个实体的数据 + CRUD + bootstrap (通用工厂)
 */

import { create } from 'zustand';
import { createAuthSlice, type AuthSlice } from './slices/authSlice';
import { createUiSlice, type UiSlice } from './slices/appSlice';
import { createBackupSlice, type BackupSlice } from './slices/backupSlice';
import { createEntitySlice, type EntitySlice } from './slices/entitySlice';

export type AppState = AuthSlice & UiSlice & BackupSlice & EntitySlice;

export const useStore = create<AppState>()((...args) => ({
  ...createAuthSlice(...args),
  ...createUiSlice(...args),
  ...createBackupSlice(...args),
  ...createEntitySlice(...args),
}));
