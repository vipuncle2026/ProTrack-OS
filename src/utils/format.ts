/**
 * 金额格式化：¥X.X万 / ¥X,XXX
 */
export function formatCurrency(amount: number): string {
  if (amount >= 10000) {
    const wan = amount / 10000;
    const formatted = wan % 1 === 0 ? wan.toFixed(0) : wan.toFixed(1);
    return `¥${formatted}万`;
  }
  return `¥${amount.toLocaleString()}`;
}

/**
 * 文件大小格式化
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 日期格式化：YYYY年MM月DD日
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

/**
 * 日期格式化：YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
