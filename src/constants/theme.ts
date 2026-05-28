/**
 * 项目状态颜色约定
 */
export const STATUS_COLORS: Record<string, { label: string; bg: string; text: string }> = {
  potential: { label: '潜在客户', bg: 'bg-gray-100', text: 'text-gray-700' },
  quoting: { label: '报价中', bg: 'bg-amber-50', text: 'text-amber-700' },
  contracted: { label: '已签约', bg: 'bg-blue-50', text: 'text-blue-700' },
  in_progress: { label: '进行中', bg: 'bg-green-50', text: 'text-green-700' },
  completed: { label: '已完成', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  cancelled: { label: '已取消', bg: 'bg-red-50', text: 'text-red-700' },
  terminated: { label: '已终止', bg: 'bg-red-50', text: 'text-red-700' },
};

/**
 * 图表颜色常量（Recharts 用）
 */
export const CHART_COLORS = {
  projectStatus: {
    potential: '#94A3B8',
    quoting: '#FBBF24',
    contracted: '#60A5FA',
    in_progress: '#34D399',
    completed: '#10B981',
    cancelled: '#F87171',
  },
  contractStatus: {
    draft: '#94A3B8',
    pending: '#FBBF24',
    active: '#60A5FA',
    completed: '#10B981',
    terminated: '#F87171',
  },
  payment: {
    incomePaid: '#34D399',
    incomePending: '#FCD34D',
    expensePaid: '#F87171',
    expensePending: '#FDA4AF',
  },
  trend: {
    income: '#10B981',
    expense: '#F87171',
  },
} as const;

/**
 * 卡片渐变预设
 */
export const CARD_GRADIENTS = {
  blue: 'from-blue-500 to-indigo-500',
  green: 'from-green-500 to-emerald-500',
  red: 'from-red-500 to-rose-500',
  purple: 'from-purple-500 to-pink-500',
  orange: 'from-orange-500 to-amber-500',
  cyan: 'from-cyan-500 to-blue-500',
  pink: 'from-pink-500 to-rose-500',
} as const;
