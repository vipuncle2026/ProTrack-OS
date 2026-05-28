import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  FileText,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Paperclip,
} from 'lucide-react';
import { statsApi, StatsSummary, MonthlyTrend } from '../api';
import { formatCurrency } from '../utils/format';
import { STATUS_COLORS } from '../constants/theme';
import { ProjectStatusDonut } from '../components/charts/ProjectStatusDonut';
import { PaymentBarChart } from '../components/charts/PaymentBarChart';
import { ContractStatusDonut } from '../components/charts/ContractStatusDonut';
import { MonthlyTrendChart } from '../components/charts/MonthlyTrendChart';
import { StatCard } from '../components/ui/StatCard';

const EMPTY_STATS: StatsSummary = {
  projects: { total: 0, byStatus: {} },
  contacts: { total: 0 },
  contracts: { total: 0, totalAmount: 0, salesAmount: 0, purchaseAmount: 0, byStatus: {} },
  payments: { total: 0, incomeAmount: 0, expenseAmount: 0, incomePaid: 0, incomePending: 0, expensePaid: 0, expensePending: 0 },
  visitLogs: { total: 0 },
  quotes: { total: 0, totalAmount: 0 },
  services: { total: 0, byStatus: {} },
  tasks: { total: 0, byStatus: {} },
  attachments: { total: 0 },
  recentProjects: [],
  pendingPayments: [],
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsSummary>(EMPTY_STATS);
  const [monthlyData, setMonthlyData] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      statsApi.getSummary(),
      statsApi.getMonthly(12),
    ])
      .then(([summaryRes, monthlyRes]) => {
        setStats(summaryRes.data);
        setMonthlyData(monthlyRes.data.months);
      })
      .catch((err) => console.error('加载统计数据失败:', err))
      .finally(() => setLoading(false));
  }, []);

  const projectsTotal = stats.projects.total;
  const inProgress = stats.projects.byStatus?.['in_progress'] || 0;
  const salesAmount = stats.contracts.salesAmount;
  const purchaseAmount = stats.contracts.purchaseAmount;
  const incomeAmount = stats.payments.incomeAmount;
  const expenseAmount = stats.payments.expenseAmount;
  const incomePaid = stats.payments.incomePaid;
  const incomePending = stats.payments.incomePending;
  const expensePaid = stats.payments.expensePaid;
  const expensePending = stats.payments.expensePending;
  const visitTotal = stats.visitLogs.total;
  const serviceTotal = stats.services.total;
  const attachmentTotal = stats.attachments?.total || 0;

  const statsCards = [
    {
      label: '项目',
      icon: FolderKanban,
      gradient: 'from-blue-500 to-indigo-500',
      bgLight: 'bg-blue-50',
      iconColor: 'text-blue-600',
      isDual: true,
      items: [
        { label: '总项目数', value: projectsTotal },
        { label: '进行中', value: inProgress },
      ],
    },
    {
      label: '销售总额',
      value: formatCurrency(salesAmount),
      icon: TrendingUp,
      colorClass: 'text-green-600',
      gradient: 'from-green-500 to-emerald-500',
      bgLight: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: '采购总额',
      value: formatCurrency(purchaseAmount),
      icon: ArrowDownRight,
      gradient: 'from-red-500 to-rose-500',
      bgLight: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      label: '收款总额',
      value: formatCurrency(incomeAmount),
      icon: ArrowUpRight,
      gradient: 'from-purple-500 to-pink-500',
      bgLight: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: '付款总额',
      value: formatCurrency(expenseAmount),
      icon: ArrowDownRight,
      gradient: 'from-orange-500 to-amber-500',
      bgLight: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      label: '运营',
      icon: Calendar,
      gradient: 'from-cyan-500 to-blue-500',
      bgLight: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      isDual: true,
      items: [
        { label: '拜访次数', value: visitTotal },
        { label: '服务数量', value: serviceTotal },
      ],
    },
    {
      label: '附件数量',
      value: attachmentTotal,
      icon: Paperclip,
      gradient: 'from-pink-500 to-rose-500',
      bgLight: 'bg-pink-50',
      iconColor: 'text-pink-600',
    },
  ];

  const quickActions = [
    { to: '/projects', icon: FolderKanban, title: '新建项目', subtitle: '创建新项目', gradient: 'from-blue-500 to-indigo-500', shadowColor: 'shadow-blue-500/20' },
    { to: '/visits', icon: Calendar, title: '添加拜访', subtitle: '记录拜访日志', gradient: 'from-emerald-500 to-teal-500', shadowColor: 'shadow-emerald-500/20' },
    { to: '/quotes', icon: FileText, title: '创建报价', subtitle: '生成报价单', gradient: 'from-purple-500 to-pink-500', shadowColor: 'shadow-purple-500/20' },
    { to: '/contracts', icon: TrendingUp, title: '签订合同', subtitle: '管理合同', gradient: 'from-orange-500 to-amber-500', shadowColor: 'shadow-orange-500/20' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton: 统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100/50 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3" />
              <div className="h-7 w-20 bg-gray-200 rounded mb-1" />
              <div className="h-4 w-14 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        {/* Skeleton: 内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-gray-100/50 animate-pulse">
            <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-gray-100/50 animate-pulse">
            <div className="h-6 w-28 bg-gray-200 rounded mb-4" />
            <div className="h-[250px] bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) =>
          stat.isDual && stat.items ? (
            <StatCard
              key={index}
              icon={stat.icon}
              gradient={stat.gradient}
              bgLight={stat.bgLight}
              iconColor={stat.iconColor}
              isDual
              items={stat.items}
            />
          ) : (
            <StatCard
              key={index}
              icon={stat.icon}
              gradient={stat.gradient}
              bgLight={stat.bgLight}
              iconColor={stat.iconColor}
              value={stat.value!}
              label={stat.label}
            />
          )
        )}

        {/* 快捷操作卡片 */}
        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((item, idx) => {
                const ActionIcon = item.icon;
                return (
                  <Link
                    key={idx}
                    to={item.to}
                    className={`flex items-center gap-2 p-2.5 bg-gradient-to-r ${item.gradient} hover:brightness-110 rounded-xl shadow-md ${item.shadowColor} transition-all duration-200 hover:-translate-y-0.5`}
                  >
                    <ActionIcon className="w-4 h-4 text-white" />
                    <span className="text-xs font-medium text-white truncate">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>

      {/* 主内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 最新项目 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-5 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
              <h3 className="text-lg font-bold text-gray-800">最新项目</h3>
            </div>
            <Link
              to="/projects"
              className="group flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              查看全部
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>

          {stats.recentProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FolderKanban className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium">暂无项目数据</p>
              <Link to="/projects" className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                创建第一个项目 →
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.recentProjects.map((project, idx) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="group block p-3.5 bg-gradient-to-r from-gray-50/80 to-white/80 rounded-xl hover:from-blue-50/80 hover:to-indigo-50/80 transition-all duration-200 hover:shadow-md border border-gray-100/50 hover:border-blue-200/50"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
                          {project.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                            {project.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">{project.code}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 ml-12">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {project.ownerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(project.budget)}
                        </span>
                      </div>
                    </div>
                    {project.status && STATUS_COLORS[project.status] && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${STATUS_COLORS[project.status].bg} ${STATUS_COLORS[project.status].text}`}
                      >
                        {STATUS_COLORS[project.status].label}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 项目状态分布 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-5 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-800">项目状态分布</h3>
          </div>
          <ProjectStatusDonut
            data={stats.projects.byStatus || {}}
            total={projectsTotal}
          />
        </div>
      </div>

      {/* 月度趋势 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-5 hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
          <h3 className="text-lg font-bold text-gray-800">月度收支趋势</h3>
        </div>
        <MonthlyTrendChart data={monthlyData} />
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 合同状态分布 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-5 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-800">合同状态</h3>
          </div>
          <ContractStatusDonut
            data={stats.contracts.byStatus || {}}
            total={stats.contracts.total}
          />
        </div>

        {/* 收付款概览 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-5 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-800">收付款概览</h3>
          </div>
          <PaymentBarChart
            incomePaid={incomePaid}
            incomePending={incomePending}
            expensePaid={expensePaid}
            expensePending={expensePending}
          />
        </div>
      </div>

      {/* 待回款提醒 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-5 hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-800">待回款提醒</h3>
          </div>
          <Link
            to="/payments"
            className="group flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            查看全部
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Link>
        </div>

        {stats.pendingPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-sm font-medium">无待回款记录</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {stats.pendingPayments.map((payment) => (
              <div
                key={payment.id}
                className="group flex items-center justify-between p-3.5 bg-gradient-to-r from-orange-50/80 to-amber-50/80 rounded-xl hover:from-orange-100/80 hover:to-amber-100/80 transition-all duration-200 hover:shadow-md border border-orange-100/50 hover:border-orange-200/50"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
                    ¥
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 group-hover:text-orange-700 transition-colors text-sm">
                      {payment.paymentNumber}
                    </div>
                    <div className="text-xs text-gray-500">{payment.paymentDate}</div>
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <div className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    {formatCurrency(payment.amount)}
                  </div>
                  <div className="text-xs text-orange-600 font-medium">
                    {payment.status === 'pending' ? '待付款' : payment.status === 'overdue' ? '已逾期' : payment.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
