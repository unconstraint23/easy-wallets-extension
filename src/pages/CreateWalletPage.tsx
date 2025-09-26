import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wallet, Eye, EyeOff } from 'lucide-react';
import { useWallet } from '../commonprovider/commonProvider';

type Tab = 'create' | 'mnemonic' | 'privateKey';

const CreateWalletPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { createWallet, importWalletFromMnemonic, importWalletFromPrivateKey } = useWallet();
  const navigate = useNavigate();

  const handlePasswordCheck = () => {
    setError('');
    if (password.length < 8) {
      setError('密码至少需要8位');
      return false;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }
    return true;
  }

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
        await createWallet('主账户');
      } else if (activeTab === 'mnemonic') {
        if (!mnemonic.trim()) {
          setError('助记词不能为空');
          setIsLoading(false);
          return;
        }
        await importWalletFromMnemonic(mnemonic.trim(), '导入账户');
      } else if (activeTab === 'privateKey') {
        if (!privateKey.trim()) {
          setError('私钥不能为空');
          setIsLoading(false);
          return;
        }
        await importWalletFromPrivateKey(privateKey.trim(), '导入账户');
      }
      
      // 3. 跳转到主页
      navigate('/wallet');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '操作失败，请检查您的输入');
      setIsLoading(false);
    }
  };

  const renderTabs = () => (
    <div className="flex border-b border-gray-700 mb-6">
      <button
        onClick={() => setActiveTab('create')}
        className={`px-4 py-2 text-sm font-medium ${activeTab === 'create' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
      >
        创建钱包
      </button>
      <button
        onClick={() => setActiveTab('mnemonic')}
        className={`px-4 py-2 text-sm font-medium ${activeTab === 'mnemonic' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
      >
        导入助记词
      </button>
      <button
        onClick={() => setActiveTab('privateKey')}
        className={`px-4 py-2 text-sm font-medium ${activeTab === 'privateKey' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
      >
        导入私钥
      </button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'mnemonic':
        return (
          <div>
            <h2 className="font-semibold text-lg mb-2">导入钱包</h2>
            <p className="text-sm text-gray-400 mb-6">使用您的助记词导入现有钱包</p>
            <textarea
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="在此处输入您的12或24个单词的助记词"
              rows={3}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        );
      case 'privateKey':
        return (
          <div>
            <h2 className="font-semibold text-lg mb-2">导入钱包</h2>
            <p className="text-sm text-gray-400 mb-6">使用您的私钥导入现有钱包</p>
            <input
              type="text"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="在此处输入您的私钥"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        );
      case 'create':
      default:
        return (
          <div>
            <h2 className="font-semibold text-lg mb-2">创建新钱包</h2>
            <p className="text-sm text-gray-400 mb-6">创建一个新的以太坊钱包并生成助记词</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white p-6">
      <div className="flex flex-col items-center justify-center text-center pt-8 pb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center mb-4">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">MyWallet</h1>
        <p className="text-gray-400 mt-1">安全的以太坊钱包</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6">
        {renderTabs()}
        {renderContent()}
        
        <div className="mt-6">
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-300 mb-2 block">设置密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码 (至少8位)"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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

          <div className="mb-6">
            <label className="text-sm font-medium text-gray-300 mb-2 block">确认密码</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
               <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out disabled:bg-gray-500"
          >
            {isLoading ? '处理中...' : (activeTab === 'create' ? '创建钱包' : '导入钱包')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateWalletPage;
