import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Edit, Trash2, X, FileText, Filter, Printer } from 'lucide-react';
import { useStore } from '../store';
import { Quote, QuoteItem, Project } from '../types';
import { quotesApi, projectsApi } from '../api';
import { Pagination } from '../components/common/Pagination';
import { formatCurrency } from '../utils/format';
import { clsx } from 'clsx';

export const QuotesPage: React.FC = () => {
  const { addQuote, updateQuote, deleteQuote } = useStore();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  const [newQuote, setNewQuote] = useState<Partial<Quote>>({
    quoteNumber: '',
    projectId: '',
    contactId: '',
    quoteDate: new Date().toISOString().split('T')[0],
    validUntil: '',
    status: 'draft',
    subtotal: 0,
    total: 0,
    items: [],
    notes: '',
  });

  const [quoteItems, setQuoteItems] = useState<Partial<QuoteItem>[]>([
    { id: '1', description: '', spec: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 6, taxAmount: 0, totalWithTax: 0 },
  ]);

  const loadQuotes = useCallback(async (p: number, search: string) => {
    setLoading(true);
    try {
      const res = await quotesApi.list({ page: p, limit: 50, search });
      setQuotes(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const res = await projectsApi.list({ page: 1, limit: 200 });
      setProjects(res.data.items);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadQuotes(1, '');
    loadProjects();
  }, [loadQuotes, loadProjects]);

  // 主汇总：从明细项自动求和
  useEffect(() => {
    const subtotal = quoteItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
    const totalTax = quoteItems.reduce((sum, item) => {
      const amt = (item.quantity || 0) * (item.unitPrice || 0);
      return sum + amt * ((item.taxRate ?? 6) / 100);
    }, 0);
    const total = subtotal + totalTax;

    setNewQuote((prev) => ({
      ...prev,
      subtotal,
      taxAmount: totalTax,
      total,
    }));
  }, [quoteItems]);

  const filteredQuotes = quotes.filter((quote) => {
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    const matchesProject = projectFilter === 'all' || quote.projectId === projectFilter;
    return matchesStatus && matchesProject;
  });

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || '未关联项目';
  };

  const handleSearch = () => {
    setPage(1);
    loadQuotes(1, searchTerm);
  };

  const handlePageChange = (p: number) => {
    loadQuotes(p, searchTerm);
  };

  const handleAddItem = () => {
    setQuoteItems([
      ...quoteItems,
      { id: String(Date.now()), description: '', spec: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 6, taxAmount: 0, totalWithTax: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (quoteItems.length > 1) {
      setQuoteItems(quoteItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    const updatedItems = [...quoteItems];
    const item = { ...updatedItems[index], [field]: value };

    // 当数量/单价/税率变化时，自动重算金额
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      const qty = field === 'quantity' ? Number(value) : (item.quantity || 0);
      const price = field === 'unitPrice' ? Number(value) : (item.unitPrice || 0);
      const rate = field === 'taxRate' ? Number(value) : (item.taxRate ?? 6);
      const amount = qty * price;
      item.amount = amount;
      item.taxAmount = amount * (rate / 100);
      item.totalWithTax = amount + item.taxAmount;
    }

    updatedItems[index] = item;
    setQuoteItems(updatedItems);
  };

  const handleOpenCreateModal = () => {
    setEditingQuote(null);
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (quote: Quote) => {
    setEditingQuote(quote);
    setNewQuote({
      quoteNumber: quote.quoteNumber,
      projectId: quote.projectId,
      contactId: quote.contactId,
      quoteDate: quote.quoteDate,
      validUntil: quote.validUntil,
      status: quote.status,
      subtotal: quote.subtotal,
      total: quote.total,
      notes: quote.notes,
    });
    setQuoteItems(quote.items.map(item => ({ ...item })));
    setShowModal(true);
  };

  const handleSaveQuote = async () => {
    if (editingQuote) {
      const updatedQuote = {
        ...editingQuote,
        ...newQuote,
        items: quoteItems.map((item, index) => ({
          id: String(index + 1),
          description: item.description || '',
          spec: item.spec || '',
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          amount: (item.quantity || 0) * (item.unitPrice || 0),
          taxRate: item.taxRate ?? 6,
          taxAmount: (item.quantity || 0) * (item.unitPrice || 0) * ((item.taxRate ?? 6) / 100),
          totalWithTax: (item.quantity || 0) * (item.unitPrice || 0) * (1 + (item.taxRate ?? 6) / 100),
        })),
        updatedAt: new Date().toISOString(),
      };
      await updateQuote(editingQuote.id, updatedQuote);
    } else {
      await addQuote({
        quoteNumber: `QT-${Date.now()}`,
        projectId: newQuote.projectId || '',
        contactId: newQuote.contactId || '',
        quoteDate: newQuote.quoteDate || new Date().toISOString().split('T')[0],
        validUntil: newQuote.validUntil || '',
        status: newQuote.status as Quote['status'] || 'draft',
        subtotal: newQuote.subtotal || 0,
        taxAmount: newQuote.taxAmount || 0,
        total: newQuote.total || 0,
        items: quoteItems.map((item, index) => ({
          id: String(index + 1),
          description: item.description || '',
          spec: item.spec || '',
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          amount: (item.quantity || 0) * (item.unitPrice || 0),
          taxRate: item.taxRate ?? 6,
          taxAmount: (item.quantity || 0) * (item.unitPrice || 0) * ((item.taxRate ?? 6) / 100),
          totalWithTax: (item.quantity || 0) * (item.unitPrice || 0) * (1 + (item.taxRate ?? 6) / 100),
        })),
        notes: newQuote.notes || '',
      });
    }
    setShowModal(false);
    resetForm();
    loadQuotes(page, searchTerm);
  };

  const resetForm = () => {
    setNewQuote({
      quoteNumber: '',
      projectId: '',
      contactId: '',
      quoteDate: new Date().toISOString().split('T')[0],
      validUntil: '',
      status: 'draft',
      subtotal: 0,
      total: 0,
      items: [],
      notes: '',
    });
    setQuoteItems([{ id: '1', description: '', spec: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 6, taxAmount: 0, totalWithTax: 0 }]);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个报价单吗？')) {
      await deleteQuote(id);
      loadQuotes(page, searchTerm);
    }
  };

  const handlePrintQuote = (directPrint: boolean) => {
    if (!selectedQuote) return;

    const projectName = getProjectName(selectedQuote.projectId);
    const itemsRows = selectedQuote.items.map(item => `
      <tr>
        <td>${item.description}</td>
        <td>${item.spec || '-'}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${formatCurrency(item.unitPrice)}</td>
        <td class="num">${item.taxRate ?? 6}%</td>
        <td class="num">${formatCurrency(item.taxAmount || 0)}</td>
        <td class="num strong">${formatCurrency(item.totalWithTax || 0)}</td>
      </tr>
    `).join('');

    const statusLabel = statusLabels[selectedQuote.status];
    const printContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>报价单 - ${selectedQuote.quoteNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif; color: #1f2937; padding: 40px 50px; max-width: 900px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #3b82f6; }
    .header h1 { font-size: 26px; color: #1e40af; margin-bottom: 6px; }
    .header .sub { font-size: 14px; color: #6b7280; }
    .meta { display: flex; flex-wrap: wrap; gap: 20px 60px; margin-bottom: 28px; padding: 16px 20px; background: #f8fafc; border-radius: 8px; }
    .meta-item { display: flex; flex-direction: column; gap: 2px; }
    .meta-item .label { font-size: 12px; color: #9ca3af; }
    .meta-item .value { font-size: 15px; font-weight: 600; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .status-draft { background: #f3f4f6; color: #374151; }
    .status-sent { background: #dbeafe; color: #1d4ed8; }
    .status-accepted { background: #dcfce7; color: #15803d; }
    .status-rejected { background: #fee2e2; color: #b91c1c; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 12px; font-weight: 700; color: #4b5563; border-bottom: 2px solid #e5e7eb; }
    th.num { text-align: right; }
    td { padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
    td.num { text-align: right; }
    td.strong { font-weight: 700; }
    .section-title { font-size: 15px; font-weight: 700; color: #374151; margin-bottom: 10px; }
    .summary { margin-bottom: 24px; padding: 16px 20px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; }
    .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
    .summary-row.total { margin-top: 8px; padding-top: 10px; border-top: 1px solid #bae6fd; font-size: 18px; font-weight: 700; }
    .summary-row.total .val { color: #2563eb; }
    .notes { margin-top: 24px; padding: 16px 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
    .notes .label { font-size: 13px; font-weight: 700; color: #6b7280; margin-bottom: 6px; }
    .notes .content { font-size: 14px; color: #4b5563; line-height: 1.6; white-space: pre-wrap; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
    @media print {
      body { padding: 20px 30px; }
      @page { size: A4; margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>报 价 单</h1>
    <div class="sub">报价单号：${selectedQuote.quoteNumber}</div>
  </div>

  <div class="meta">
    <div class="meta-item">
      <span class="label">关联项目</span>
      <span class="value">${projectName}</span>
    </div>
    <div class="meta-item">
      <span class="label">报价日期</span>
      <span class="value">${selectedQuote.quoteDate}</span>
    </div>
    <div class="meta-item">
      <span class="label">有效期至</span>
      <span class="value">${selectedQuote.validUntil}</span>
    </div>
    <div class="meta-item">
      <span class="label">状态</span>
      <span class="value">
        <span class="status-badge status-${selectedQuote.status}">${statusLabel}</span>
      </span>
    </div>
  </div>

  <div class="section-title">报价明细</div>
  <table>
    <thead>
      <tr>
        <th>产品/服务名称</th>
        <th>规格参数</th>
        <th class="num">数量</th>
        <th class="num">不含税单价</th>
        <th class="num">税率</th>
        <th class="num">税额</th>
        <th class="num">含税金额</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-row">
      <span>不含税小计</span>
      <span>${formatCurrency(selectedQuote.subtotal)}</span>
    </div>
    <div class="summary-row">
      <span>税额合计</span>
      <span>${formatCurrency(selectedQuote.taxAmount)}</span>
    </div>
    <div class="summary-row total">
      <span>含税总金额</span>
      <span class="val">${formatCurrency(selectedQuote.total)}</span>
    </div>
  </div>

  ${selectedQuote.notes ? `
  <div class="notes">
    <div class="label">备注</div>
    <div class="content">${selectedQuote.notes}</div>
  </div>
  ` : ''}

  <div class="footer">
    ProTrack 项目管理系统 · 报价单 · 生成时间 ${new Date().toLocaleDateString('zh-CN')}
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=950,height=750');
    if (!printWindow) {
      alert('弹窗被浏览器拦截，请允许弹窗后重试');
      return;
    }
    printWindow.document.write(printContent);
    printWindow.document.close();

    if (directPrint) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
      // Safari 兼容：如果已经 loaded 就直接打印
      if (printWindow.document.readyState === 'complete') {
        printWindow.print();
      }
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    sent: '已发送',
    accepted: '已接受',
    rejected: '已拒绝',
  };


  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">报价单管理</h3>
            <p className="text-sm text-gray-500 mt-1">共 {total} 条报价单</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">新建报价单</span>
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="搜索报价单号或备注..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/50 border border-gray-200/50 rounded-xl">
            <Filter className="text-gray-500" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-gray-700 font-medium cursor-pointer"
            >
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="sent">已发送</option>
              <option value="accepted">已接受</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/50 border border-gray-200/50 rounded-xl">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-gray-700 font-medium cursor-pointer"
            >
              <option value="all">全部项目</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 报价单列表 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50/80 to-white/80 border-b border-gray-200/50">
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">报价单号</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">关联项目</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">报价日期</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">有效期至</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">金额</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((quote) => (
                    <tr
                      key={quote.id}
                      className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200 group"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <FileText size={18} className="text-gray-500 group-hover:text-blue-500 transition-colors" />
                          <span className="font-medium text-gray-900">{quote.quoteNumber}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {getProjectName(quote.projectId)}
                      </td>
                      <td className="py-4 px-4 text-gray-600">{quote.quoteDate}</td>
                      <td className="py-4 px-4 text-gray-600">{quote.validUntil}</td>
                      <td className="py-4 px-4">
                        <span
                          className={clsx(
                            'px-3 py-1.5 rounded-full text-xs font-bold shadow-sm',
                            statusColors[quote.status]
                          )}
                        >
                          {statusLabels[quote.status]}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-base font-bold text-gray-800">
                          {formatCurrency(quote.total)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedQuote(quote)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(quote)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(quote.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 pb-4">
              <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />
            </div>

            {filteredQuotes.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-500" />
                </div>
                <p className="text-gray-500 text-lg font-medium">暂无报价单数据</p>
                <p className="text-gray-500 text-sm mt-2">点击上方按钮创建第一个报价单</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 新建/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200/50 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
                  <h3 className="text-2xl font-bold text-gray-800">
                    {editingQuote ? '编辑报价单' : '新建报价单'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">关联项目 *</label>
                  <select
                    value={newQuote.projectId}
                    onChange={(e) => setNewQuote({ ...newQuote, projectId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">请选择项目</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">报价状态</label>
                  <select
                    value={newQuote.status}
                    onChange={(e) => setNewQuote({ ...newQuote, status: e.target.value as Quote['status'] })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="draft">草稿</option>
                    <option value="sent">已发送</option>
                    <option value="accepted">已接受</option>
                    <option value="rejected">已拒绝</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">报价日期</label>
                  <input
                    type="date"
                    value={newQuote.quoteDate}
                    onChange={(e) => setNewQuote({ ...newQuote, quoteDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">有效期至</label>
                  <input
                    type="date"
                    value={newQuote.validUntil}
                    onChange={(e) => setNewQuote({ ...newQuote, validUntil: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* 报价明细 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-gray-700">报价明细</label>
                  <button
                    onClick={handleAddItem}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    + 添加明细项
                  </button>
                </div>

                <div className="border border-gray-200/50 rounded-xl overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gradient-to-r from-gray-50/80 to-white/80">
                      <tr>
                        <th className="text-left py-2 px-2 text-xs font-bold text-gray-700" style={{ width: '18%' }}>产品/服务名称</th>
                        <th className="text-left py-2 px-2 text-xs font-bold text-gray-700" style={{ width: '14%' }}>规格参数</th>
                        <th className="text-left py-2 px-2 text-xs font-bold text-gray-700" style={{ width: '8%' }}>数量</th>
                        <th className="text-left py-2 px-2 text-xs font-bold text-gray-700" style={{ width: '12%' }}>不含税单价</th>
                        <th className="text-left py-2 px-2 text-xs font-bold text-gray-700" style={{ width: '8%' }}>税率%</th>
                        <th className="text-left py-2 px-2 text-xs font-bold text-gray-700" style={{ width: '12%' }}>税额</th>
                        <th className="text-left py-2 px-2 text-xs font-bold text-gray-700" style={{ width: '14%' }}>含税金额</th>
                        <th style={{ width: '4%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteItems.map((item, index) => (
                        <tr key={item.id} className="border-t border-gray-100/50">
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm bg-gray-50/50 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              placeholder="产品/服务"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={item.spec || ''}
                              onChange={(e) => handleItemChange(index, 'spec', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm bg-gray-50/50 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              placeholder="规格"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1.5 text-sm bg-gray-50/50 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              min="1"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                              className="w-full px-2 py-1.5 text-sm bg-gray-50/50 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              value={item.taxRate ?? 6}
                              onChange={(e) => handleItemChange(index, 'taxRate', Number(e.target.value))}
                              className="w-full px-2 py-1.5 text-sm bg-gray-50/50 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-gray-700 text-sm text-right">
                            {formatCurrency(item.taxAmount || 0)}
                          </td>
                          <td className="py-1.5 px-2 text-gray-900 text-sm text-right font-medium">
                            {formatCurrency(item.totalWithTax || 0)}
                          </td>
                          <td className="py-1.5 px-2">
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                              disabled={quoteItems.length === 1}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 汇总 */}
              <div className="bg-gradient-to-br from-gray-50/80 to-white/80 rounded-xl p-5 space-y-2 border border-gray-100/50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">不含税小计：</span>
                  <span className="text-gray-800 font-medium">{formatCurrency(newQuote.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">税额合计：</span>
                  <span className="text-gray-800 font-medium">{formatCurrency(newQuote.taxAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200/50 pt-2">
                  <span className="text-gray-900">含税总金额：</span>
                  <span className="text-blue-600">{formatCurrency(newQuote.total || 0)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">备注</label>
                <textarea
                  value={newQuote.notes}
                  onChange={(e) => setNewQuote({ ...newQuote, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  placeholder="请输入备注信息..."
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200/50 p-6 rounded-b-2xl">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100/80 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveQuote}
                  disabled={!newQuote.projectId || quoteItems.every((item) => !item.description)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/30 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingQuote ? '保存修改' : '创建报价单'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 查看详情模态框 */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200/50 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedQuote.quoteNumber}</h3>
                  <p className="text-sm text-gray-500 mt-1">{getProjectName(selectedQuote.projectId)}</p>
                </div>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">报价日期</p>
                    <p className="text-gray-900 font-medium">{selectedQuote.quoteDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">有效期至</p>
                    <p className="text-gray-900 font-medium">{selectedQuote.validUntil}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">状态</p>
                    <span
                      className={clsx(
                        'inline-block px-3 py-1.5 rounded-full text-xs font-bold shadow-sm',
                        statusColors[selectedQuote.status]
                      )}
                    >
                      {statusLabels[selectedQuote.status]}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">报价明细</h4>
                <div className="border border-gray-200/50 rounded-xl overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gradient-to-r from-gray-50/80 to-white/80">
                      <tr>
                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-700">产品/服务名称</th>
                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-700">规格参数</th>
                        <th className="text-right py-2 px-3 text-xs font-bold text-gray-700">数量</th>
                        <th className="text-right py-2 px-3 text-xs font-bold text-gray-700">不含税单价</th>
                        <th className="text-right py-2 px-3 text-xs font-bold text-gray-700">税率</th>
                        <th className="text-right py-2 px-3 text-xs font-bold text-gray-700">税额</th>
                        <th className="text-right py-2 px-3 text-xs font-bold text-gray-700">含税金额</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuote.items.map((item) => (
                        <tr key={item.id} className="border-t border-gray-100/50">
                          <td className="py-3 px-3 text-gray-900">{item.description}</td>
                          <td className="py-3 px-3 text-gray-500 text-sm">{item.spec || '-'}</td>
                          <td className="py-3 px-3 text-gray-600 text-right">{item.quantity}</td>
                          <td className="py-3 px-3 text-gray-600 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-3 px-3 text-gray-600 text-right">{item.taxRate ?? 6}%</td>
                          <td className="py-3 px-3 text-gray-600 text-right">{formatCurrency(item.taxAmount || 0)}</td>
                          <td className="py-3 px-3 text-gray-900 text-right font-medium">{formatCurrency(item.totalWithTax || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50/80 to-white/80 rounded-xl p-5 space-y-2 border border-gray-100/50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">不含税小计：</span>
                  <span className="text-gray-800 font-medium">{formatCurrency(selectedQuote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">税额合计：</span>
                  <span className="text-gray-800 font-medium">{formatCurrency(selectedQuote.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200/50 pt-2">
                  <span className="text-gray-900">含税总金额：</span>
                  <span className="text-blue-600">{formatCurrency(selectedQuote.total)}</span>
                </div>
              </div>

              {selectedQuote.notes && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2">备注</h4>
                  <p className="text-gray-600">{selectedQuote.notes}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200/50 p-6 rounded-b-2xl">
              <div className="flex items-center justify-between">
                {/* 打印按钮组 */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePrintQuote(false)}
                    className="flex items-center gap-2 px-5 py-3 text-blue-600 bg-blue-50/80 hover:bg-blue-100 rounded-xl transition-all font-medium"
                  >
                    <Printer size={18} />
                    打印预览
                  </button>
                  <button
                    onClick={() => handlePrintQuote(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/20 transition-all font-medium"
                  >
                    <Printer size={18} />
                    直接打印
                  </button>
                </div>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="px-6 py-3 text-gray-700 bg-gray-100/80 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
