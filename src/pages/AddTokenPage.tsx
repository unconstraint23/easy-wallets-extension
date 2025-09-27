import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../stores/walletStore';

const AddTokenPage = () => {
  const navigate = useNavigate();
  const { chains, currentChainId, addWatchedToken } = useWalletStore();
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState('');
  const [tokenType, setTokenType] = useState('ERC20');
  const [error, setError] = useState('');

  const currentChain = chains.find(chain => chain.chainId === currentChainId) || chains[0];

  const handleAddToken = () => {
    setError('');
    
    if (!tokenAddress || !tokenSymbol || !tokenDecimals) {
      setError('请填写所有字段');
      return;
    }

    try {
      const token = {
        address: tokenAddress,
        symbol: tokenSymbol,
        decimals: parseInt(tokenDecimals),
        type: tokenType as 'ERC20' | 'ERC721' | 'ERC1155',
        chainId: currentChainId,
        balance: '0'
      };

      addWatchedToken(token);
      navigate('/home');
    } catch (err) {
      setError('添加代币失败');
      console.error(err);
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
          <h1 className="text-lg font-bold">添加代币</h1>
          <div className="w-6"></div> {/* 占位符 */}
        </div>
      </div>

      {/* 表单 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">合约地址</label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="代币合约地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">代币符号</label>
            <input
              type="text"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如: USDT"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">小数位数</label>
            <input
              type="number"
              value={tokenDecimals}
              onChange={(e) => setTokenDecimals(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如: 18"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">代币类型</label>
            <select
              value={tokenType}
              onChange={(e) => setTokenType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ERC20">ERC20</option>
              <option value="ERC721">ERC721</option>
              <option value="ERC1155">ERC1155</option>
            </select>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">网络</div>
            <div>{currentChain?.chainName || '未知网络'}</div>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleAddToken}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加代币
        </button>
      </div>
    </div>
  );
};

export default AddTokenPage;
