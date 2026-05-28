import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, Mail, Phone, Building } from 'lucide-react';
import { useStore } from '../store';
import { Contact, Project } from '../types';
import { contactsApi, projectsApi } from '../api';
import { Pagination } from '../components/common/Pagination';

export const ContactsPage: React.FC = () => {
  const { addContact, updateContact, deleteContact } = useStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState<Partial<Contact>>({
    name: '',
    company: '',
    position: '',
    department: '',
    phone: '',
    mobile: '',
    email: '',
    role: 'other',
    projectId: '',
    isPrimary: false,
    notes: '',
  });

  const loadContacts = useCallback(async (p: number, search: string) => {
    setLoading(true);
    try {
      const res = await contactsApi.list({ page: p, limit: 12, search });
      setContacts(res.data.items);
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
    loadContacts(1, '');
  }, [loadContacts]);

  useEffect(() => {
    projectsApi.list({ page: 1, limit: 200 }).then((res) => setProjects(res.data.items)).catch((err) => {
      console.error('加载项目列表失败:', err);
    });
  }, []);

  const handleSearch = () => {
    setPage(1);
    loadContacts(1, searchTerm);
  };

  const handlePageChange = (p: number) => {
    loadContacts(p, searchTerm);
  };

  const handleOpenCreateModal = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      company: '',
      position: '',
      department: '',
      phone: '',
      mobile: '',
      email: '',
      role: 'other',
      projectId: '',
      isPrimary: false,
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      company: contact.company,
      position: contact.position,
      department: contact.department,
      phone: contact.phone,
      mobile: contact.mobile,
      email: contact.email,
      role: contact.role,
      projectId: contact.projectId || '',
      isPrimary: contact.isPrimary,
      notes: contact.notes,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editingContact) {
      await updateContact(editingContact.id, {
        ...formData,
        updatedAt: new Date().toISOString().split('T')[0],
      });
    } else {
      await addContact(formData);
    }
    setShowModal(false);
    setEditingContact(null);
    loadContacts(page, searchTerm);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个联系人吗？')) {
      await deleteContact(id);
      loadContacts(page, searchTerm);
    }
  };

  const roleLabels: Record<string, string> = {
    decision_maker: '决策人',
    technical: '技术对接',
    finance: '财务',
    other: '其他',
  };

  const roleColors: Record<string, string> = {
    decision_maker: 'bg-purple-100 text-purple-700',
    technical: 'bg-blue-100 text-blue-700',
    finance: 'bg-green-100 text-green-700',
    other: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">联系人管理</h3>
          <p className="text-gray-500 mt-1">管理所有客户联系人和信息 · 共 {total} 人</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          添加联系人
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="搜索联系人姓名、公司或邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {contact.name.charAt(0)}
                      </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {contact.name}
                        {contact.isPrimary && (
                          <span className="ml-1.5 text-yellow-500 text-xs" title="主联系人">★</span>
                        )}
                      </div>
                        <div className="text-sm text-gray-500">{contact.position}</div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[contact.role]}`}
                    >
                      {roleLabels[contact.role]}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building size={16} className="text-gray-500" />
                      <span>{contact.company}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={16} className="text-gray-500" />
                      <span>{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={16} className="text-gray-500" />
                      <span>{contact.mobile || contact.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleOpenEditModal(contact)}
                      className="flex-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="flex-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />

            {contacts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无联系人数据</p>
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
                {editingContact ? '编辑联系人' : '添加联系人'}
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
                  姓名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入联系人姓名"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    公司/单位名称
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入公司/单位名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    职位
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入职位"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    部门
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入部门"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    联系人角色
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as Contact['role'] })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="decision_maker">决策人</option>
                    <option value="technical">技术对接</option>
                    <option value="finance">财务</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  关联项目
                </label>
                <select
                  value={formData.projectId || ''}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={formData.isPrimary || false}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPrimary" className="text-sm font-medium text-gray-700 cursor-pointer">
                  设为主联系人
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    手机号码
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入手机号码"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    电子邮箱
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入电子邮箱"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入备注信息..."
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
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingContact ? '保存修改' : '添加联系人'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
