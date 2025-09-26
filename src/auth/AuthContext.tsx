import React, { useState, createContext, useContext, useEffect } from 'react';
import { StorageManager, STORAGE_KEYS } from '../lib/storage';
import { CryptoService } from '../lib/crypto-service';

interface AuthContextType {
  isAuthenticated: boolean;
  password: null | string;
  login: (password: string) => Promise<void>;
  logout: () => void;
  unlockWallet: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storage = StorageManager.getInstance();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  useEffect(() => {
    checkAuth();
  }, []);
  const [password, setPassword] = useState<string|null>(null);
  
  const checkAuth = async () => {
    const auth = await storage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(auth);
  }
  const login = async (password: string) => {
    
    const storedHash = await storage.getItem<string>(STORAGE_KEYS.PASSWORD);
    
    const hash = CryptoService.encrypt(password);
    if (storedHash) {
      // 如果存在密码哈希，则验证密码
      const isCorrect = CryptoService.verify(password, storedHash);
      if (!isCorrect) {
        throw new Error('密码错误');
      }
    } else {
      // 如果是首次登录，则设置密码
      await storage.setItem(STORAGE_KEYS.PASSWORD, hash);
    }
    
    setIsAuthenticated(true);
    setPassword(password);
    await storage.setItem('isAuthenticated', 'true');
  };

  const unlockWallet = async (password: string) => {
    const storage = StorageManager.getInstance();
    const storedHash = await storage.getItem<string>(STORAGE_KEYS.PASSWORD);
    
    
      const isCorrect = CryptoService.verify(password, storedHash);
      if(isCorrect) {
        setIsAuthenticated(true);
        await storage.setItem('isAuthenticated', 'true');
      }
      return isCorrect;
    
  }

  const logout = () => {
    setIsAuthenticated(false);
    setPassword(null);
    sessionStorage.removeItem('isAuthenticated');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, password, login, logout, unlockWallet }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
