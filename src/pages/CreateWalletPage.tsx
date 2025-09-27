import React, { useState } from 'react';
import { ArrowLeft, Key, Download, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWalletStore } from '../stores/walletStore';

const CreateWalletPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { createWallet, importWalletFromMnemonic, importWalletFromPrivateKey } = useWalletStore();
  
  const [activeTab, setActiveTab] = useState<'create' | 'mnemonic' | 'privateKey'>('create');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordCheck = () => {
    if (!password) {
      setError('请输入密码');
      return false;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handlePasswordCheck()) {
      return;
    }

    setIsLoading(true);
    try {
      // 1. 设置密码 (通过login实现)
      await login(password);

      // 2. 根据不同的tab执行操作
      if (activeTab === 'create') {
        await createWallet(password, '主账户');
      } else if (activeTab === 'mnemonic') {
        if (!mnemonic.trim()) {
          setError('助记词不能为空');
          setIsLoading(false);
          return;
        }
        await importWalletFromMnemonic(password, mnemonic.trim(), '导入账户');
      } else if (activeTab === 'privateKey') {
        if (!privateKey.trim()) {
          setError('私钥不能为空');
          setIsLoading(false);
          return;
        }
        await importWalletFromPrivateKey(password, privateKey.trim(), '导入账户');
      }
      
      // 3. 跳转到主页
      navigate('/wallet');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '操作失败，请检查您的输入');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">
            {activeTab === 'create' ? '创建钱包' : 
             activeTab === 'mnemonic' ? '导入助记词' : '导入私钥'}
          </h1>
          <div className="w-6"></div> {/* 占位符 */}
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-3 text-center ${activeTab === 'create' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
        >
          <Plus className="w-4 h-4 mx-auto mb-1" />
          <span className="text-xs">创建</span>
        </button>
        <button
          onClick={() => setActiveTab('mnemonic')}
          className={`flex-1 py-3 text-center ${activeTab === 'mnemonic' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
        >
          <Download className="w-4 h-4 mx-auto mb-1" />
          <span className="text-xs">助记词</span>
        </button>
        <button
          onClick={() => setActiveTab('privateKey')}
          className={`flex-1 py-3 text-center ${activeTab === 'privateKey' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
        >
          <Key className="w-4 h-4 mx-auto mb-1" />
          <span className="text-xs">私钥</span>
        </button>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 密码输入 */}
          {activeTab === 'create' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">设置密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="至少8位字符"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">确认密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="再次输入密码"
                />
              </div>
            </>
          )}

          {/* 助记词导入 */}
          {activeTab === 'mnemonic' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">助记词</label>
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                rows={3}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入12或24个单词的助记词，用空格分隔"
              />
            </div>
          )}

          {/* 私钥导入 */}
          {activeTab === 'privateKey' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">私钥</label>
              <textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                rows={3}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入私钥"
              />
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {isLoading ? '处理中...' : 
             activeTab === 'create' ? '创建钱包' : 
             activeTab === 'mnemonic' ? '导入助记词' : '导入私钥'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateWalletPage;