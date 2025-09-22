import React from 'react';
import { Settings, ArrowLeft, Key, Network, Trash2 } from 'lucide-react';
import { useWallet } from '../commonprovider/commonProvider';

interface SettingsPageProps {
  onNavigate: (page: 'home' | 'wallet' | 'settings') => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { wallets, chains, currentChainId } = useWallet();

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center">
          <button
            onClick={() => onNavigate('wallet')}
            className="mr-3 p-1 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <Settings className="w-6 h-6 text-blue-500 mr-2" />
            <h1 className="text-lg font-bold">设置</h1>
          </div>
        </div>
      </div>

      {/* 设置内容 */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* 钱包管理 */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-400 mb-3">钱包管理</h2>
          <div className="space-y-2">
            {wallets.map((wallet, index) => (
              <div key={wallet.address} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Key className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="font-medium">{wallet.name}</p>
                      <p className="text-sm text-gray-400">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <button className="p-1 text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 网络管理 */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-400 mb-3">网络管理</h2>
          <div className="space-y-2">
            {chains.map((chain) => (
              <div 
                key={chain.chainId} 
                className={`bg-gray-800 rounded-lg p-3 ${
                  currentChainId === chain.chainId ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center">
                  <Network className="w-4 h-4 text-gray-400 mr-2" />
                  <div>
                    <p className="font-medium">{chain.chainName}</p>
                    <p className="text-sm text-gray-400">Chain ID: {chain.chainId}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 其他设置 */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-400 mb-3">其他设置</h2>
          <div className="space-y-2">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span>导出钱包</span>
                <button className="text-blue-400 hover:text-blue-300 text-sm">
                  导出
                </button>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span>重置钱包</span>
                <button className="text-red-400 hover:text-red-300 text-sm">
                  重置
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
