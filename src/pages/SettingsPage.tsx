import React, { useState } from 'react';
import { Settings, ArrowLeft, Key, Network, Trash2, PlusCircle } from 'lucide-react';
import { useWallet } from '../commonprovider/commonProvider';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { wallets, chains, currentChainId, setChains } = useWallet();
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

      {/* 设置内容 */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* 网络管理 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-400">网络管理</h2>
            <button onClick={() => setShowAddNetwork(true)} className="flex items-center text-blue-400 hover:text-blue-300 text-sm">
              <PlusCircle className="w-4 h-4 mr-1" /> 添加网络
            </button>
          </div>
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
                    <p className="text-sm text-gray-400">{chain.chainId} · {chain.rpcUrls?.[0]}</p>
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

      {showAddNetwork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-80">
            <h3 className="text-lg font-bold mb-4">添加自定义网络</h3>
            <div className="space-y-3">
              <input className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" placeholder="Chain ID (十进制或0x16进制)" value={form.chainId} onChange={(e)=>setForm({...form, chainId: e.target.value})} />
              <input className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" placeholder="网络名称" value={form.chainName} onChange={(e)=>setForm({...form, chainName: e.target.value})} />
              <input className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" placeholder="RPC URL" value={form.rpcUrl} onChange={(e)=>setForm({...form, rpcUrl: e.target.value})} />
              <input className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" placeholder="区块浏览器URL（可选）" value={form.blockExplorerUrl} onChange={(e)=>setForm({...form, blockExplorerUrl: e.target.value})} />
              <div className="grid grid-cols-3 gap-2">
                <input className="col-span-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" placeholder="币种名称" value={form.currencyName} onChange={(e)=>setForm({...form, currencyName: e.target.value})} />
                <input className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" placeholder="符号" value={form.currencySymbol} onChange={(e)=>setForm({...form, currencySymbol: e.target.value})} />
              </div>
              <input className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" placeholder="精度（默认18）" type="number" value={form.decimals} onChange={(e)=>setForm({...form, decimals: parseInt(e.target.value || '18', 10)})} />
            </div>
            <div className="flex space-x-3 mt-4">
              <button onClick={()=>setShowAddNetwork(false)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-md">取消</button>
              <button onClick={handleAddNetwork} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
