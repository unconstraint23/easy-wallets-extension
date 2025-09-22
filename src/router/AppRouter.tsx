import React, { useState } from 'react';
import { WalletProvider } from '../commonprovider/commonProvider';
import HomePage from '../pages/HomePage';
import WalletPage from '../pages/WalletPage';
import SettingsPage from '../pages/SettingsPage';

type Page = 'home' | 'wallet' | 'settings';

const AppRouter: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('wallet');

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />;
      case 'wallet':
        return <WalletPage onNavigate={navigateTo} />;
      case 'settings':
        return <SettingsPage onNavigate={navigateTo} />;
      default:
        return <WalletPage onNavigate={navigateTo} />;
    }
  };

  return (
    <WalletProvider>
      <div className="w-80 h-[32rem] bg-gray-900 text-white">
        {renderPage()}
      </div>
    </WalletProvider>
  );
};

export default AppRouter;
