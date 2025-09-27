import React, { useState } from 'react';
import { Settings, ArrowLeft, Key, Network, Trash2, PlusCircle } from 'lucide-react';
import { useWalletStore } from '../stores/walletStore';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { wallets, chains, currentChainId, setChains } = useWalletStore();
  const [showAddNetwork, setShowAddNetwork] = useState(false)
  const [form, setForm] = useState({
    chainId: '',
    chainName: '',
    rpcUrl: '',
    blockExplorerUrl: '',
    currencyName: 'Ether',
    currencySymbol: 'ETH',
    decimals: 18
  })

  const handleAddNetwork = () => {
    if (!form.chainId || !form.chainName || !form.rpcUrl) return
    const newChain = {
      chainId: form.chainId.startsWith('0x') ? form.chainId : `0x${parseInt(form.chainId, 10).toString(16)}`,
      chainName: form.chainName,
      rpcUrls: [form.rpcUrl],
      blockExplorerUrls: form.blockExplorerUrl ? [form.blockExplorerUrl] : [],
      nativeCurrency: {
        name: form.currencyName,
        symbol: form.currencySymbol,
        decimals: form.decimals
      }
    }
    setChains([...chains, newChain])
    setShowAddNetwork(false)
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">设置</h1>
          <div className="w-6"></div> {/* 占位符，保持标题居中 */}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 网络设置 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-400">网络</h2>
            <button 
              onClick={() => setShowAddNetwork(true)}
              className="text-blue-500 hover:text-blue-400"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {chains.map((chain) => (
              <div 
                key={chain.chainId} 
                className={`p-3 rounded-lg ${
                  chain.chainId === currentChainId 
                    ? 'bg-blue-600' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{chain.chainName}</div>
                  {chain.chainId === currentChainId && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="text-xs text-gray-300 mt-1">{chain.rpcUrls[0]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 钱包账户 */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3">钱包账户</h2>
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <div key={wallet.address} className="p-3 bg-gray-800 rounded-lg">
                <div className="font-medium">{wallet.name || '未命名钱包'}</div>
                <div className="text-xs text-gray-400 font-mono mt-1">
                  {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 操作选项 */}
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            <div className="flex items-center">
              <Key className="w-5 h-5 text-blue-500 mr-3" />
              <span>更改密码</span>
            </div>
            <div className="text-gray-400">
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </div>
          </button>
          
          <button className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            <div className="flex items-center">
              <Network className="w-5 h-5 text-green-500 mr-3" />
              <span>网络设置</span>
            </div>
            <div className="text-gray-400">
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </div>
          </button>
          
          <button className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            <div className="flex items-center">
              <Trash2 className="w-5 h-5 text-red-500 mr-3" />
              <span>清除数据</span>
            </div>
            <div className="text-gray-400">
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </div>
          </button>
        </div>
      </div>

      {/* 添加网络模态框 */}
      {showAddNetwork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">添加网络</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">网络名称</label>
                <input
                  type="text"
                  value={form.chainName}
                  onChange={(e) => setForm({...form, chainName: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: Ethereum Mainnet"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">RPC URL</label>
                <input
                  type="text"
                  value={form.rpcUrl}
                  onChange={(e) => setForm({...form, rpcUrl: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">链 ID</label>
                <input
                  type="text"
                  value={form.chainId}
                  onChange={(e) => setForm({...form, chainId: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: 1 或 0x1"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">区块链浏览器 URL (可选)</label>
                <input
                  type="text"
                  value={form.blockExplorerUrl}
                  onChange={(e) => setForm({...form, blockExplorerUrl: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: https://etherscan.io"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">货币名称</label>
                  <input
                    type="text"
                    value={form.currencyName}
                    onChange={(e) => setForm({...form, currencyName: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如: Ether"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">货币符号</label>
                  <input
                    type="text"
                    value={form.currencySymbol}
                    onChange={(e) => setForm({...form, currencySymbol: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如: ETH"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddNetwork(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddNetwork}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;