import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts';
import { formatCurrency } from '../../utils/format';
import { CHART_COLORS } from '../../constants/theme';

function formatAmount(amount: number): string {
  return formatCurrency(amount);
}

interface Props {
  incomePaid: number;
  incomePending: number;
  expensePaid: number;
  expensePending: number;
}

export const PaymentBarChart: React.FC<Props> = ({
  incomePaid,
  incomePending,
  expensePaid,
  expensePending,
}) => {
  if (incomePaid === 0 && incomePending === 0 && expensePaid === 0 && expensePending === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-gray-500 text-sm">
        暂无款项数据
      </div>
    );
  }

  const data = [
    { name: '已收款', value: incomePaid, color: CHART_COLORS.payment.incomePaid },
    { name: '待收款', value: incomePending, color: CHART_COLORS.payment.incomePending },
    { name: '已付款', value: expensePaid, color: CHART_COLORS.payment.expensePaid },
    { name: '待付款', value: expensePending, color: CHART_COLORS.payment.expensePending },
  ];

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: { name: string; value: number } }>;
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3">
          <p className="text-sm font-medium text-gray-700">{item.name}</p>
          <p className="text-base font-bold text-gray-900">{formatAmount(item.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748B' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickFormatter={(v: number) => formatAmount(v)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 mt-2">
        <div className="text-center">
          <div className="text-base font-bold text-emerald-600">{formatAmount(incomePaid)}</div>
          <div className="text-xs text-gray-500">已收款</div>
        </div>
        <div className="text-center">
          <div className="text-base font-bold text-yellow-500">{formatAmount(incomePending)}</div>
          <div className="text-xs text-gray-500">待收款</div>
        </div>
        <div className="text-center">
          <div className="text-base font-bold text-red-500">{formatAmount(expensePaid)}</div>
          <div className="text-xs text-gray-500">已付款</div>
        </div>
        <div className="text-center">
          <div className="text-base font-bold text-rose-400">{formatAmount(expensePending)}</div>
          <div className="text-xs text-gray-500">待付款</div>
        </div>
      </div>
    </div>
  );
};
