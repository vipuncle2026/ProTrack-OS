import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, X, Filter, AlertCircle, Upload, FileText, Download } from 'lucide-react';
import { useStore } from '../store';
import { Project } from '../types';
import { projectsApi } from '../api';
import { Pagination } from '../components/common/Pagination';
import { clsx } from 'clsx';
import { formatCurrency, formatFileSize } from '../utils/format';

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

export const ProjectsPage: React.FC = () => {
  const { addProject, updateProject, deleteProject } = useStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    code: '',
    type: 'software',
    status: 'potential',
    description: '',
    budget: 0,
    ownerName: '',
    startDate: '',
    endDate: '',
  });

  const [error, setError] = useState<string | null>(null);

  // 文件上传相关
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDragOver, setFileDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProjects = useCallback(async (p: number, search: string) => {
    setLoading(true);
    try {
      const res = await projectsApi.list({ page: p, limit: 50, search });
      setProjects(res.data.items);
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
    loadProjects(1, '');
  }, [loadProjects]);

  const handleSearch = () => {
    setPage(1);
    loadProjects(1, searchTerm);
  };

  const handlePageChange = (p: number) => {
    loadProjects(p, searchTerm);
  };

  // 客户端状态筛选
  const filteredProjects = projects.filter((project) => {
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesStatus;
  });

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setSelectedFile(null);
    setFileError(null);
    setFormData({
      name: '',
      code: '',
      type: 'software',
      status: 'potential',
      description: '',
      budget: 0,
      ownerName: '',
      startDate: '',
      endDate: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (project: Project) => {
    setEditingProject(project);
    setSelectedFile(null);
    setFileError(null);
    setFormData({
      name: project.name,
      code: project.code,
      type: project.type,
      status: project.status,
      description: project.description,
      budget: project.budget,
      ownerName: project.ownerName,
      startDate: project.startDate,
      endDate: project.endDate,
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

  const handleSave = async () => {
    setError(null);
    try {
      let projectId: string;
      if (editingProject) {
        await updateProject(editingProject.id, {
          ...formData,
          updatedAt: new Date().toISOString().split('T')[0],
        });
        projectId = editingProject.id;
      } else {
        const result = await addProject({
          ...formData,
          actualCost: 0,
        } as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>);
        projectId = result.id || '';
      }

      // 上传项目文件
      if (selectedFile && projectId) {
        try {
          await projectsApi.upload(projectId, selectedFile);
        } catch (uploadErr: unknown) {
          const msg = uploadErr instanceof Error ? uploadErr.message : '文件上传失败';
          setError(`项目已创建，但文件上传失败：${msg}`);
          return;
        }
      }

      setShowModal(false);
      setEditingProject(null);
      setSelectedFile(null);
      loadProjects(page, searchTerm);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '操作失败，请重试';
      setError(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个项目吗？')) {
      await deleteProject(id);
      loadProjects(page, searchTerm);
    }
  };

  const statusConfig: Record<string, { label: string; gradient: string }> = {
    potential: { label: '潜在客户', gradient: 'from-gray-100 to-gray-200 text-gray-700' },
    quoting: { label: '报价中', gradient: 'from-yellow-100 to-amber-100 text-yellow-700' },
    contracted: { label: '已签约', gradient: 'from-blue-100 to-indigo-100 text-blue-700' },
    in_progress: { label: '进行中', gradient: 'from-green-100 to-emerald-100 text-green-700' },
    completed: { label: '已完成', gradient: 'from-emerald-100 to-teal-100 text-emerald-700' },
    terminated: { label: '已终止', gradient: 'from-red-100 to-rose-100 text-red-700' },
  };

  const typeLabels: Record<string, string> = {
    software: '软件开发',
    consulting: '咨询服务',
    integration: '系统集成',
    other: '其他',
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">项目列表</h3>
            <p className="text-sm text-gray-500 mt-1">共 {total} 个项目</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">新建项目</span>
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="搜索项目名称或编号..."
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
              <option value="potential">潜在客户</option>
              <option value="quoting">报价中</option>
              <option value="contracted">已签约</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="terminated">已终止</option>
            </select>
          </div>
        </div>
      </div>

      {/* 项目列表 */}
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
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">项目信息</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">项目类型</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">项目状态</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">项目预算</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">负责人</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">项目文件</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200 group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300">
                            {project.name.charAt(0)}
                          </div>
                          <div>
                            <Link
                              to={`/projects/${project.id}`}
                              className="font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                            >
                              {project.name}
                            </Link>
                            <div className="text-sm text-gray-500 font-mono mt-0.5">{project.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1.5 bg-gray-100/80 text-gray-700 rounded-lg text-sm font-medium">
                          {typeLabels[project.type]}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={clsx(
                            'px-4 py-1.5 rounded-full text-xs font-bold shadow-sm',
                            statusConfig[project.status]?.gradient
                          )}
                        >
                          {statusConfig[project.status]?.label || project.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-lg font-bold text-gray-800">
                          {formatCurrency(project.budget)}
                          <span className="text-sm font-normal text-gray-500 ml-1">万</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {project.ownerName.charAt(0)}
                          </div>
                          <span className="text-gray-700 font-medium">{project.ownerName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {project.projectFile ? (
                          <a
                            href={projectsApi.getFileUrl(project.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm"
                            title={project.projectFile}
                          >
                            {getFileIcon(project.projectFile)}
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-gray-300 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/projects/${project.id}`}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={() => handleOpenEditModal(project)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
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

            {filteredProjects.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-500" />
                </div>
                <p className="text-gray-500 text-lg font-medium">暂无项目数据</p>
                <p className="text-gray-500 text-sm mt-2">点击上方按钮创建第一个项目</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200/50 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
                  <h3 className="text-2xl font-bold text-gray-800">
                    {editingProject ? '编辑项目' : '新建项目'}
                  </h3>
                </div>
                <button
                  onClick={() => { setShowModal(false); setSelectedFile(null); }}
                  className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50/80 border border-red-200/50 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">项目名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="请输入项目名称"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">项目编号 *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="PRJ-2024-XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">项目类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Project['type'] })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="software">软件开发</option>
                    <option value="consulting">咨询服务</option>
                    <option value="integration">系统集成</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">项目状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="potential">潜在客户</option>
                    <option value="quoting">报价中</option>
                    <option value="contracted">已签约</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">已完成</option>
                    <option value="terminated">已终止</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">项目预算</label>
                  <input
                    type="number"
                    value={formData.budget || ''}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="请输入预算"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">项目负责人</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="请输入负责人姓名"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">开始日期</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">结束日期</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">项目描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  placeholder="请输入项目描述..."
                />
              </div>

              {/* 项目文件上传 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  项目文件 <span className="text-gray-500 font-normal">(可选)</span>
                </label>
                {editingProject && editingProject.projectFile && !selectedFile && (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      {getFileIcon(editingProject.projectFile)}
                      <span className="font-medium">{editingProject.projectFile}</span>
                    </div>
                    <button onClick={handleRemoveFile} className="text-blue-400 hover:text-red-500 transition-colors" title="清除文件">
                      <X size={16} />
                    </button>
                  </div>
                )}
                {(!editingProject || !editingProject.projectFile || selectedFile) && (
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

            <div className="sticky bottom-0 bg-white border-t border-gray-200/50 p-6 rounded-b-2xl">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => { setShowModal(false); setSelectedFile(null); }}
                  className="px-6 py-3 text-gray-700 bg-gray-100/80 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/30 transition-all duration-300 font-medium"
                >
                  {editingProject ? '保存修改' : '创建项目'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
