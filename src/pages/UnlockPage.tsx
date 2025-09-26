import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

import { Lock, Eye, EyeOff, Wallet } from 'lucide-react';

const UnlockPage: React.FC = ({ onSuccess }: any) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { unlockWallet,isAuthenticated } = useAuth();
  useEffect(() => {
    if(isAuthenticated) {
      onSuccess();
    }   
    }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('请输入密码');
      return;
    }
    setIsLoading(true);
    const success = await unlockWallet(password);
    console.log('success', success);
    if (success) {
      onSuccess();
    } else {
      setError('密码错误，请重试');
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

      <form onSubmit={handleLogin} className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Wallet className="w-5 h-5 text-gray-400 mr-2" />
          <div>
            <h2 className="font-semibold">解锁钱包</h2>
            <p className="text-xs text-gray-400">输入您的钱包密码以继续</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-gray-300 mb-2 block">密码</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入您的钱包密码"
              className="w-full px-3 py-2 bg-gray-900 border border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
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

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '解锁中...' : '解锁钱包'}
        </button>
      </form>
    </div>
  );
};

export default UnlockPage;
