import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Wallet } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const LoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('请输入密码');
      return;
    }
    setIsLoading(true);
    try {
      await login(password);
      navigate('/wallet');
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码错误，请重试');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white p-6">
      <div className="flex flex-col items-center justify-center text-center pt-8 pb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">欢迎回来</h1>
        <p className="text-gray-400 mt-1">请输入密码解锁您的钱包</p>
      </div>

      <form onSubmit={handleLogin} className="flex-1 flex flex-col">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">密码</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入您的密码"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Lock className="w-5 h-5 mr-2" />
              解锁
            </>
          )}
        </button>
      </form>

      <div className="pt-6 text-center">
        <button
          onClick={() => navigate('/welcome')}
          className="text-gray-400 hover:text-white text-sm flex items-center justify-center mx-auto"
        >
          <Wallet className="w-4 h-4 mr-1" />
          返回欢迎页面
        </button>
      </div>
    </div>
  );
};

export default LoginPage;