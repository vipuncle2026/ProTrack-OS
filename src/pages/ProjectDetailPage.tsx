import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, FileText, CreditCard, Briefcase, Edit, FileSignature, ShoppingCart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useStore } from '../store';
import { formatCurrency } from '../utils/format';
import { projectsApi, contactsApi, visitLogsApi, quotesApi, contractsApi, paymentsApi, servicesApi } from '../api';
import type { Project, Contact, VisitLog, Quote, Contract, Payment, Service } from '../types';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // 先加载项目主体
    projectsApi.get(id)
      .then((projRes) => {
        setProject(projRes.data);
      })
      .catch(() => {
        setProject(null);
      })
      .finally(() => setLoading(false));

    // 并行加载关联数据，按项目过滤
    const listOpts = { page: 1, limit: 200, projectId: id };
    Promise.all([
      contactsApi.list(listOpts),
      visitLogsApi.list(listOpts),
      quotesApi.list(listOpts),
      contractsApi.list(listOpts),
      paymentsApi.list(listOpts),
      servicesApi.list(listOpts),
    ])
      .then(([c, v, q, ct, p, s]) => {
        setContacts(c.data.items);
        setVisitLogs(v.data.items);
        setQuotes(q.data.items);
        setContracts(ct.data.items);
        setPayments(p.data.items);
        setServices(s.data.items);
      })
      .catch(() => {});
  }, [id]);
  const projectContacts = contacts.filter((c) => c.projectId === id);
  const projectVisits = visitLogs.filter((v) => v.projectId === id);
  const projectQuotes = quotes.filter((q) => q.projectId === id);
  const projectContracts = contracts.filter((c) => c.projectId === id);
  const projectPayments = payments.filter((p) => p.projectId === id);
  const projectServices = services.filter((s) => s.projectId === id);
  const salesContracts = projectContracts.filter((c) => c.contractType === 'sales');
  const purchaseContracts = projectContracts.filter((c) => c.contractType === 'purchase');
  const incomePayments = projectPayments.filter((p) => p.paymentType === 'income');
  const expensePayments = projectPayments.filter((p) => p.paymentType === 'expense');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">项目不存在</p>
        <Link to="/projects" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
          返回项目列表
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    potential: 'bg-gray-100 text-gray-700',
    quoting: 'bg-yellow-100 text-yellow-700',
    contracted: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-green-100 text-green-700',
    completed: 'bg-emerald-100 text-emerald-700',
    terminated: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    potential: '潜在客户',
    quoting: '报价中',
    contracted: '已签约',
    in_progress: '进行中',
    completed: '已完成',
    terminated: '已终止',
  };

  const roleLabels: Record<string, string> = {
    decision_maker: '决策人',
    technical: '技术对接',
    finance: '财务',
    other: '其他',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/projects"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900">{project.name}</h3>
          <p className="text-gray-500 mt-1">{project.code}</p>
        </div>
        <span
          className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[project.status]}`}
        >
          {statusLabels[project.status]}
        </span>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Edit size={18} />
          编辑项目
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">项目类型</div>
                <div className="text-gray-900">
                  {project.type === 'software'
                    ? '软件开发'
                    : project.type === 'consulting'
                    ? '咨询服务'
                    : project.type === 'integration'
                    ? '系统集成'
                    : '其他'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">项目预算</div>
                <div className="text-gray-900 font-medium">
                  {formatCurrency(project.budget)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">项目负责人</div>
                <div className="text-gray-900">{project.ownerName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">所属部门</div>
                <div className="text-gray-900">{project.departmentName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">开始日期</div>
                <div className="text-gray-900">{project.startDate}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">结束日期</div>
                <div className="text-gray-900">{project.endDate}</div>
              </div>
            </div>
            {project.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500 mb-2">项目描述</div>
                <div className="text-gray-700">{project.description}</div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">联系人</h4>
              <Link to="/contacts" className="text-sm text-blue-600 hover:text-blue-700">
                查看全部 →
              </Link>
            </div>
            {projectContacts.length > 0 ? (
              <div className="space-y-3">
                {projectContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        {contact.name}
                        {contact.isPrimary && (
                          <span className="ml-1.5 text-yellow-500 text-xs" title="主联系人">★</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{contact.position}</div>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {roleLabels[contact.role]}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">暂无联系人</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">拜访记录</h4>
              <Link to="/visits" className="text-sm text-blue-600 hover:text-blue-700">
                查看全部 →
              </Link>
            </div>
            {projectVisits.length > 0 ? (
              <div className="space-y-3">
                {projectVisits.map((visit) => (
                  <div key={visit.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{visit.visitDate}</span>
                      <span className="text-sm text-gray-500">{visit.contactName}</span>
                    </div>
                    <div className="text-sm text-gray-600">{visit.purpose}</div>
                    <div className="text-sm text-gray-500 mt-1">{visit.result}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">暂无拜访记录</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">快速统计</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-600">联系人</span>
                </div>
                <span className="font-semibold text-gray-900">{projectContacts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-600">拜访次数</span>
                </div>
                <span className="font-semibold text-gray-900">{projectVisits.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-600">报价单</span>
                </div>
                <span className="font-semibold text-gray-900">{projectQuotes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSignature size={18} className="text-blue-400" />
                  <span className="text-sm text-gray-600">销售合同</span>
                </div>
                <span className="font-semibold text-gray-900">{salesContracts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-orange-400" />
                  <span className="text-sm text-gray-600">采购合同</span>
                </div>
                <span className="font-semibold text-gray-900">{purchaseContracts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpRight size={18} className="text-green-400" />
                  <span className="text-sm text-gray-600">收款记录</span>
                </div>
                <span className="font-semibold text-gray-900">{incomePayments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownRight size={18} className="text-red-400" />
                  <span className="text-sm text-gray-600">付款记录</span>
                </div>
                <span className="font-semibold text-gray-900">{expensePayments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-600">服务记录</span>
                </div>
                <span className="font-semibold text-gray-900">{projectServices.length}</span>
              </div>
            </div>
          </div>

          {projectContracts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">合同信息</h4>
              {projectContracts.map((contract) => (
                <div key={contract.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">合同编号</span>
                    <span className="text-sm font-medium text-gray-900">{contract.contractNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">合同金额</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(contract.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">签订日期</span>
                    <span className="text-sm font-medium text-gray-900">{contract.signDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {projectPayments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">付款进度</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">合同总额</span>
                  <span className="text-sm font-medium text-gray-900">
                    ¥{projectContracts.reduce((sum, c) => sum + c.amount, 0) / 10000}万
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">已收金额</span>
                  <span className="text-sm font-medium text-green-600">
                    ¥{projectPayments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) / 10000}万
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">待收金额</span>
                  <span className="text-sm font-medium text-orange-600">
                    ¥{projectPayments.filter((p) => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0) / 10000}万
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
