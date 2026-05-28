import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, AlertTriangle, Clock, FileText, Calendar, CheckSquare } from 'lucide-react';
import { Notification } from '../types';
import { clsx } from 'clsx';

interface Props {
  notifications: Notification[];
  onClose: () => void;
}

const typeIcons: Record<string, React.FC<{ className?: string }>> = {
  payment_overdue: AlertTriangle,
  quote_expiring: FileText,
  contract_expiring: Calendar,
  task_overdue: CheckSquare,
};

const typeColors: Record<string, string> = {
  payment_overdue: 'text-red-500 bg-red-50',
  quote_expiring: 'text-yellow-500 bg-yellow-50',
  contract_expiring: 'text-blue-500 bg-blue-50',
  task_overdue: 'text-orange-500 bg-orange-50',
};

const priorityBorder: Record<string, string> = {
  high: 'border-l-4 border-l-red-400',
  medium: 'border-l-4 border-l-yellow-400',
  low: 'border-l-4 border-l-gray-300',
};

export const NotificationPanel: React.FC<Props> = ({ notifications, onClose }) => {
  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-800">
          消息通知
          {notifications.length > 0 && (
            <span className="ml-2 text-xs text-gray-500 font-normal">
              ({notifications.length})
            </span>
          )}
        </h3>
        <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <X size={18} />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">暂无新的通知</p>
            <p className="text-xs mt-1">一切正常</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = typeIcons[n.type] || Clock;
            const iconColor = typeColors[n.type] || 'text-gray-500 bg-gray-50';
            return (
              <Link
                key={n.id}
                to={n.link}
                onClick={onClose}
                className={clsx(
                  'flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50',
                  priorityBorder[n.priority]
                )}
              >
                <div className={clsx('p-2 rounded-lg shrink-0', iconColor.split(' ')[1])}>
                  <Icon className={clsx('w-4 h-4', iconColor.split(' ')[0])} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-800">{n.title}</span>
                    {n.priority === 'high' && (
                      <span className="px-1.5 py-0.5 text-xs font-medium text-red-600 bg-red-50 rounded-full">高</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{n.message}</p>
                  <span className="text-xs text-gray-500 mt-1 block">{n.date}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <Link
            to={notifications[0]?.link || '/dashboard'}
            onClick={onClose}
            className="block text-center text-sm text-blue-600 font-medium hover:text-blue-700"
          >
            查看全部
          </Link>
        </div>
      )}
    </div>
  );
};
