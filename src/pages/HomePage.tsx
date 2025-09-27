import React, { useEffect, useState } from 'react';
import { Send, Plus, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../stores/walletStore';
import { useAuthStore } from '../stores/authStore';
import { providerManager } from '../lib/provider';

const HomePage = () => {
  const navigate = useNavigate();
  const { currentAccount, currentChainId, chains, watchedTokens, refreshWatchedTokens } = useWalletStore();
  const { password } = useAuthStore();
  const [balance, setBalance] = useState('0');
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);

  const currentChain = chains.find(chain => chain.chainId === currentChainId) || chains[0];

  useEffect(() => {
    const fetchBalance = async () => {
      if (!currentAccount || !currentChain || !password) return;
      
      setLoading(true);
      try {
        const provider = providerManager.getProviderForChain(currentChain);
        const balanceWei = await provider.getBalance(currentAccount.address);
        setBalance(balanceWei.toString());
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [currentAccount, currentChain, password]);

  useEffect(() => {
    if (password) {
      refreshWatchedTokens(password);
    }
  }, [refreshWatchedTokens, password]);

  const formatBalance = (balanceWei: string) => {
    if (!currentChain) return '0';
    try {
      // 将wei转换为ether
      const balanceEth = parseFloat(balanceWei) / Math.pow(10, currentChain.nativeCurrency.decimals);
      return balanceEth.toFixed(4);
    } catch (error) {
      return '0';
    }
  };

  const formatTokenBalance = (balance: string, decimals: number) => {
    try {
      const balanceNum = parseFloat(balance) / Math.pow(10, decimals);
      return balanceNum.toFixed(2);
    } catch (error) {
      return '0';
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!currentAccount) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">未找到账户</h2>
          <p className="text-gray-400 mb-6">请创建或导入一个钱包</p>
          <button
            onClick={() => navigate('/wallet')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            管理钱包
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">资产</h1>
          <button
            onClick={() => navigate('/transfer')}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 账户信息 */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-100">总资产</span>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="text-blue-100 hover:text-white"
            >
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-2xl font-bold mb-1">
            {showBalance ? `${formatBalance(balance)} ${currentChain?.nativeCurrency.symbol || 'ETH'}` : '****'}
          </div>
          <div className="text-xs text-blue-200">
            {currentAccount.name || formatAddress(currentAccount.address)}
          </div>
        </div>

        {/* 代币列表 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-400">代币</h2>
          </div>
          
          <div className="space-y-2">
            {/* 主要资产 */}
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                  <span className="text-xs font-bold">ETH</span>
                </div>
                <div>
                  <div className="font-medium">Ethereum</div>
                  <div className="text-xs text-gray-400">{currentChain?.chainName || '未知网络'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {showBalance ? `${formatBalance(balance)} ETH` : '****'}
                </div>
              </div>
            </div>

            {/* 其他代币 */}
            {watchedTokens
              .filter(token => token.chainId === currentChainId)
              .map((token) => (
                <div key={`${token.address}-${token.chainId}`} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                      <span className="text-xs font-bold">{token.symbol?.substring(0, 3)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-xs text-gray-400">{token.name || 'Unknown Token'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {showBalance ? `${formatTokenBalance(token.balance || '0', token.decimals)} ${token.symbol}` : '****'}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="mt-auto p-4 border-t border-gray-700">
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/add-token')}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加代币
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;