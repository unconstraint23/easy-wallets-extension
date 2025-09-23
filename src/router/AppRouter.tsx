import React, { useState, useEffect } from 'react';
import { WalletProvider } from '../commonprovider/commonProvider';
import { StorageManager, STORAGE_KEYS, DEFAULT_DATA } from '../lib/storage';
import HomePage from '../pages/HomePage';
import WalletPage from '../pages/WalletPage';
import SettingsPage from '../pages/SettingsPage';
import AccountDetailPage from '../pages/AccountDetailPage';

type Page = 'home' | 'wallet' | 'settings' | 'accountDetail';

const AppRouter: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(DEFAULT_DATA.currentPage as Page);
  const [isLoaded, setIsLoaded] = useState(false);
  const storage = StorageManager.getInstance();

  // 加载页面状态
  useEffect(() => {
    const loadPageState = async () => {
      try {
        const savedPage = await storage.getItem<Page>(STORAGE_KEYS.CURRENT_PAGE);
        if (savedPage) {
          setCurrentPage(savedPage);
        }
      } catch (error) {
        console.error('Error loading page state:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPageState();
  }, []);

  const navigateTo = async (page: Page) => {
    setCurrentPage(page);
    try {
      await storage.setItem(STORAGE_KEYS.CURRENT_PAGE, page);
      console.log('Page state saved to storage');
    } catch (error) {
      console.error('Error saving page state:', error);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />;
      case 'wallet':
        return <WalletPage onNavigate={navigateTo} />;
      case 'settings':
        return <SettingsPage onNavigate={navigateTo} />;
      case 'accountDetail':
        return <AccountDetailPage onNavigate={navigateTo} />;
      default:
        return <WalletPage onNavigate={navigateTo} />;
    }
  };

  // 显示加载状态
  if (!isLoaded) {
    return (
      <WalletProvider>
        <div className="w-[400px] h-[32rem] bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">加载中...</p>
          </div>
        </div>
      </WalletProvider>
    );
  }

  return (
    <WalletProvider>
      <div className="w-[400px] h-[32rem] bg-gray-900 text-white">
        {renderPage()}
      </div>
    </WalletProvider>
  );
};

export default AppRouter;
