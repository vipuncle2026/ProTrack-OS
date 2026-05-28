import React, { useState, useRef } from 'react';
import { 
  Download, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Database, 
  RefreshCw, 
  AlertCircle,
  Upload,
  FileArchive,
  X,
  RotateCcw,
  Sparkles,
  Package
} from 'lucide-react';
import { useStore } from '../store';
import { backupApi, saveBlob } from '../api/backup';
import { formatFileSize } from '../utils/format';

type BackupConfirmType = 'zip' | 'db' | null;

export const BackupPage: React.FC = () => {
  const { 
    backupRecords, 
    addBackupRecord, 
    deleteBackupRecord,
    clearBackupRecords,
    projects,
    contacts,
    visitLogs,
    quotes,
    contracts,
    payments,
    services,
    refetchAll,
  } = useStore();
  
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isDbBackingUp, setIsDbBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string>('-');
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInitModal, setShowInitModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [backupConfirmType, setBackupConfirmType] = useState<BackupConfirmType>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** ZIP 备份 */
  const doZipBackup = async () => {
    setIsBackingUp(true);
    setError(null);
    
    try {
      const blob = await backupApi.exportZip();
      const now = new Date();
      const timestamp = now.toISOString().replace(/[-:T]/g, '_').slice(0, 19);
      const filename = `protrack_backup_${timestamp}.zip`;
      const sizeMB = formatFileSize(blob.size);

      addBackupRecord({
        id: String(Date.now()),
        filename,
        size: sizeMB,
        date: now.toLocaleString('zh-CN'),
        status: 'success' as const,
      });
      setLastBackupTime(now.toLocaleString('zh-CN'));

      await saveBlob(blob, filename);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // 用户取消保存，不报错
      } else {
        const msg = err instanceof Error ? err.message : '备份导出失败';
        setError(msg);
      }
    } finally {
      setIsBackingUp(false);
      setBackupConfirmType(null);
    }
  };

  /** 数据库备份 */
  const doDbBackup = async () => {
    setIsDbBackingUp(true);
    setError(null);
    try {
      const blob = await backupApi.downloadDbBlob();
      const now = new Date();
      const timestamp = now.toISOString().replace(/[-:T]/g, '_').slice(0, 19);
      const filename = `protrack_db_${timestamp}.db`;

      addBackupRecord({
        id: String(Date.now()),
        filename,
        size: '-',
        date: now.toLocaleString('zh-CN'),
        status: 'success' as const,
      });
      setLastBackupTime(now.toLocaleString('zh-CN'));

      await saveBlob(blob, filename);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // 用户取消
      } else {
        const msg = err instanceof Error ? err.message : '数据库备份失败';
        setError(msg);
      }
    } finally {
      setIsDbBackingUp(false);
      setBackupConfirmType(null);
    }
  };

  /** 选择 ZIP 恢复文件 */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    setRestoreFile(file);
    setShowRestoreModal(true);
  };

  /** 确认恢复 */
  const handleRestore = async () => {
    if (!restoreFile) return;
    
    setIsRestoring(true);
    setError(null);
    
    try {
      const result = await backupApi.restoreZip(restoreFile);
      await refetchAll();
      
      setShowRestoreModal(false);
      setRestoreFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      const counts = (result as any).counts;
      const totalItems = counts ? Object.values(counts).reduce((a: number, b: number) => a + b, 0) : 0;
      addBackupRecord({
        id: String(Date.now()),
        filename: restoreFile.name,
        size: `${(restoreFile.size / (1024 * 1024)).toFixed(2)} MB`,
        date: new Date().toLocaleString('zh-CN'),
        status: 'success' as const,
      });
      setLastBackupTime(new Date().toLocaleString('zh-CN'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '数据恢复失败，请重试';
      setError(msg);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCancelRestore = () => {
    setShowRestoreModal(false);
    setRestoreFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      await backupApi.reset();
      clearBackupRecords();
      setLastBackupTime('-');
      await refetchAll();
      setShowInitModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '数据初始化失败，请重试';
      setError(msg);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteBackupRecord(id);
  };

  const getTotalRecords = () => {
    return projects.length + contacts.length + visitLogs.length + quotes.length + 
           contracts.length + payments.length + services.length;
  };

  const getDataSize = () => {
    const totalData = {
      projects: projects.length,
      contacts: contacts.length,
      visitLogs: visitLogs.length,
      quotes: quotes.length,
      contracts: contracts.length,
      payments: payments.length,
      services: services.length,
    };
    const jsonStr = JSON.stringify(totalData);
    const sizeInKB = (jsonStr.length / 1024).toFixed(1);
    return `${sizeInKB} KB`;
  };

  const getFileCount = () => {
    // 从 contracts/payments/projects 中统计有文件附件的记录数
    const contractFiles = contracts.filter((c: any) => c.contractFile).length;
    const paymentFiles = payments.filter((p: any) => p.invoiceFile).length;
    const projectFiles = projects.filter((p: any) => p.projectFile).length;
    return contractFiles + paymentFiles + projectFiles;
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">数据备份与恢复</h3>
            <p className="text-sm text-gray-500 mt-1">管理系统数据的备份、恢复和初始化</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".zip"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => setShowInitModal(true)}
              className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">数据初始化</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <Upload className="w-5 h-5" />
              <span className="font-semibold">恢复备份</span>
            </button>
            <button
              onClick={() => setBackupConfirmType('zip')}
              disabled={isBackingUp}
              className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="font-semibold">备份中...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span className="font-semibold">导出备份</span>
                </>
              )}
            </button>
            <button
              onClick={() => setBackupConfirmType('db')}
              disabled={isDbBackingUp}
              className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDbBackingUp ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="font-semibold">备份中...</span>
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" />
                  <span className="font-semibold">数据库备份</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50/80 border border-red-200/50 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50/80 rounded-xl">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{getTotalRecords()}</div>
              <div className="text-sm text-gray-500">数据总数</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50/80 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {backupRecords.filter(r => r.status === 'success').length}
              </div>
              <div className="text-sm text-gray-500">备份成功</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50/80 rounded-xl">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{lastBackupTime.split(' ')[1] || '-'}</div>
              <div className="text-sm text-gray-500">上次备份</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50/80 rounded-xl">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{getDataSize()}</div>
              <div className="text-sm text-gray-500">数据大小</div>
            </div>
          </div>
        </div>
      </div>

      {/* 数据统计详情 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">当前数据统计</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent mb-2">
              {getTotalRecords()}
            </div>
            <div className="text-sm text-gray-600 font-medium">总记录数</div>
          </div>
          <div className="text-center p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors">
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent mb-2">
              {getFileCount()}
            </div>
            <div className="text-sm text-gray-600 font-medium">文件附件</div>
          </div>
          {[
            { label: '项目', value: projects.length, color: 'from-blue-500 to-indigo-500' },
            { label: '联系人', value: contacts.length, color: 'from-emerald-500 to-teal-500' },
            { label: '拜访日志', value: visitLogs.length, color: 'from-purple-500 to-pink-500' },
            { label: '报价管理', value: quotes.length, color: 'from-orange-500 to-amber-500' },
            { label: '合同管理', value: contracts.length, color: 'from-cyan-500 to-blue-500' },
            { label: '付款管理', value: payments.length, color: 'from-rose-500 to-red-500' },
            { label: '服务管理', value: services.length, color: 'from-indigo-500 to-purple-500' },
          ].map((item, index) => (
            <div key={index} className="text-center p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors">
              <div className={`text-2xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-2`}>
                {item.value}
              </div>
              <div className="text-sm text-gray-600 font-medium">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 备份记录 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="p-6 border-b border-gray-200/50">
          <h4 className="text-lg font-bold text-gray-800">备份历史记录</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50/80 to-white/80 border-b border-gray-200/50">
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">文件名</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">文件大小</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">备份时间</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">状态</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {backupRecords.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200 group"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${record.filename.endsWith('.db') ? 'from-amber-500 to-orange-600' : 'from-blue-500 to-indigo-600'} rounded-lg flex items-center justify-center text-white shadow-md`}>
                        {record.filename.endsWith('.db') ? (
                          <Database className="w-5 h-5" />
                        ) : (
                          <FileArchive className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {record.filename}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{record.filename.endsWith('.db') ? '数据库文件' : 'ZIP备份包'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm font-medium text-gray-700">{record.size}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{record.date}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
                        record.status === 'success'
                          ? 'bg-emerald-50/80 text-emerald-700 border border-emerald-200/50'
                          : 'bg-red-50/80 text-red-700 border border-red-200/50'
                      }`}
                    >
                      {record.status === 'success' ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          成功
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          失败
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="删除记录"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {backupRecords.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileArchive className="w-10 h-10 text-gray-500" />
            </div>
            <p className="text-gray-500 text-lg font-medium">暂无备份记录</p>
            <p className="text-gray-500 text-sm mt-2">点击"导出备份"按钮创建第一个备份</p>
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl shadow-sm border border-blue-200/50 p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-3">使用说明</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span><strong>导出备份（ZIP）：</strong>后端生成完整备份包，包含所有业务数据 + 上传的合同/项目/发票文件，适合完整迁移和恢复</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span><strong>数据库备份：</strong>直接下载完整 SQLite 数据库文件（.db），包含完整数据库状态和结构</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>建议定期进行数据备份，以防数据丢失</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>数据恢复将覆盖当前所有数据，请谨慎操作！</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 mt-0.5">•</span>
            <span>数据初始化将清空所有业务数据，恢复为干净系统</span>
          </li>
        </ul>
      </div>

      {/* 恢复确认弹窗 */}
      {showRestoreModal && restoreFile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <FileArchive className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">确认恢复数据</h3>
                  <p className="text-sm text-gray-500">{restoreFile.name}</p>
                </div>
              </div>
              <button
                onClick={handleCancelRestore}
                className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 警告 */}
              <div className="bg-orange-50/80 border border-orange-200/50 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-orange-800 mb-1">⚠️ 重要警告</h5>
                  <p className="text-sm text-orange-700">
                    数据恢复将覆盖当前所有数据（含上传的合同、项目文件和发票），此操作不可撤销！
                  </p>
                </div>
              </div>

              {/* 文件信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50/50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">文件大小</p>
                  <p className="font-medium text-gray-800">{formatFileSize(restoreFile.size)}</p>
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">文件类型</p>
                  <p className="font-medium text-gray-800">ZIP 备份包</p>
                </div>
              </div>

              {/* 说明 */}
              <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  ZIP 备份包包含数据库记录和上传的合同/项目/发票文件。恢复后数据库和文件都将还原到备份时的状态。
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleCancelRestore}
                  className="px-6 py-3 text-gray-700 bg-gray-100/80 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleRestore}
                  disabled={isRestoring}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      恢复中...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-5 h-5" />
                      确认恢复
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 初始化模态框 */}
      {showInitModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">数据初始化</h3>
                  <p className="text-sm text-gray-500">清空所有业务数据，恢复干净系统</p>
                </div>
              </div>
              <button
                onClick={() => setShowInitModal(false)}
                className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-purple-50/80 border border-purple-200/50 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-purple-800 mb-2">⚠️ 初始化说明</h5>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• 将清空当前所有业务数据</li>
                    <li>• 项目、联系人、报价管理、合同管理、付款管理、服务管理、任务数据将全部清除</li>
                    <li>• 上传的合同文件、项目文件、发票文件也将一并清理</li>
                    <li>• 管理员账号不受影响</li>
                    <li>• 此操作不可撤销</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">初始化后系统状态</h4>
                <div className="bg-green-50/50 border border-green-200/50 rounded-xl p-4">
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• 所有业务数据已清空（项目、联系人、报价、合同、付款、服务、任务等）</li>
                    <li>• 备份历史记录已清空</li>
                    <li>• 上传的合同/项目/发票文件已清空</li>
                    <li>• 管理员账号保留，可正常登录</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  💡 <strong>建议：</strong>初始化前请先备份当前数据，以便需要时恢复。
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200/50">
                <button
                  onClick={() => setShowInitModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100/80 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleInitialize}
                  disabled={isInitializing}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInitializing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      初始化中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      开始初始化
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 备份确认弹窗 */}
      {backupConfirmType && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${backupConfirmType === 'zip' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                  {backupConfirmType === 'zip'
                    ? <FileArchive className="w-5 h-5 text-blue-600" />
                    : <Database className="w-5 h-5 text-amber-600" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {backupConfirmType === 'zip' ? '导出备份 (ZIP)' : '数据库备份'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {backupConfirmType === 'zip' ? '含数据 + 合同文件' : '导出为 .db 文件'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBackupConfirmType(null)}
                className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {backupConfirmType === 'zip' && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">将备份以下数据（含合同/项目/发票附件）：</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '项目', value: projects.length },
                      { label: '联系人', value: contacts.length },
                      { label: '拜访日志', value: visitLogs.length },
                      { label: '报价管理', value: quotes.length },
                      { label: '合同管理', value: contracts.length },
                      { label: '付款管理', value: payments.length },
                      { label: '服务管理', value: services.length },
                      { label: '文件附件', value: getFileCount() },
                    ].map((item, i) => (
                      <div key={i} className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{item.value}</div>
                        <div className="text-xs text-gray-500">{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    后端生成 ZIP 包，包含 data.json + contracts/ projects/ payments/ 目录
                  </p>
                </div>
              )}

              {backupConfirmType === 'db' && (
                <div className="bg-amber-50/80 border border-amber-200/50 rounded-xl p-4">
                  <p className="text-sm text-amber-700">
                    将下载完整的 SQLite 数据库文件（<strong>.db</strong>），包含所有表结构和数据，适合完整恢复。
                  </p>
                  <p className="text-xs text-amber-500 mt-2">
                    注意：数据库备份不含上传的合同/项目/发票文件，如需完整备份请使用 ZIP 导出。
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setBackupConfirmType(null)}
                  className="px-5 py-2.5 text-gray-700 bg-gray-100/80 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={backupConfirmType === 'zip' ? doZipBackup : doDbBackup}
                  disabled={isBackingUp || isDbBackingUp}
                  className={`flex items-center gap-2 px-5 py-2.5 text-white rounded-xl shadow-lg transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                    backupConfirmType === 'zip'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/30'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30'
                  }`}
                >
                  {(isBackingUp || isDbBackingUp) ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      备份中...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      开始备份
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
