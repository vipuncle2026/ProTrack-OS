import React from 'react';
import { Bell } from 'lucide-react';

interface Props {
  count: number;
  onClick: () => void;
}

export const NotificationBell: React.FC<Props> = ({ count, onClick }) => (
  <button
    onClick={onClick}
    className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
  >
    <Bell className="w-5 h-5 text-gray-500" />
    {count > 0 && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </button>
);
