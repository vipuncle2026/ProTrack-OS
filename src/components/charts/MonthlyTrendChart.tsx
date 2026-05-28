import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/format';
import { CHART_COLORS } from '../../constants/theme';

interface Props {
  data: Array<{
    label: string;
    income: number;
    expense: number;
  }>;
}

export const MonthlyTrendChart: React.FC<Props> = ({ data }) => {
  if (data.every((d) => d.income === 0 && d.expense === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-[250px] text-gray-500 text-sm gap-2">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <span>暂无月度趋势数据</span>
      </div>
    );
  }

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3">
          <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-sm" style={{ color: entry.color }}>
              {entry.name}：{formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#64748B' }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#64748B' }}
          tickFormatter={(v: number) => formatCurrency(v)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }}
          iconType="circle"
          iconSize={8}
        />
        <Line
          type="monotone"
          dataKey="income"
          name="收款"
          stroke={CHART_COLORS.trend.income}
          strokeWidth={2.5}
          dot={{ r: 4, fill: CHART_COLORS.trend.income }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="expense"
          name="付款"
          stroke={CHART_COLORS.trend.expense}
          strokeWidth={2.5}
          dot={{ r: 4, fill: CHART_COLORS.trend.expense }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
