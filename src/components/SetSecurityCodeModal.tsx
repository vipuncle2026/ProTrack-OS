import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle, X, Info } from 'lucide-react';
import { authApi } from '../api';
import { useStore } from '../store';

interface SetSecurityCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetSecurityCodeModal: React.FC<SetSecurityCodeModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useStore();
  const [step, setStep] = useState<'verify' | 'setCode'>('verify');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newSecurityCode, setNewSecurityCode] = useState('');
  const [confirmSecurityCode, setConfirmSecurityCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  /**
   * 安全码是纯前端 UI 锁，保存在 localStorage。
   * 其作用是防止在无人看管的电脑上被误操作，并非密码学安全保障。
   * 身份验证步骤调用后端接口，确保只有知道登录密码的人才能修改安全码。
   */
  const handleVerifyPassword = async () => {
    setError('');
    if (!currentPassword) { setError('请输入当前密码'); return; }

    setIsLoading(true);
    try {
      const username = currentUser?.username;
      if (!username) throw new Error('未找到用户名，请重新登录');
      await authApi.login(username, currentPassword);
      setStep('setCode');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        '密码错误，请重试';
      setError(msg);
      setCurrentPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCode = () => {
    setError('');
    if (!newSecurityCode) { setError('请输入新安全码'); return; }
    if (newSecurityCode.length !== 6) { setError('安全码必须为6位数字'); return; }
    if (!/^\d+$/.test(newSecurityCode)) { setError('安全码必须全部为数字'); return; }
    if (newSecurityCode !== confirmSecurityCode) { setError('两次输入的安全码不一致'); return; }

    setIsLoading(true);
    setTimeout(() => {
      // 安全码是前端 UI 锁，存储在 localStorage
      localStorage.setItem('userSecurityCode', newSecurityCode);
      setSuccess(true);
      setIsLoading(false);
    }, 600);
  };

  const handleClose = () => {
    setStep('verify');
    setCurrentPassword('');
    setNewSecurityCode('');
    setConfirmSecurityCode('');
    setError('');
    setSuccess(false);
    setIsLoading(false);
    onClose();
  };

  const handleBack = () => {
    setStep('verify');
    setNewSecurityCode('');
    setConfirmSecurityCode('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {success ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">安全码设置成功</h2>
            <p className="text-gray-500 mb-4">您的新安全码已保存</p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-8">
              <p className="text-sm text-emerald-700">
                🔐 新安全码：<span className="font-mono font-bold text-lg">{newSecurityCode}</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all"
            >
              确定
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {step === 'setCode' && (
                  <button onClick={handleBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                )}
                <h2 className="text-xl font-bold text-gray-800">
                  {step === 'verify' ? '验证身份' : '设置安全码'}
                </h2>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* 安全码定位说明 */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  安全码是<strong>前端界面锁</strong>，用于防止无人看管时的误操作。
                  它保存在本浏览器本地，并非账号密码，请勿将其视为高强度安全凭证。
                </span>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {step === 'verify' ? (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">当前登录密码</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><Lock size={20} /></div>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                      className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      placeholder="请输入当前登录密码"
                    />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 transition-colors">
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-sm text-emerald-700">✅ 身份验证通过，请设置您的新安全码</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">新安全码</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><KeyRound size={20} /></div>
                      <input
                        type="text"
                        value={newSecurityCode}
                        onChange={(e) => setNewSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-center text-2xl font-mono tracking-widest"
                        placeholder="6位数字"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">确认安全码</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><KeyRound size={20} /></div>
                      <input
                        type="text"
                        value={confirmSecurityCode}
                        onChange={(e) => setConfirmSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-center text-2xl font-mono tracking-widest"
                        placeholder="再次输入6位数字"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-100">
              {step === 'verify' ? (
                <button
                  onClick={handleVerifyPassword}
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                >
                  {isLoading ? '验证中...' : '验证'}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button onClick={handleBack} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all">
                    上一步
                  </button>
                  <button onClick={handleSaveCode} disabled={isLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50">
                    {isLoading ? '保存中...' : '保存安全码'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
