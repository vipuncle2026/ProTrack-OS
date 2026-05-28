import React, { useEffect, useState } from 'react';
import { Clock, User, FileText, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { auditApi } from '../api/audit';
import type { AuditLog } from '../types';

const METHOD_COLORS: Record<string, string> = {
  POST: 'bg-blue-100 text-blue-700',
  PATCH: 'bg-amber-100 text-amber-700',
  PUT: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
};

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await auditApi.list({ page: p, limit: 50, search: s });
      setLogs(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchLogs(1, search);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">操作审计</h3>
            <p className="text-sm text-gray-500 mt-1">记录所有用户的操作历史，可追溯谁在什么时候做了什么</p>
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="搜索操作... (如：创建项目、登录)"
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            搜索
          </button>
          <span className="text-sm text-gray-500 ml-auto">
            共 {total} 条记录
          </span>
        </div>
      </div>

      {/* 日志列表 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
        {loading ? (
          <div className="px-6 py-16 text-center text-gray-500">加载中…</div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500">暂无操作记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50/80 to-white/80 border-b border-gray-200/50">
                  <th className="text-left py-3 px-6 text-sm font-bold text-gray-700">时间</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">操作人</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">方法</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">操作</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">路径</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-100/50 hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} className="text-gray-500" />
                        <span>{log.createdAt ? new Date(log.createdAt).toLocaleString('zh-CN') : '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-800">
                          {log.fullName || log.username || '未知'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${METHOD_COLORS[log.method] || 'bg-gray-100 text-gray-600'}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-700">{log.action || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">{log.path}</code>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-500">{log.ip || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              第 {page} / {totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { const p = page - 1; setPage(p); fetchLogs(p, search); }}
                disabled={page <= 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => { const p = page + 1; setPage(p); fetchLogs(p, search); }}
                disabled={page >= totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
