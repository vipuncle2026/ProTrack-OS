import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, Briefcase, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import { Service } from '../types';
import { servicesApi, projectsApi, contractsApi } from '../api';
import { Pagination } from '../components/common/Pagination';
import { clsx } from 'clsx';

export const ServicesPage: React.FC = () => {
  const { addService, updateService, deleteService } = useStore();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [contracts, setContracts] = useState<{ id: string; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<Partial<Service>>({
    projectId: '',
    contractId: '',
    serviceType: 'implementation',
    title: '',
    description: '',
    assignedName: '',
    status: 'pending',
    startDate: '',
    endDate: '',
    estimatedHours: 0,
    report: '',
    rating: 0,
  });

  const loadServices = useCallback(async (p: number, search: string) => {
    setLoading(true);
    try {
      const res = await servicesApi.list({ page: p, limit: 50, search });
      setServices(res.data.items);
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
    loadServices(1, '');
  }, [loadServices]);

  useEffect(() => {
    projectsApi.list({ page: 1, limit: 200 }).then((res) => {
      setProjects(res.data.items.map((p) => ({ id: p.id, name: p.name })));
    }).catch((err) => {
      console.error('加载项目列表失败:', err);
    });
    contractsApi.list({ page: 1, limit: 200 }).then((res) => {
      setContracts(res.data.items.map((c) => ({ id: c.id, name: c.name })));
    }).catch((err) => {
      console.error('加载合同列表失败:', err);
    });
  }, []);

  const handleSearch = () => {
    setPage(1);
    loadServices(1, searchTerm);
  };

  const handlePageChange = (p: number) => {
    loadServices(p, searchTerm);
  };

  // 客户端状态和类型筛选
  const filteredServices = services.filter((service) => {
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    const matchesType = typeFilter === 'all' || service.serviceType === typeFilter;
    return matchesStatus && matchesType;
  });

  const handleOpenCreateModal = () => {
    setEditingService(null);
    setNewService({
      projectId: '',
      contractId: '',
      serviceType: 'implementation',
      title: '',
      description: '',
      assignedName: '',
      status: 'pending',
      startDate: '',
      endDate: '',
      estimatedHours: 0,
      report: '',
      rating: 0,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setEditingService(service);
    setNewService({
      projectId: service.projectId || '',
      contractId: service.contractId || '',
      serviceType: service.serviceType,
      title: service.title,
      description: service.description,
      assignedName: service.assignedName,
      status: service.status,
      startDate: service.startDate,
      endDate: service.endDate,
      estimatedHours: service.estimatedHours,
      actualHours: service.actualHours,
      report: service.report,
      rating: service.rating,
    });
    setShowModal(true);
  };

  const handleSaveService = async () => {
    if (editingService) {
      const updatedService = {
        ...editingService,
        ...newService,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      await updateService(editingService.id, updatedService);
    } else {
      await addService({
        ...newService,
      });
    }
    setShowModal(false);
    setEditingService(null);
    loadServices(page, searchTerm);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个服务记录吗？')) {
      await deleteService(id);
      loadServices(page, searchTerm);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    delayed: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    delayed: '延期',
  };

  const typeLabels: Record<string, string> = {
    implementation: '实施',
    training: '培训',
    maintenance: '维护',
    support: '技术支持',
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || '未知项目';
  };

  const getContractName = (contractId: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    return contract?.name || '未知合同';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">服务管理</h3>
          <p className="text-gray-500 mt-1">管理项目实施、培训、维护等服务</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          添加服务记录
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-500">服务总数</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {services.filter((s) => s.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-500">进行中</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {services.filter((s) => s.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">已完成</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {services.filter((s) => s.status === 'delayed').length}
              </div>
              <div className="text-sm text-gray-500">延期</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="搜索服务标题或负责人..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="pending">待开始</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="delayed">延期</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部类型</option>
            <option value="implementation">实施</option>
            <option value="training">培训</option>
            <option value="maintenance">维护</option>
            <option value="support">技术支持</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={clsx(
                        'px-2.5 py-1 rounded-full text-xs font-medium',
                        statusColors[service.status]
                      )}
                    >
                      {statusLabels[service.status]}
                    </span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {typeLabels[service.serviceType]}
                    </span>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-2">{service.title}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">关联项目</span>
                      <span className="font-medium text-gray-900">{getProjectName(service.projectId || '')}</span>
                    </div>
                    {service.contractId && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">关联合同</span>
                        <span className="font-medium text-gray-900">{getContractName(service.contractId)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">负责人</span>
                      <span className="font-medium text-gray-900">{service.assignedName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">服务时间</span>
                      <span className="text-gray-900">
                        {service.startDate} ~ {service.endDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">预计工时</span>
                      <span className="text-gray-900">{service.estimatedHours}h</span>
                    </div>
                    {service.status === 'in_progress' && service.actualHours && service.estimatedHours > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">完成进度</span>
                        <span className="text-blue-600 font-medium">
                          {Math.round((service.actualHours / service.estimatedHours) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    <button className="flex-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      查看
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(service)}
                      className="flex-1 px-3 py-1.5 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />
            </div>

            {filteredServices.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无服务记录</p>
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
                {editingService ? '编辑服务记录' : '添加服务记录'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-500 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  服务标题 *
                </label>
                <input
                  type="text"
                  value={newService.title}
                  onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入服务标题"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    关联项目 *
                  </label>
                  <select
                    value={newService.projectId}
                    onChange={(e) =>
                      setNewService({ ...newService, projectId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    关联合同
                  </label>
                  <select
                    value={newService.contractId}
                    onChange={(e) =>
                      setNewService({ ...newService, contractId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择合同（可选）</option>
                    {contracts.map((contract) => (
                      <option key={contract.id} value={contract.id}>
                        {contract.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    服务类型
                  </label>
                  <select
                    value={newService.serviceType}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        serviceType: e.target.value as Service['serviceType'],
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="implementation">实施</option>
                    <option value="training">培训</option>
                    <option value="maintenance">维护</option>
                    <option value="support">技术支持</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    服务状态
                  </label>
                  <select
                    value={newService.status}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        status: e.target.value as Service['status'],
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">待开始</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">已完成</option>
                    <option value="delayed">延期</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  服务描述
                </label>
                <textarea
                  value={newService.description}
                  onChange={(e) =>
                    setNewService({ ...newService, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入服务描述..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  负责人 *
                </label>
                <input
                  type="text"
                  value={newService.assignedName}
                  onChange={(e) =>
                    setNewService({ ...newService, assignedName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入负责人姓名"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={newService.startDate}
                    onChange={(e) =>
                      setNewService({ ...newService, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={newService.endDate}
                    onChange={(e) =>
                      setNewService({ ...newService, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  预计工时
                </label>
                <input
                  type="number"
                  value={newService.estimatedHours}
                  onChange={(e) =>
                    setNewService({ ...newService, estimatedHours: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveService}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingService ? '保存修改' : '添加记录'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
