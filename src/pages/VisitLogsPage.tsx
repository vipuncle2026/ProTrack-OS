import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, X, MapPin, Calendar, User, Target } from 'lucide-react';
import { useStore } from '../store';
import { VisitLog, Contact, Project } from '../types';
import { visitLogsApi, contactsApi, projectsApi } from '../api';
import { Pagination } from '../components/common/Pagination';

export const VisitLogsPage: React.FC = () => {
  const { addVisitLog, updateVisitLog, deleteVisitLog } = useStore();
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState<VisitLog | null>(null);
  const [filterContact, setFilterContact] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });

  const [newLog, setNewLog] = useState<Partial<VisitLog>>({
    projectId: '',
    contactId: '',
    contactName: '',
    visitDate: new Date().toISOString().split('T')[0],
    location: '',
    purpose: '',
    content: '',
    result: '',
    nextAction: '',
    attachments: [],
    createdBy: '',
  });

  const loadVisitLogs = useCallback(async (p: number, search: string) => {
    setLoading(true);
    try {
      const res = await visitLogsApi.list({ page: p, limit: 50, search });
      setVisitLogs(res.data.items);
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
    loadVisitLogs(1, '');
  }, [loadVisitLogs]);

  useEffect(() => {
    contactsApi.list({ page: 1, limit: 200 }).then((res) => setContacts(res.data.items)).catch((err) => {
      console.error('加载联系人列表失败:', err);
    });
    projectsApi.list({ page: 1, limit: 200 }).then((res) => setProjects(res.data.items)).catch((err) => {
      console.error('加载项目列表失败:', err);
    });
  }, []);

  const handleSearch = () => {
    setPage(1);
    loadVisitLogs(1, searchTerm);
  };

  const handlePageChange = (p: number) => {
    loadVisitLogs(p, searchTerm);
  };

  const filteredLogs = visitLogs.filter((log) => {
    const matchesContact = filterContact ? log.contactId === filterContact : true;
    const matchesDateRange =
      (!filterDateRange.start || log.visitDate >= filterDateRange.start) &&
      (!filterDateRange.end || log.visitDate <= filterDateRange.end);
    return matchesContact && matchesDateRange;
  });

  const handleOpenModal = (log?: VisitLog) => {
    if (log) {
      setEditingLog(log);
      setNewLog(log);
    } else {
      setEditingLog(null);
      setNewLog({
        projectId: '',
        contactId: '',
        contactName: '',
        visitDate: new Date().toISOString().split('T')[0],
        location: '',
        purpose: '',
        content: '',
        result: '',
        nextAction: '',
        attachments: [],
        createdBy: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLog(null);
  };

  const handleContactChange = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    setNewLog({
      ...newLog,
      contactId,
      contactName: contact?.name || '',
    });
  };

  const handleSubmit = async () => {
    if (!newLog.contactId || !newLog.visitDate || !newLog.location || !newLog.purpose) {
      alert('请填写必填字段');
      return;
    }

    if (editingLog) {
      await updateVisitLog(editingLog.id, {
        ...newLog,
        updatedAt: new Date().toISOString().split('T')[0],
      } as Partial<VisitLog>);
    } else {
      await addVisitLog({
        ...newLog,
      });
    }
    handleCloseModal();
    loadVisitLogs(page, searchTerm);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条拜访记录吗？')) {
      await deleteVisitLog(id);
      loadVisitLogs(page, searchTerm);
    }
  };

  const getContactInfo = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? { name: contact.name, company: contact.company } : { name: '', company: '' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">拜访日志</h3>
          <p className="text-gray-500 mt-1">记录和管理客户拜访情况</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          添加拜访记录
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="搜索联系人、地点、目的或结果..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterContact}
              onChange={(e) => setFilterContact(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部联系人</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} - {contact.company}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filterDateRange.start}
              onChange={(e) => setFilterDateRange({ ...filterDateRange, start: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="开始日期"
            />
            <input
              type="date"
              value={filterDateRange.end}
              onChange={(e) => setFilterDateRange({ ...filterDateRange, end: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="结束日期"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无拜访记录</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const contactInfo = getContactInfo(log.contactId);
                  return (
                    <div
                      key={log.id}
                      className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            <Calendar size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-semibold text-gray-900">
                                {log.visitDate}
                              </span>
                              <span className="text-gray-300">|</span>
                              <span className="text-gray-700">{log.purpose}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User size={16} className="text-gray-500" />
                              <span>{contactInfo.name || log.contactName}</span>
                              <span className="text-gray-500">|</span>
                              <span>{contactInfo.company}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(log)}
                            className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-gray-500 mt-1" />
                          <div>
                            <div className="text-sm font-medium text-gray-700">拜访地点</div>
                            <div className="text-sm text-gray-600">{log.location}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Target size={16} className="text-gray-500 mt-1" />
                          <div>
                            <div className="text-sm font-medium text-gray-700">拜访目的</div>
                            <div className="text-sm text-gray-600">{log.purpose}</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">拜访内容</div>
                          <div className="text-sm text-gray-600 bg-white rounded-lg p-3">
                            {log.content}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">拜访结果</div>
                          <div className="text-sm text-gray-600 bg-green-50 rounded-lg p-3 border border-green-100">
                            {log.result}
                          </div>
                        </div>

                        {log.nextAction && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">后续行动</div>
                            <div className="text-sm text-blue-600 bg-blue-50 rounded-lg p-3 border border-blue-100">
                              {log.nextAction}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="pt-4">
              <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingLog ? '编辑拜访记录' : '添加拜访记录'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-500 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  关联项目
                </label>
                <select
                  value={newLog.projectId || ''}
                  onChange={(e) => setNewLog({ ...newLog, projectId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">不关联项目</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    联系人 *
                  </label>
                  <select
                    value={newLog.contactId}
                    onChange={(e) => handleContactChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择联系人</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} - {contact.company}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    拜访日期 *
                  </label>
                  <input
                    type="date"
                    value={newLog.visitDate}
                    onChange={(e) => setNewLog({ ...newLog, visitDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  拜访地点 *
                </label>
                <input
                  type="text"
                  value={newLog.location}
                  onChange={(e) => setNewLog({ ...newLog, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入拜访地点"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  拜访目的 *
                </label>
                <input
                  type="text"
                  value={newLog.purpose}
                  onChange={(e) => setNewLog({ ...newLog, purpose: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入拜访目的"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  拜访内容
                </label>
                <textarea
                  value={newLog.content}
                  onChange={(e) => setNewLog({ ...newLog, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请详细描述拜访内容..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  拜访结果
                </label>
                <textarea
                  value={newLog.result}
                  onChange={(e) => setNewLog({ ...newLog, result: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入拜访结果..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  后续行动
                </label>
                <input
                  type="text"
                  value={newLog.nextAction}
                  onChange={(e) => setNewLog({ ...newLog, nextAction: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入后续行动计划"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingLog ? '保存修改' : '添加记录'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
