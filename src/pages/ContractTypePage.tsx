import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Eye, Edit, Trash2, X, Upload, FileText, Download } from 'lucide-react';
import { useStore } from '../store';
import { Contract, Project } from '../types';
import { contractsApi, projectsApi } from '../api';
import { Pagination } from '../components/common/Pagination';
import { clsx } from 'clsx';
import { formatCurrency, formatFileSize } from '../utils/format';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
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

interface ContractTypePageProps {
  contractType: 'sales' | 'purchase';
}

export const ContractTypePage: React.FC<ContractTypePageProps> = ({ contractType }) => {
  const { addContract, updateContract, deleteContract } = useStore();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);

  // 文件上传相关
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDragOver, setFileDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSales = contractType === 'sales';
  const typeLabel = isSales ? '销售合同' : '采购合同';
  const typeColor = isSales ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700';

  const [newContract, setNewContract] = useState<Partial<Contract>>({
    contractNumber: '',
    projectId: '',
    name: '',
    contractType,
    status: 'draft',
    amount: 0,
    paymentMethod: '一次性付款',
    signDate: '',
    startDate: '',
    endDate: '',
    contractFile: '',
    terms: '',
  });

  const loadContracts = useCallback(async (p: number, search: string) => {
    setLoading(true);
    try {
      const res = await contractsApi.list({ page: p, limit: 50, search });
      // 按合同类型过滤
      const filtered = res.data.items.filter(c => c.contractType === contractType);
      setContracts(filtered);
      setTotal(filtered.length);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [contractType]);

  useEffect(() => {
    loadContracts(1, '');
  }, [loadContracts]);

  useEffect(() => {
    projectsApi.list({ page: 1, limit: 200 }).then((res) => {
      setProjects(res.data.items);
    }).catch((err) => {
      console.error('加载项目列表失败:', err);
    });
  }, []);

  const handleSearch = () => {
    setPage(1);
    loadContracts(1, searchTerm);
  };

  const handlePageChange = (p: number) => {
    loadContracts(p, searchTerm);
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || '-';
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesProject = projectFilter === 'all' || contract.projectId === projectFilter;
    const matchesYear = yearFilter === 'all' || (contract.signDate && contract.signDate.startsWith(yearFilter));
    return matchesStatus && matchesProject && matchesYear;
  });

  const availableYears = Array.from(
    new Set(
      contracts
        .map(c => c.signDate?.substring(0, 4))
        .filter((y): y is string => !!y)
    )
  ).sort((a, b) => b.localeCompare(a));

  const resetForm = () => {
    setEditingContract(null);
    setSelectedFile(null);
    setFileError(null);
    setSaveError(null);
    setFileDragOver(false);
  };

  const handleOpenCreateModal = () => {
    if (projects.length === 0) {
      projectsApi.list({ page: 1, limit: 200 }).then((res) => {
        setProjects(res.data.items);
      }).catch((err) => {
        console.error('加载项目列表失败:', err);
      });
    }
    resetForm();
    setNewContract({
      contractNumber: '',
      projectId: '',
      name: '',
      contractType,
      status: 'draft',
      amount: 0,
      paymentMethod: '一次性付款',
      signDate: '',
      startDate: '',
      endDate: '',
      contractFile: '',
      terms: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (contract: Contract) => {
    if (projects.length === 0) {
      projectsApi.list({ page: 1, limit: 200 }).then((res) => {
        setProjects(res.data.items);
      }).catch((err) => {
        console.error('加载项目列表失败:', err);
      });
    }
    resetForm();
    setEditingContract(contract);
    setNewContract({
      contractNumber: contract.contractNumber,
      projectId: contract.projectId,
      name: contract.name,
      contractType: contract.contractType,
      status: contract.status,
      amount: contract.amount,
      paymentMethod: contract.paymentMethod,
      signDate: contract.signDate,
      startDate: contract.startDate,
      endDate: contract.endDate,
      contractFile: contract.contractFile,
      terms: contract.terms,
    });
    setShowModal(true);
  };

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

  const handleSaveContract = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      let contractId: string;

      if (editingContract) {
        const updatedContract = {
          ...editingContract,
          ...newContract,
          updatedAt: new Date().toISOString().split('T')[0],
        };
        await updateContract(editingContract.id, updatedContract);
        contractId = editingContract.id;
      } else {
        const result = await addContract({
          contractNumber: newContract.contractNumber || `CT-${Date.now()}`,
          projectId: newContract.projectId || '',
          name: newContract.name || '',
          contractType,
          status: (newContract.status as Contract['status']) || 'draft',
          amount: newContract.amount || 0,
          paymentMethod: newContract.paymentMethod || '一次性付款',
          signDate: newContract.signDate || '',
          startDate: newContract.startDate || '',
          endDate: newContract.endDate || '',
          contractFile: '',
          terms: newContract.terms || '',
        });
        contractId = result.id || '';
      }

      if (selectedFile && contractId) {
        try {
          await contractsApi.upload(contractId, selectedFile);
        } catch (uploadErr: unknown) {
          const msg = uploadErr instanceof Error ? uploadErr.message : '文件上传失败';
          setSaveError(`合同已创建，但文件上传失败：${msg}`);
          setIsSaving(false);
          return;
        }
      }

      setShowModal(false);
      resetForm();
      loadContracts(page, searchTerm);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存失败，请重试';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`确定要删除这个${typeLabel}吗？`)) {
      await deleteContract(id);
      loadContracts(page, searchTerm);
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    reviewing: 'bg-yellow-100 text-yellow-700',
    signing: 'bg-blue-100 text-blue-700',
    executing: 'bg-green-100 text-green-700',
    completed: 'bg-emerald-100 text-emerald-700',
    terminated: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    reviewing: '审批中',
    signing: '已签订',
    executing: '执行中',
    completed: '已完成',
    terminated: '已终止',
  };

  const paymentMethodOptions = [
    '一次性付款',
    '分阶段付款',
    '按月付款',
    '预付30%尾款70%',
    '其他',
  ];


  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-500" />;
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return <FileText className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  // 统计数据
  const totalAmount = contracts.reduce((sum, c) => sum + c.amount, 0);
  const signedCount = contracts.filter(c => c.status === 'signed' || c.status === 'executing' || c.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{typeLabel}</h3>
          <p className="text-gray-500 mt-1">
            {isSales ? '管理销售合同，跟踪客户签约和收款情况' : '管理采购合同，跟踪供应商采购和付款情况'}
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className={clsx('flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors', typeColor)}
        >
          <Plus size={20} />
          新建{typeLabel}
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">合同总数</div>
          <div className="text-2xl font-bold text-gray-900">{contracts.length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">{isSales ? '销售总额' : '采购总额'}</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalAmount)}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">已签订/执行</div>
          <div className="text-2xl font-bold text-gray-900">{signedCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder={`搜索${typeLabel}名称或编号...`}
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
            <option value="draft">草稿</option>
            <option value="reviewing">审批中</option>
            <option value="signing">已签订</option>
            <option value="executing">执行中</option>
            <option value="completed">已完成</option>
            <option value="terminated">已终止</option>
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部项目</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
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
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">合同编号</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">合同名称</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">关联项目</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">合同金额</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">付款方式</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">签订日期</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">附件</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4 text-gray-600 font-mono text-sm">{contract.contractNumber}</td>
                      <td className="py-4 px-4 font-medium text-gray-900">{contract.name}</td>
                      <td className="py-4 px-4 text-gray-600">{getProjectName(contract.projectId)}</td>
                      <td className="py-4 px-4 text-gray-900 font-medium">{formatCurrency(contract.amount)}</td>
                      <td className="py-4 px-4 text-gray-600">{contract.paymentMethod}</td>
                      <td className="py-4 px-4 text-gray-600">{contract.signDate || '-'}</td>
                      <td className="py-4 px-4">
                        <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', statusColors[contract.status])}>
                          {statusLabels[contract.status]}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {contract.contractFile ? (
                          <a
                            href={contractsApi.getFileUrl(contract.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm"
                            title={contract.contractFile}
                          >
                            {getFileIcon(contract.contractFile)}
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-gray-300 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingContract(contract)}
                            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                            title="查看详情"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(contract)}
                            className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(contract.id)}
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

            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />

            {filteredContracts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无{typeLabel}数据</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 新建/编辑合同模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingContract ? `编辑${typeLabel}` : `新建${typeLabel}`}
              </h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 text-gray-500 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {saveError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">合同编号 *</label>
                  <input
                    type="text"
                    value={newContract.contractNumber}
                    onChange={(e) => setNewContract({ ...newContract, contractNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CT-2024-XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">关联项目 *</label>
                  <select
                    value={newContract.projectId}
                    onChange={(e) => setNewContract({ ...newContract, projectId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择项目</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">合同名称 *</label>
                <input
                  type="text"
                  value={newContract.name}
                  onChange={(e) => setNewContract({ ...newContract, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入合同名称"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">合同金额 (元)</label>
                  <input
                    type="number"
                    value={newContract.amount || ''}
                    onChange={(e) => setNewContract({ ...newContract, amount: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入金额"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">付款方式</label>
                  <select
                    value={newContract.paymentMethod}
                    onChange={(e) => setNewContract({ ...newContract, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {paymentMethodOptions.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 合同状态 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">合同状态</label>
                <select
                  value={newContract.status}
                  onChange={(e) => setNewContract({ ...newContract, status: e.target.value as Contract['status'] })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">签订日期</label>
                  <input
                    type="date"
                    value={newContract.signDate}
                    onChange={(e) => setNewContract({ ...newContract, signDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
                  <input
                    type="date"
                    value={newContract.startDate}
                    onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
                  <input
                    type="date"
                    value={newContract.endDate}
                    onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 文件上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  合同文件 <span className="text-gray-500 font-normal">(可选)</span>
                </label>
                {editingContract && editingContract.contractFile && !selectedFile && (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      {getFileIcon(editingContract.contractFile)}
                      <span className="font-medium">{editingContract.contractFile}</span>
                    </div>
                    <button onClick={handleRemoveFile} className="text-blue-400 hover:text-red-500 transition-colors" title="清除文件">
                      <X size={16} />
                    </button>
                  </div>
                )}
                {(!editingContract || !editingContract.contractFile || selectedFile) && (
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">合同条款</label>
                <textarea
                  value={newContract.terms}
                  onChange={(e) => setNewContract({ ...newContract, terms: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入合同条款..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveContract}
                disabled={isSaving}
                className={clsx(
                  'px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2',
                  typeColor
                )}
              >
                {isSaving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                {isSaving ? '保存中...' : editingContract ? '保存修改' : `创建${typeLabel}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 查看合同详情弹窗 */}
      {viewingContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setViewingContract(null)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold text-gray-900">合同详情</h3>
              <button
                onClick={() => setViewingContract(null)}
                className="p-2 text-gray-500 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 基本信息 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">基本信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">合同编号</span>
                    <p className="text-sm font-mono text-gray-900 mt-1">{viewingContract.contractNumber || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">合同名称</span>
                    <p className="text-sm font-medium text-gray-900 mt-1">{viewingContract.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">合同类型</span>
                    <p className="text-sm text-gray-900 mt-1">{viewingContract.contractType === 'sales' ? '销售合同' : '采购合同'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">关联项目</span>
                    <p className="text-sm text-gray-900 mt-1">{getProjectName(viewingContract.projectId)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">合同状态</span>
                    <p className="mt-1">
                      <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[viewingContract.status])}>
                        {statusLabels[viewingContract.status] || viewingContract.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 金额与付款 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">金额与付款</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">合同金额</span>
                    <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(viewingContract.amount)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">付款方式</span>
                    <p className="text-sm text-gray-900 mt-1">{viewingContract.paymentMethod || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 日期信息 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">日期信息</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">签订日期</span>
                    <p className="text-sm text-gray-900 mt-1">{viewingContract.signDate || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">开始日期</span>
                    <p className="text-sm text-gray-900 mt-1">{viewingContract.startDate || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">结束日期</span>
                    <p className="text-sm text-gray-900 mt-1">{viewingContract.endDate || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 附件 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">合同附件</h4>
                {viewingContract.contractFile ? (
                  <a
                    href={contractsApi.getFileUrl(viewingContract.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    {getFileIcon(viewingContract.contractFile)}
                    <span>{viewingContract.contractFile}</span>
                    <Download className="w-4 h-4" />
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">无附件</p>
                )}
              </div>

              {/* 合同条款 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">合同条款</h4>
                {viewingContract.terms ? (
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {viewingContract.terms}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">暂无条款信息</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
