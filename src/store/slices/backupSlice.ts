import { StateCreator } from 'zustand';

export interface BackupRecord {
  id: string;
  filename: string;
  size: string;
  date: string;
  status: 'success' | 'failed';
}

export interface BackupSlice {
  backupRecords: BackupRecord[];
  addBackupRecord: (record: BackupRecord) => void;
  deleteBackupRecord: (id: string) => void;
  clearBackupRecords: () => void;
}

export const createBackupSlice: StateCreator<any, [], [], BackupSlice> = (set) => ({
  backupRecords: [],

  addBackupRecord: (record) =>
    set((state) => ({ backupRecords: [record, ...state.backupRecords] })),

  deleteBackupRecord: (id) =>
    set((state) => ({ backupRecords: state.backupRecords.filter((r) => r.id !== id) })),

  clearBackupRecords: () => set({ backupRecords: [] }),
});
