import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, CheckCircle2, Clock, AlertTriangle, ListTodo } from 'lucide-react';
import { useStore } from '../store';
import { Task } from '../types';
import { tasksApi } from '../api';
import { Pagination } from '../components/common/Pagination';
import { clsx } from 'clsx';

export const TasksPage: React.FC = () => {
  const { addTask, updateTask, deleteTask } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    projectId: '',
    assignedName: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
  });

  const loadTasks = useCallback(async (p: number, search: string) => {
    setLoading(true);
    try {
      const res = await tasksApi.list({ page: p, limit: 50, search });
      setTasks(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks(1, '');
  }, [loadTasks]);

  const handleSearch = () => {
    setPage(1);
    loadTasks(1, searchTerm);
  };

  const handlePageChange = (p: number) => {
    loadTasks(p, searchTerm);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setNewTask({
      title: '',
      description: '',
      projectId: '',
      assignedName: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      assignedName: task.assignedName,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    });
    setShowModal(true);
  };

  const handleSaveTask = async () => {
    if (editingTask) {
      await updateTask(editingTask.id, newTask);
    } else {
      await addTask(newTask as Record<string, unknown>);
    }
    setShowModal(false);
    setEditingTask(null);
    loadTasks(page, searchTerm);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      await deleteTask(id);
      loadTasks(page, searchTerm);
    }
  };

  const handleQuickStatus = async (task: Task, newStatus: string) => {
    const update: Partial<Task> = { status: newStatus as Task['status'] };
    if (newStatus === 'done') {
      update.completedAt = new Date().toISOString().split('T')[0];
    }
    await updateTask(task.id, update);
    loadTasks(page, searchTerm);
  };

  const statusColors: Record<string, string> = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    todo: '待办',
    in_progress: '进行中',
    done: '已完成',
    blocked: '阻塞',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-50 text-gray-500 border-gray-200',
    medium: 'bg-blue-50 text-blue-600 border-blue-200',
    high: 'bg-orange-50 text-orange-600 border-orange-200',
    urgent: 'bg-red-50 text-red-600 border-red-200',
  };

  const priorityLabels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">任务管理</h3>
          <p className="text-gray-500 mt-1">追踪项目中的待办任务和进度</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          新建任务
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: '总任务数', value: total, icon: ListTodo, color: 'blue' },
          { label: '进行中', value: tasks.filter((s) => s.status === 'in_progress').length, icon: Clock, color: 'yellow' },
          { label: '已完成', value: tasks.filter((s) => s.status === 'done').length, icon: CheckCircle2, color: 'green' },
          { label: '阻塞', value: tasks.filter((s) => s.status === 'blocked').length, icon: AlertTriangle, color: 'red' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${color}-50 rounded-lg`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="搜索任务标题..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="todo">待办</option>
            <option value="in_progress">进行中</option>
            <option value="done">已完成</option>
            <option value="blocked">阻塞</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部优先级</option>
            <option value="urgent">紧急</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={clsx(
                    'bg-gray-50 rounded-xl p-5 border hover:shadow-md transition-shadow',
                    task.status === 'done' ? 'border-green-200' :
                    task.status === 'blocked' ? 'border-red-200' :
                    task.status === 'in_progress' ? 'border-blue-200' :
                    'border-gray-100'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={clsx(
                        'px-2.5 py-1 rounded-full text-xs font-medium',
                        statusColors[task.status]
                      )}
                    >
                      {statusLabels[task.status]}
                    </span>
                    <span
                      className={clsx(
                        'px-2.5 py-1 rounded-full text-xs font-medium border',
                        priorityColors[task.priority]
                      )}
                    >
                      {priorityLabels[task.priority]}
                    </span>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">负责人</span>
                      <span className="font-medium text-gray-900">{task.assignedName || '-'}</span>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">截止日期</span>
                        <span className={clsx(
                          'font-medium',
                          task.status !== 'done' && new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-gray-900'
                        )}>
                          {task.dueDate}
                        </span>
                      </div>
                    )}
                    {task.completedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">完成日期</span>
                        <span className="text-green-600 font-medium">{task.completedAt}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    {task.status === 'todo' && (
                      <button
                        onClick={() => handleQuickStatus(task, 'in_progress')}
                        className="flex-1 px-2 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        开始
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => handleQuickStatus(task, 'done')}
                        className="flex-1 px-2 py-1.5 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        完成
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditModal(task)}
                      className="flex-1 px-2 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="px-2 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />
            </div>

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无任务</p>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingTask ? '编辑任务' : '新建任务'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-500 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务标题 *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入任务标题"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    任务状态
                  </label>
                  <select
                    value={newTask.status}
                    onChange={(e) =>
                      setNewTask({ ...newTask, status: e.target.value as Task['status'] })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todo">待办</option>
                    <option value="in_progress">进行中</option>
                    <option value="done">已完成</option>
                    <option value="blocked">阻塞</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    优先级
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务描述
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入任务描述..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  负责人
                </label>
                <input
                  type="text"
                  value={newTask.assignedName}
                  onChange={(e) => setNewTask({ ...newTask, assignedName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入负责人姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  截止日期
                </label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingTask ? '保存修改' : '创建任务'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
