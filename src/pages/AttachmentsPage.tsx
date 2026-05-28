import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, FileText, FolderKanban, FileSignature, CreditCard, Paperclip } from 'lucide-react';
import { AttachmentItem } from '../types';
import { attachmentsApi } from '../api';
import { Pagination } from '../components/common/Pagination';
import { clsx } from 'clsx';

const moduleIcons: Record<string, React.ReactNode> = {
  '合同管理': <FileSignature className="w-4 h-4" />,
  '项目管理': <FolderKanban className="w-4 h-4" />,
  '款项管理': <CreditCard className="w-4 h-4" />,
};

const moduleColors: Record<string, string> = {
  '合同管理': 'bg-blue-100 text-blue-700',
  '项目管理': 'bg-indigo-100 text-indigo-700',
  '款项管理': 'bg-green-100 text-green-700',
};

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-500" />;
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return <FileText className="w-4 h-4 text-blue-500" />;
  return <FileText className="w-4 h-4 text-gray-500" />;
}

export const AttachmentsPage: React.FC = () => {
  const [items, setItems] = useState<AttachmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const loadAttachments = useCallback(async (p: number, search: string) => {
    setLoading(true);
    try {
      const res = await attachmentsApi.list({ page: p, limit: 50, search });
      setItems(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttachments(1, '');
  }, [loadAttachments]);

  const handleSearch = () => {
    setPage(1);
    loadAttachments(1, searchTerm);
  };

  const handlePageChange = (p: number) => {
    loadAttachments(p, searchTerm);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">附件中心</h3>
          <p className="text-gray-500 mt-1">集中管理项目文件、合同文件和发票文件</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="搜索文件名或来源名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">来源模块</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">来源名称</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">文件名</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">关联项目</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">日期</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={`${item.type}-${item.id}`}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className={clsx(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          moduleColors[item.module] || 'bg-gray-100 text-gray-700'
                        )}>
                          {moduleIcons[item.module]}
                          {item.module}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-900 text-sm">{item.name || '-'}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          {getFileIcon(item.fileName)}
                          <span className="text-gray-700">{item.fileName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{item.projectName || '-'}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{item.date?.slice(0, 10) || '-'}</td>
                      <td className="py-4 px-4">
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                          下载
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />

            {items.length === 0 && !loading && (
              <div className="text-center py-12">
                <Paperclip className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500">暂无附件数据</p>
                <p className="text-gray-500 text-sm mt-1">上传项目文件、合同文件或发票后，将在此集中展示</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
