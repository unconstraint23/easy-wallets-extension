import React from 'react';
import { Wallet, Settings, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../commonprovider/commonProvider';
import { providerManager } from '../lib/provider';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { watchedTokens } = useWallet();

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Wallet className="w-6 h-6 text-blue-500 mr-2" />
            <h1 className="text-lg font-bold">钱包</h1>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">欢迎使用钱包</h2>
          <p className="text-gray-400 mb-6">请先设置密码并创建或导入钱包</p>
          <button
            onClick={() => navigate('/wallet')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            开始使用
          </button>
        </div>

        {/* Token List */}
        <div className="mt-6">
          <div className="space-y-3">
            {watchedTokens.map((token) => (
              <div key={token.address} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <img src={token.logoURI || `https://via.placeholder.com/32/000000/FFFFFF/?text=${token.symbol.charAt(0)}`} alt={token.name} className="w-8 h-8 rounded-full mr-3" />
                  <div>
                    <div className="font-semibold">{token.symbol}</div>
                    <div className="text-sm text-gray-400">{token.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{token.balance ?? '...'}</div>
                  {/* <div className="text-sm text-gray-400">$0.00</div> */}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex justify-between">
            <button
              onClick={() => navigate('/send')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              发送
            </button>
            <button
              onClick={() => navigate('/receive')}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              接收
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
