import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Calendar,
  FileText,
  FileSignature,
  CreditCard,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Database,
  LogOut,
  Settings,
  Edit,
  User as UserIcon,
  ChevronDown,
  TrendingUp,
  ShoppingCart,
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
  Paperclip,
} from 'lucide-react';
import { useStore } from '../../store';
import { clsx } from 'clsx';
import { ChangePasswordModal } from '../ChangePasswordModal';
import { SetSecurityCodeModal } from '../SetSecurityCodeModal';
import { NotificationBell } from '../NotificationBell';
import { NotificationPanel } from '../NotificationPanel';
import { GlobalSearch } from '../GlobalSearch';
import { notificationsApi } from '../../api';
import type { Notification } from '../../types';

interface SubItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
  children?: SubItem[];
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '经营看板', icon: LayoutDashboard },
  { path: '/projects', label: '项目管理', icon: FolderKanban },
  { path: '/contacts', label: '联系人', icon: Users },
  { path: '/visits', label: '拜访日志', icon: Calendar },
  { path: '/quotes', label: '报价管理', icon: FileText },
  {
    path: '/contracts',
    label: '合同管理',
    icon: FileSignature,
    children: [
      { path: '/contracts/sales', label: '销售合同', icon: FileSignature },
      { path: '/contracts/purchase', label: '采购合同', icon: ShoppingCart },
    ],
  },
  {
    path: '/payments',
    label: '款项管理',
    icon: CreditCard,
    children: [
      { path: '/payments/income', label: '收款', icon: ArrowDownCircle },
      { path: '/payments/expense', label: '付款', icon: ArrowUpCircle },
    ],
  },
  { path: '/profits', label: '利润管理', icon: TrendingUp },
  { path: '/services', label: '服务管理', icon: Briefcase },
  { path: '/attachments', label: '附件中心', icon: Paperclip },
];

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar, logout, currentUser } = useStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showSecurityCodeModal, setShowSecurityCodeModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 子菜单展开状态
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // 通知状态
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // 初始化：如果当前路径在某个子菜单下，自动展开父菜单
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    menuItems.forEach((item) => {
      if (item.children) {
        const hasActive = item.children.some(child =>
          location.pathname.startsWith(child.path)
        );
        if (hasActive) {
          initial[item.path] = true;
        }
      }
    });
    setExpandedMenus(initial);
  }, []); // 只在挂载时运行

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 定时拉取通知
  useEffect(() => {
    const fetchNotifications = () => {
      notificationsApi.list().then((res) => {
        setNotifications(res.data.items);
      }).catch(() => {});
    };
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      navigate('/login');
    }
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  };

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const isMenuActive = (item: MenuItem) => {
    if (item.children) {
      return item.children.some(child => location.pathname.startsWith(child.path));
    }
    return location.pathname.startsWith(item.path);
  };

  // 获取当前页面标题
  const getCurrentPageLabel = () => {
    for (const item of menuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (location.pathname.startsWith(child.path)) return child.label;
        }
        if (location.pathname === item.path) return item.label;
      } else {
        if (location.pathname.startsWith(item.path)) return item.label;
      }
    }
    if (location.pathname === '/backup') return '数据备份';
    return '经营看板';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <aside
        className={clsx(
          'fixed left-0 top-0 h-full shadow-xl backdrop-blur-sm bg-white/80 border-r border-gray-200/50 transition-all duration-300 z-30',
          sidebarCollapsed ? 'w-20' : 'w-72'
        )}
      >
        <div className="flex items-center justify-between h-20 px-5 border-b border-gray-200/60 bg-white/50">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <img src="/yingos256.png" alt="营盘 OS" className="w-10 h-10 rounded-xl shadow-lg shadow-blue-500/20" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  营盘 OS
                </h1>
                <p className="text-xs text-gray-500 -mt-1">小团队经营管理系统</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <img src="/yingos256.png" alt="营盘 OS" className="w-10 h-10 rounded-xl shadow-lg shadow-blue-500/20 mx-auto" />
          )}
        </div>

        <nav className="p-3 space-y-0.5 mt-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isMenuActive(item);
            const isExpanded = expandedMenus[item.path];
            const hasChildren = !!item.children;

            return (
              <div key={item.path}>
                {hasChildren ? (
                  // 有子菜单的项目：点击展开/折叠
                  <button
                    onClick={() => !sidebarCollapsed && toggleMenu(item.path)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                        : 'text-gray-600 hover:bg-white/60 hover:shadow-md'
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90" />
                    )}
                    <div className="relative z-10 flex items-center gap-3 flex-1">
                      <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-500'} />
                      {!sidebarCollapsed && (
                        <span className={clsx('font-medium flex-1 text-left', isActive ? 'text-white' : 'text-gray-700')}>
                          {item.label}
                        </span>
                      )}
                      {!sidebarCollapsed && (
                        <ChevronDown
                          size={16}
                          className={clsx(
                            'transition-transform duration-200',
                            isActive ? 'text-white' : 'text-gray-500',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      )}
                    </div>
                  </button>
                ) : (
                  // 普通菜单项
                  <Link
                    to={item.path}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                        : 'text-gray-600 hover:bg-white/60 hover:shadow-md'
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90" />
                    )}
                    <div className="relative z-10 flex items-center gap-3">
                      <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-500'} />
                      {!sidebarCollapsed && (
                        <span className={clsx('font-medium', isActive ? 'text-white' : 'text-gray-700')}>
                          {item.label}
                        </span>
                      )}
                    </div>
                    {isActive && !sidebarCollapsed && (
                      <div className="absolute right-2 w-2 h-2 bg-white rounded-full shadow-lg" />
                    )}
                  </Link>
                )}

                {/* 子菜单 */}
                {hasChildren && !sidebarCollapsed && isExpanded && item.children && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = location.pathname.startsWith(child.path);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={clsx(
                            'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group',
                            isChildActive
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-500 hover:bg-white/60 hover:text-gray-700'
                          )}
                        >
                          <ChildIcon
                            size={16}
                            className={isChildActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-400'}
                          />
                          <span className="text-sm">{child.label}</span>
                          {isChildActive && (
                            <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          {/* 底部操作区 */}
          <div className="bg-gradient-to-b from-transparent via-slate-50/50 to-slate-100/80 rounded-2xl p-2 space-y-1 border border-gray-200/40 shadow-inner">
            <Link
              to="/backup"
              className={clsx(
                'flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 group',
                location.pathname === '/backup'
                  ? 'text-emerald-600 bg-emerald-50/80'
                  : 'text-gray-600 hover:bg-white hover:shadow-sm',
                sidebarCollapsed && 'justify-center'
              )}
            >
              <Database size={20} className={clsx(
                'relative z-10 transition-colors',
                location.pathname === '/backup' ? 'text-emerald-600' : 'text-gray-500 group-hover:text-emerald-500'
              )} />
              {!sidebarCollapsed && (
                <span className={clsx(
                  'relative z-10 font-medium text-sm',
                  location.pathname === '/backup' ? 'text-emerald-600' : 'text-gray-600'
                )}>
                  数据备份
                </span>
              )}
            </Link>
          </div>

          {/* 收起按钮 */}
          <button
            onClick={toggleSidebar}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 mt-2 text-gray-500 hover:text-gray-600 hover:bg-white/60 rounded-xl transition-all duration-200',
              sidebarCollapsed && 'justify-center'
            )}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!sidebarCollapsed && <span className="font-medium text-sm">收起侧栏</span>}
          </button>
        </div>
      </aside>

      <main
        className={clsx(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-20' : 'ml-72'
        )}
      >
        <header className="sticky top-0 z-20 backdrop-blur-md bg-white/70 border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between h-20 px-8">
            <div className="flex items-center gap-4">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
              <h2 className="text-2xl font-semibold text-gray-800">
                {getCurrentPageLabel()}
              </h2>
            </div>

            <GlobalSearch />

            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-medium">
                  {formatDate(currentDate)}
                </span>
              </div>

              <div className="relative" ref={notifRef}>
                <NotificationBell
                  count={notifications.length}
                  onClick={() => setShowNotifications(!showNotifications)}
                />
                {showNotifications && (
                  <NotificationPanel
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-3 px-4 py-2 bg-white/60 rounded-xl shadow-sm hover:bg-white/80 transition-all"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                    {currentUser?.fullName?.charAt(0) || '管'}
                  </div>
                  <div className="text-sm text-left">
                    <div className="font-semibold text-gray-800">{currentUser?.fullName || '管理员'}</div>
                    <div className="text-xs text-gray-500">{currentUser?.role === 'admin' ? '系统管理' : '普通用户'}</div>
                  </div>
                  <ChevronDown className={clsx("w-4 h-4 text-gray-500 transition-transform", showDropdown && "rotate-180")} />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-3">
                      <button
                        onClick={() => {
                          setShowChangePasswordModal(true);
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">修改密码</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowSecurityCodeModal(true);
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 rounded-lg transition-all"
                      >
                        <Settings className="w-5 h-5 text-purple-500" />
                        <span className="font-medium">设置安全码</span>
                      </button>

                      <div className="my-2 border-t border-gray-100" />

                      <Link
                        to="/audit"
                        onClick={() => setShowDropdown(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <ClipboardList className="w-5 h-5 text-indigo-500" />
                        <span className="font-medium">操作审计</span>
                      </Link>

                      <div className="my-2 border-t border-gray-100" />

                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">退出登录</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      <SetSecurityCodeModal
        isOpen={showSecurityCodeModal}
        onClose={() => setShowSecurityCodeModal(false)}
      />
    </div>
  );
};
