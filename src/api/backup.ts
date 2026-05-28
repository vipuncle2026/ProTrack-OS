import http from './http';

interface RestoreResult {
  message: string;
  counts: Record<string, number>;
}

/**
 * 保存 Blob 到磁盘。
 * 优先使用 File System Access API（可检测用户取消），
 * 不支持时回退到 link.click()（无法检测取消，默认视为成功）。
 * @returns Promise，用户保存成功 resolve，取消则 reject
 */
export async function saveBlob(blob: Blob, suggestedName: string): Promise<void> {
  // 尝试现代 File System Access API（Chrome/Edge/Opera）
  if ('showSaveFilePicker' in window) {
    try {
      const ext = suggestedName.includes('.') ? suggestedName.split('.').pop()! : '';
      const handle = await (
        window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }
      ).showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'Backup File',
            accept: { 'application/octet-stream': [`.${ext}`] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return; // 用户确认保存，成功
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err; // 用户点了取消
      }
      // 其他错误，走 fallback
    }
  }

  // Fallback：传统 link.click()，无法检测用户是否取消
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = suggestedName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const backupApi = {
  /** 导出 ZIP 备份包（含 data.json + 合同文件） */
  exportZip: async (): Promise<Blob> => {
    const response = await http.get('/backup/export', {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  /** 从 ZIP 文件恢复备份 */
  restoreZip: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post<RestoreResult>('/backup/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  reset: () =>
    http.post<{ message: string }>('/backup/reset'),

  /** 获取数据库文件 Blob，由调用方自行处理保存逻辑 */
  downloadDbBlob: async (): Promise<Blob> => {
    const response = await http.get('/backup/download-db', {
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};
