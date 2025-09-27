import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../stores/walletStore';

const AccountDetailPage = () => {
  const navigate = useNavigate();
  const { currentAccount, currentChainId, chains } = useWalletStore();
  
  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

  if (!currentAccount) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <button onClick={() => navigate('/wallet')} className="p-1 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400">暂无账户</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">账户详情</h1>
          <div className="w-6"></div> {/* 占位符 */}
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 p-4 space-y-4">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-400 mb-1">地址</div>
          <div className="font-mono">{currentAccount.address}</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-400 mb-1">名称</div>
          <div>{currentAccount.name || '未命名'}</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-400 mb-1">网络</div>
          <div>
            {chains.find(chain => chain.chainId === currentChainId)?.chainName || '未知网络'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountDetailPage
