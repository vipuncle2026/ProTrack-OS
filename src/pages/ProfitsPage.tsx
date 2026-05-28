import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, TrendingUp, DollarSign, ShoppingCart, Wrench, X, Edit, Trash2 } from 'lucide-react';
import { profitsApi, directCostsApi, projectsApi } from '../api';
import type { ProfitItem, ProfitSummary, DirectCost } from '../types';
import { clsx } from 'clsx';

export const ProfitsPage: React.FC = () => {
  const [profitItems, setProfitItems] = useState<ProfitItem[]>([]);
  const [summary, setSummary] = useState<ProfitSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<ProfitItem | null>(null);
  const [directCosts, setDirectCosts] = useState<DirectCost[]>([]);
  const [showCostModal, setShowCostModal] = useState(false);
  const [editingCost, setEditingCost] = useState<DirectCost | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [newCost, setNewCost] = useState<Partial<DirectCost>>({
    projectId: '',
    contractId: '',
    name: '',
    amount: 0,
    costDate: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await profitsApi.getSummary();
      setProfitItems(res.data.items);
      setSummary(res.data.summary);
    } catch (err) {
      console.error('加载利润数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    projectsApi.list({ page: 1, limit: 200 }).then((res) => {
      setProjects(res.data.items.map(p => ({ id: p.id, name: p.name })));
    }).catch((err) => {
      console.error('加载项目失败:', err);
    });
  }, [loadData]);

  const loadDirectCosts = async (projectId: string) => {
    try {
      const res = await directCostsApi.list({ page: 1, limit: 200, projectId });
      setDirectCosts(res.data.items.filter(dc => dc.projectId === projectId));
    } catch (err) {
      console.error('加载直接成本失败:', err);
    }
  };

  const handleOpenProjectDetail = async (item: ProfitItem) => {
    setActiveProject(item);
    await loadDirectCosts(item.projectId);
  };

  const handleOpenAddCost = () => {
    setEditingCost(null);
    setNewCost({
      projectId: activeProject?.projectId || '',
      contractId: '',
      name: '',
      amount: 0,
      costDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowCostModal(true);
  };

  const handleOpenEditCost = (cost: DirectCost) => {
    setEditingCost(cost);
    setNewCost({
      projectId: cost.projectId,
      contractId: cost.contractId,
      name: cost.name,
      amount: cost.amount,
      costDate: cost.costDate,
      notes: cost.notes,
    });
    setShowCostModal(true);
  };

  const handleSaveCost = async () => {
    if (editingCost) {
      await directCostsApi.update(editingCost.id, newCost);
    } else {
      await directCostsApi.create({ ...newCost });
    }
    setShowCostModal(false);
    if (activeProject) {
      await loadDirectCosts(activeProject.projectId);
    }
    await loadData();
  };

  const handleDeleteCost = async (id: string) => {
    if (confirm('确定要删除这条成本记录吗？')) {
      await directCostsApi.delete(id);
      if (activeProject) {
        await loadDirectCosts(activeProject.projectId);
      }
      await loadData();
    }
  };


  const formatWan = (amount: number) => {
    return `¥${(amount / 10000).toFixed(1)}万`;
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-emerald-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getMarginBadge = (margin: number) => {
    if (margin >= 30) return 'bg-emerald-100 text-emerald-700';
    if (margin >= 15) return 'bg-blue-100 text-blue-700';
    if (margin >= 0) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">利润管理</h3>
          <p className="text-gray-500 mt-1">
            合同利润 = 销售合同金额 − 采购合同金额 − 直接成本
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} />
          刷新数据
        </button>
      </div>

      {/* 总汇总卡片 */}
      {summary && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-gray-500">销售总额</div>
            </div>
            <div className="text-xl font-bold text-gray-900">{formatWan(summary.totalSalesAmount)}</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-sm text-gray-500">采购总额</div>
            </div>
            <div className="text-xl font-bold text-gray-900">{formatWan(summary.totalPurchaseAmount)}</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Wrench className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm text-gray-500">直接成本</div>
            </div>
            <div className="text-xl font-bold text-gray-900">{formatWan(summary.totalDirectCostAmount)}</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-sm text-gray-500">总利润</div>
            </div>
            <div className={clsx('text-xl font-bold', getProfitColor(summary.totalProfit))}>
              {formatWan(summary.totalProfit)}
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 mb-2">综合利润率</div>
            <div className={clsx('text-xl font-bold', getProfitColor(summary.totalProfit))}>
              {summary.totalMargin.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* 左侧：项目利润列表 */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h4 className="font-semibold text-gray-800">项目利润明细</h4>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">项目名称</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">销售额</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">采购额</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">直接成本</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">利润</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">利润率</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {profitItems.map((item) => (
                    <tr
                      key={item.projectId}
                      className={clsx(
                        'border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer',
                        activeProject?.projectId === item.projectId && 'bg-blue-50'
                      )}
                      onClick={() => handleOpenProjectDetail(item)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-900 text-sm">{item.projectName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          销{item.salesContractCount}单 · 采{item.purchaseContractCount}单 · 成本{item.directCostCount}项
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-sm text-gray-700">{formatWan(item.salesAmount)}</td>
                      <td className="py-3.5 px-4 text-right text-sm text-gray-700">{formatWan(item.purchaseAmount)}</td>
                      <td className="py-3.5 px-4 text-right text-sm text-gray-700">{formatWan(item.directCostAmount)}</td>
                      <td className={clsx('py-3.5 px-4 text-right text-sm font-semibold', getProfitColor(item.profit))}>
                        {formatWan(item.profit)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', getMarginBadge(item.margin))}>
                          {item.margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenProjectDetail(item); }}
                          className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          录入成本
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {profitItems.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">暂无利润数据，请先添加销售合同</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧：直接成本明细 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-800">
                {activeProject ? activeProject.projectName : '直接成本'}
              </h4>
              {activeProject && (
                <p className="text-xs text-gray-500 mt-0.5">点击左侧项目行切换</p>
              )}
            </div>
            {activeProject && (
              <button
                onClick={handleOpenAddCost}
                className="flex items-center gap-1 text-sm px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={14} />
                添加
              </button>
            )}
          </div>

          {!activeProject ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Wrench className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-gray-500 text-sm">点击左侧项目行</p>
              <p className="text-gray-500 text-sm">查看或录入直接成本</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {directCosts.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">暂无直接成本记录</p>
                  <button
                    onClick={handleOpenAddCost}
                    className="mt-3 text-sm text-purple-600 hover:underline"
                  >
                    + 添加第一条
                  </button>
                </div>
              ) : (
                <>
                  {directCosts.map((cost) => (
                    <div key={cost.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-800 truncate">{cost.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{cost.costDate || '-'}</div>
                          {cost.notes && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate">{cost.notes}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-sm font-semibold text-red-600">
                            {formatWan(cost.amount)}
                          </span>
                          <button
                            onClick={() => handleOpenEditCost(cost)}
                            className="p-1 text-gray-500 hover:text-blue-600"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCost(cost.id)}
                            className="p-1 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-gray-50">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gray-600">合计</span>
                      <span className="text-red-600">
                        {formatWan(directCosts.reduce((s, dc) => s + dc.amount, 0))}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 利润计算说明 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
        <h5 className="font-semibold text-blue-800 mb-2">利润计算规则</h5>
        <div className="flex items-center gap-3 text-sm text-blue-700 flex-wrap">
          <span className="font-medium">合同利润</span>
          <span className="text-blue-400">=</span>
          <span className="px-2 py-0.5 bg-blue-100 rounded">销售合同金额</span>
          <span className="text-blue-400">−</span>
          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">采购合同金额</span>
          <span className="text-blue-400">−</span>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">直接成本（手动录入）</span>
        </div>
        <p className="text-xs text-blue-500 mt-2">
          直接成本包括：差旅费、人工费、外包费、材料费等项目执行过程中产生的直接费用。在左侧表格点击"录入成本"按钮进行录入。
        </p>
      </div>

      {/* 直接成本录入 Modal */}
      {showCostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCost ? '编辑直接成本' : '添加直接成本'}
              </h3>
              <button onClick={() => setShowCostModal(false)} className="p-2 text-gray-500 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">关联项目</label>
                <select
                  value={newCost.projectId}
                  onChange={(e) => setNewCost({ ...newCost, projectId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">请选择项目</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">费用名称 *</label>
                <input
                  type="text"
                  value={newCost.name}
                  onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="例：差旅费、外包费、材料费..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">金额 (元) *</label>
                  <input
                    type="number"
                    value={newCost.amount || ''}
                    onChange={(e) => setNewCost({ ...newCost, amount: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="请输入金额"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">发生日期</label>
                  <input
                    type="date"
                    value={newCost.costDate}
                    onChange={(e) => setNewCost({ ...newCost, costDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                <textarea
                  value={newCost.notes}
                  onChange={(e) => setNewCost({ ...newCost, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="请输入备注信息..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCostModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveCost}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {editingCost ? '保存修改' : '添加成本'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
