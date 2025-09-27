import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Plus, Download } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/wallet');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* 头部 */}
      <div className="p-6 pt-12 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">欢迎使用钱包</h1>
        <p className="text-gray-400">安全、便捷的数字资产管理工具</p>
      </div>

      {/* 功能介绍 */}
      <div className="flex-1 p-6">
        <div className="bg-gray-800 rounded-xl p-5 mb-5">
          <div className="flex items-start mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold mb-1">安全存储</h3>
              <p className="text-sm text-gray-400">采用银行级加密技术保护您的资产安全</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 mb-5">
          <div className="flex items-start mb-4">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mr-3 flex-shrink-0">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold mb-1">多链支持</h3>
              <p className="text-sm text-gray-400">支持以太坊、Polygon 等主流区块链网络</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-5">
          <div className="flex items-start">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold mb-1">便捷操作</h3>
              <p className="text-sm text-gray-400">简单易用的界面，轻松管理您的数字资产</p>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="p-6">
        <button
          onClick={() => navigate('/create')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md mb-3 transition-colors"
        >
          创建新钱包
        </button>
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
        >
          导入已有钱包
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;