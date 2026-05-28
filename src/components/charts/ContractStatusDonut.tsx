import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_COLORS } from '../../constants/theme';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: CHART_COLORS.contractStatus.draft },
  reviewing: { label: '审核中', color: CHART_COLORS.contractStatus.pending },
  signing: { label: '已签订', color: CHART_COLORS.contractStatus.active },
  executing: { label: '执行中', color: '#34D399' },
  completed: { label: '已完成', color: CHART_COLORS.contractStatus.completed },
  terminated: { label: '已终止', color: CHART_COLORS.contractStatus.terminated },
};

interface Props {
  data: Record<string, number>;
  total: number;
}

export const ContractStatusDonut: React.FC<Props> = ({ data, total }) => {
  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_CONFIG[status]?.label || status,
      value: count,
      color: STATUS_CONFIG[status]?.color || '#94A3B8',
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[250px] text-gray-500 text-sm gap-2">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span>暂无合同数据</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value} 个`, '']}
            contentStyle={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              fontSize: '13px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 中心文字 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-gray-800">{total}</span>
        <span className="text-xs text-gray-500">合同总数</span>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-600">{entry.name}</span>
            <span className="text-xs text-gray-500">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
