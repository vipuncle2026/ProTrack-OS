import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Edit, Trash2, X, TrendingUp, TrendingDown, Clock, Upload, FileText, Download } from 'lucide-react';
import { useStore } from '../store';
import { Payment } from '../types';
import { paymentsApi, contractsApi, projectsApi } from '../api';
import { Pagination } from '../components/common/Pagination';
import { formatCurrency, formatFileSize } from '../utils/format';
import { clsx } from 'clsx';

interface PaymentTypePageProps {
  paymentType: 'income' | 'expense';
}

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB


function validateFile(file: File): string | null {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `不支持的文件格式（${ext}），仅支持 PDF / JPG / PNG`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `文件大小超过 20MB 限制`;
  }
  return null;
}

export const PaymentTypePage: React.FC<PaymentTypePageProps> = ({ paymentType }) => {
  const { addPayment, updatePayment, deletePayment } = useStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [contracts, setContracts] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const isIncome = paymentType === 'income';
  const typeLabel = isIncome ? '收款' : '付款';
  const accentColor = isIncome ? 'text-emerald-600' : 'text-orange-600';
  const accentBg = isIncome ? 'bg-emerald-50' : 'bg-orange-50';
  const buttonColor = isIncome
    ? 'bg-emerald-600 hover:bg-emerald-700'
    : 'bg-orange-600 hover:bg-orange-700';

  // 状态标签适配
  const statusLabels: Record<string, string> = isIncome
    ? { pending: '待收款', partial: '部分收款', paid: '已收清' }
    : { pending: '待付款', partial: '部分付款', paid: '已付清' };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    partial: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
  };

  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    paymentNumber: '',
    contractId: '',
    projectId: '',
    paymentType,
    paymentDate: '',
    amount: 0,
    paymentMethod: '银行转账',
    status: 'pending',
    invoiceNumber: '',
    notes: '',
  });

  // 文件上传相关
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDragOver, setFileDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPayments = useCallback(async (p: number, search: string) => {
    setLoading(true);
    try {
      const res = await paymentsApi.list({ page: p, limit: 50, search });
      // 按类型过滤
      const filtered = res.data.items.filter(pay => pay.paymentType === paymentType);
      setPayments(filtered);
      setTotal(filtered.length);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [paymentType]);

  useEffect(() => {
    loadPayments(1, '');
  }, [loadPayments]);

  useEffect(() => {
    contractsApi.list({ page: 1, limit: 200 }).then((res) => {
      setContracts(res.data.items.map((c) => ({ id: c.id, name: c.name })));
    }).catch((err) => {
      console.error('加载合同列表失败:', err);
    });
    projectsApi.list({ page: 1, limit: 200 }).then((res) => {
      setProjects(res.data.items.map((p) => ({ id: p.id, name: p.name })));
    }).catch((err) => {
      console.error('加载项目列表失败:', err);
    });
  }, []);

  const handleSearch = () => {
    setPage(1);
    loadPayments(1, searchTerm);
  };

  const handlePageChange = (p: number) => {
    loadPayments(p, searchTerm);
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesYear = yearFilter === 'all' || (payment.paymentDate && payment.paymentDate.startsWith(yearFilter));
    return matchesStatus && matchesYear;
  });

  const availableYears = Array.from(
    new Set(
      payments
        .map(p => p.paymentDate?.substring(0, 4))
        .filter((y): y is string => !!y)
    )
  ).sort((a, b) => b.localeCompare(a));

  const getContractName = (contractId: string) => {
    const c = contracts.find((c) => c.id === contractId);
    return c?.name || '-';
  };

  const getProjectName = (projectId: string) => {
    const p = projects.find((p) => p.id === projectId);
    return p?.name || '-';
  };

  const handleOpenCreateModal = () => {
    setEditingPayment(null);
    setSelectedFile(null);
    setFileError(null);
    setNewPayment({
      paymentNumber: '',
      contractId: '',
      projectId: '',
      paymentType,
      paymentDate: '',
      amount: 0,
      paymentMethod: '银行转账',
      status: 'pending',
      invoiceNumber: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (payment: Payment) => {
    setEditingPayment(payment);
    setSelectedFile(null);
    setFileError(null);
    setNewPayment({
      paymentNumber: payment.paymentNumber,
      contractId: payment.contractId,
      projectId: payment.projectId || '',
      paymentType,
      paymentDate: payment.paymentDate,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      invoiceNumber: payment.invoiceNumber,
      notes: payment.notes,
    });
    setShowModal(true);
  };

  // ─── 文件选择 ────────────────────────────────────────────────
  const handleFileSelect = (file: File) => {
    const err = validateFile(file);
    if (err) {
      setFileError(err);
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFileDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-500" />;
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return <FileText className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const handleSavePayment = async () => {
    try {
      let paymentId: string;
      if (editingPayment) {
        const updated = {
          ...editingPayment,
          ...newPayment,
          paymentType,
          updatedAt: new Date().toISOString().split('T')[0],
        };
        await updatePayment(editingPayment.id, updated);
        paymentId = editingPayment.id;
      } else {
        const result = await addPayment({ ...newPayment, paymentType });
        paymentId = result.id || '';
      }

      // 上传发票文件
      if (selectedFile && paymentId) {
        try {
          await paymentsApi.upload(paymentId, selectedFile);
        } catch (uploadErr: any) {
          const msg = uploadErr?.message || '文件上传失败';
          alert(`款项已创建，但发票上传失败：${msg}`);
        }
      }

      setShowModal(false);
      setEditingPayment(null);
      setSelectedFile(null);
      loadPayments(page, searchTerm);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d: any) => d.msg).join('；')
        : detail || err?.message || '保存失败，请重试';
      alert(`保存失败：${msg}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`确定要删除这条${typeLabel}记录吗？`)) {
      await deletePayment(id);
      loadPayments(page, searchTerm);
    }
  };

  // 统计
  const paidAmount = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{typeLabel}管理</h3>
          <p className="text-gray-500 mt-1">
            {isIncome ? '管理销售回款记录，跟踪客户付款情况' : '管理对外付款记录，跟踪供应商付款情况'}
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className={clsx('flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors', buttonColor)}
        >
          <Plus size={20} />
          添加{typeLabel}记录
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className={clsx('p-2 rounded-lg', accentBg)}>
              {isIncome ? <TrendingUp className={clsx('w-5 h-5', accentColor)} /> : <TrendingDown className={clsx('w-5 h-5', accentColor)} />}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(paidAmount)}
              </div>
              <div className="text-sm text-gray-500">{isIncome ? '已收款' : '已付款'}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(pendingAmount)}
              </div>
              <div className="text-sm text-gray-500">{isIncome ? '待收款' : '待付款'}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div>
            <div className="text-2xl font-bold text-gray-900">{payments.length}</div>
            <div className="text-sm text-gray-500">{typeLabel}记录数</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder={`搜索${typeLabel}单号...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部年份</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}年</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="pending">{statusLabels.pending}</option>
            <option value="partial">{statusLabels.partial}</option>
            <option value="paid">{statusLabels.paid}</option>
          </select>
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
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{typeLabel}单号</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{typeLabel}日期</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">关联项目</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">关联合同</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">金额</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{typeLabel}方式</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">发票号</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">发票</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-gray-900">{payment.paymentNumber}</td>
                      <td className="py-4 px-4 text-gray-600">{payment.paymentDate}</td>
                      <td className="py-4 px-4 text-gray-600">{getProjectName(payment.projectId || '')}</td>
                      <td className="py-4 px-4 text-gray-600">{getContractName(payment.contractId)}</td>
                      <td className="py-4 px-4 font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-4 px-4 text-gray-600">{payment.paymentMethod}</td>
                      <td className="py-4 px-4 text-gray-600">{payment.invoiceNumber || '-'}</td>
                      <td className="py-4 px-4">
                        {payment.invoiceFile ? (
                          <a
                            href={paymentsApi.getFileUrl(payment.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm"
                            title={payment.invoiceFile}
                          >
                            {getFileIcon(payment.invoiceFile)}
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-gray-300 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', statusColors[payment.status])}>
                          {statusLabels[payment.status]}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(payment)}
                            className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
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

            <div className="pt-4">
              <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />
            </div>

            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无{typeLabel}记录</p>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingPayment ? `编辑${typeLabel}记录` : `添加${typeLabel}记录`}
              </h3>
              <button onClick={() => { setShowModal(false); setSelectedFile(null); }} className="p-2 text-gray-500 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{typeLabel}单号 *</label>
                <input
                  type="text"
                  value={newPayment.paymentNumber}
                  onChange={(e) => setNewPayment({ ...newPayment, paymentNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`${isIncome ? 'RCV' : 'PAY'}-2024-XXX`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">关联项目</label>
                  <select
                    value={newPayment.projectId}
                    onChange={(e) => setNewPayment({ ...newPayment, projectId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择项目</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">关联合同</label>
                  <select
                    value={newPayment.contractId}
                    onChange={(e) => setNewPayment({ ...newPayment, contractId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择合同</option>
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{typeLabel}日期 *</label>
                  <input
                    type="date"
                    value={newPayment.paymentDate}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">金额 *</label>
                  <input
                    type="number"
                    value={newPayment.amount || ''}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入金额"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{typeLabel}方式</label>
                  <select
                    value={newPayment.paymentMethod}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="银行转账">银行转账</option>
                    <option value="支票">支票</option>
                    <option value="现金">现金</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                  <select
                    value={newPayment.status}
                    onChange={(e) => setNewPayment({ ...newPayment, status: e.target.value as Payment['status'] })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">{statusLabels.pending}</option>
                    <option value="partial">{statusLabels.partial}</option>
                    <option value="paid">{statusLabels.paid}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">发票号</label>
                  <input
                    type="text"
                    value={newPayment.invoiceNumber}
                    onChange={(e) => setNewPayment({ ...newPayment, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="INV-2024-XXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                <textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入备注信息..."
                />
              </div>

              {/* 发票文件上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  发票文件 <span className="text-gray-500 font-normal">(可选)</span>
                </label>
                {editingPayment && editingPayment.invoiceFile && !selectedFile && (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      {getFileIcon(editingPayment.invoiceFile)}
                      <span className="font-medium">{editingPayment.invoiceFile}</span>
                    </div>
                    <button onClick={handleRemoveFile} className="text-blue-400 hover:text-red-500 transition-colors" title="清除文件">
                      <X size={16} />
                    </button>
                  </div>
                )}
                {(!editingPayment || !editingPayment.invoiceFile || selectedFile) && (
                  <>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setFileDragOver(true); }}
                      onDragLeave={() => setFileDragOver(false)}
                      onDrop={handleFileDrop}
                      className={clsx(
                        'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                        fileDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                      )}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mx-auto mb-2 text-gray-500" size={28} />
                      <p className="text-sm text-gray-500">
                        拖拽文件到此处，或<span className="text-blue-600">点击选择</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PDF / JPG / PNG · 最大 20MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    {selectedFile && (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          {getFileIcon(selectedFile.name)}
                          <span className="font-medium">{selectedFile.name}</span>
                          <span className="text-green-500 text-xs">({formatFileSize(selectedFile.size)})</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                          className="text-green-400 hover:text-red-500 transition-colors"
                          title="移除文件"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => { setShowModal(false); setSelectedFile(null); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSavePayment}
                className={clsx('px-4 py-2 text-white rounded-lg transition-colors', buttonColor)}
              >
                {editingPayment ? '保存修改' : '添加记录'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
