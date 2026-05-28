import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { ContactsPage } from './pages/ContactsPage';
import { VisitLogsPage } from './pages/VisitLogsPage';
import { QuotesPage } from './pages/QuotesPage';
import { ContractTypePage } from './pages/ContractTypePage';
import { PaymentTypePage } from './pages/PaymentTypePage';
import { ProfitsPage } from './pages/ProfitsPage';
import { ServicesPage } from './pages/ServicesPage';
import { TasksPage } from './pages/TasksPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { LoginPage } from './pages/LoginPage';
import { BackupPage } from './pages/BackupPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { AttachmentsPage } from './pages/AttachmentsPage';
import { useStore } from './store';
import { authApi } from './api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useStore();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { login, logout, isAuthenticated, setAuthLoading } = useStore();

  // 页面刷新时，如果 localStorage 里有 token，就自动恢复登录态
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      authApi.getMe()
        .then((res) => {
          login(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setAuthLoading(false);
          logout();
        });
    } else {
      setAuthLoading(false);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="visits" element={<VisitLogsPage />} />
          <Route path="quotes" element={<QuotesPage />} />
          {/* 合同管理子路由 */}
          <Route path="contracts" element={<Navigate to="/contracts/sales" replace />} />
          <Route path="contracts/sales" element={<ContractTypePage contractType="sales" />} />
          <Route path="contracts/purchase" element={<ContractTypePage contractType="purchase" />} />
          {/* 款项管理子路由 */}
          <Route path="payments" element={<Navigate to="/payments/income" replace />} />
          <Route path="payments/income" element={<PaymentTypePage paymentType="income" />} />
          <Route path="payments/expense" element={<PaymentTypePage paymentType="expense" />} />
          {/* 利润管理 */}
          <Route path="profits" element={<ProfitsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="backup" element={<BackupPage />} />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="attachments" element={<AttachmentsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

