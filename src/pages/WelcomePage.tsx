import React, { useState, useEffect } from 'react';
import { StorageManager, STORAGE_KEYS } from '../lib/storage';
import CreateWalletPage from '../pages/CreateWalletPage';
import UnlockPage from '../pages/UnlockPage';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import WalletPage from './WalletPage';
const WelcomePage: React.FC = () => {
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
  useEffect(() => {
    const checkFirstTime = async () => {
      const storage = StorageManager.getInstance();
      const password = await storage.getItem(STORAGE_KEYS.PASSWORD);
      console.log('WelcomePage checkFirstTime', password);
      setIsFirstTime(password === null);
    };
    checkFirstTime();
  }, []);
  const successCb = () => {
    navigate('/wallet');
  };

  if (isFirstTime === null) {
    // 正在检查状态，可以显示一个加载指示器
    return <div>Loading...</div>;
  }

  return isFirstTime ? <CreateWalletPage /> : isAuthenticated ? <WalletPage /> : <UnlockPage onSuccess={successCb} />;
};

export default WelcomePage;
