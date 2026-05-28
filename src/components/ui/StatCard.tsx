import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardBaseProps {
  icon: LucideIcon;
  gradient: string;
  bgLight: string;
  iconColor: string;
}

interface SingleStatCardProps extends StatCardBaseProps {
  value: string | number;
  label: string;
  isDual?: false;
}

interface DualStatCardProps extends StatCardBaseProps {
  isDual: true;
  items: Array<{ label: string; value: number }>;
}

type StatCardProps = SingleStatCardProps | DualStatCardProps;

export const StatCard: React.FC<StatCardProps> = (props) => {
  const { icon: Icon, gradient, bgLight, iconColor } = props;

  const renderContent = () => {
    if (props.isDual) {
      return (
        <div className="flex items-end gap-3">
          {props.items.map((item, i) => (
            <div key={i} className={i === 0 ? 'flex-1' : ''}>
              <div className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent mb-1 tabular-nums">
                {item.value}
              </div>
              <div className="text-xs text-gray-500 font-medium">{item.label}</div>
            </div>
          ))}
          {props.items.length > 1 && (
            <div className="w-px h-8 bg-gray-200 self-center mb-1" />
          )}
        </div>
      );
    }
    const single = props as SingleStatCardProps;
    return (
      <>
        <div className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent mb-1 tabular-nums">
          {String(single.value)}
        </div>
        <div className="text-xs text-gray-500 font-medium">{single.label}</div>
      </>
    );
  };

  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${bgLight} backdrop-blur-sm`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>

        {renderContent()}
      </div>

      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
};
