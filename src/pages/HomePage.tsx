import React from 'react';
import { Wallet, Settings } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: 'home' | 'wallet' | 'settings') => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {

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
            onClick={() => onNavigate('settings')}
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
            onClick={() => onNavigate('wallet')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            开始使用
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
