import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { StorageManager, STORAGE_KEYS } from '../lib/storage';
import { CryptoService } from '../lib/crypto-service';

interface AuthContextType {
  isAuthenticated: boolean;
  password: string | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
  unlockWallet: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, password, login: storeLogin, logout: storeLogout, setIsAuthenticated, setPassword } = useAuthStore();
  
  const storage = StorageManager.getInstance();
  
  useEffect(() => {
    const initAuth = async () => {
      const auth = await storage.getItem('isAuthenticated') === 'true';
      const storedPassword = await storage.getItem<string>(STORAGE_KEYS.PASSWORD);
      setIsAuthenticated(auth);
      setPassword(storedPassword || null);
    };
    
    initAuth();
  }, []);

  const login = async (password: string) => {
    const storedHash = await storage.getItem<string>(STORAGE_KEYS.PASSWORD);
    
    if (storedHash) {
      // 如果存在密码哈希，则验证密码
      const isCorrect = CryptoService.verify(password, storedHash);
      if (!isCorrect) {
        throw new Error('密码错误');
      }
    } else {
      // 如果是首次登录，则设置密码
      const hash = CryptoService.encrypt(password);
      await storage.setItem(STORAGE_KEYS.PASSWORD, hash);
    }
    
    await storeLogin(password);
    await storage.setItem('isAuthenticated', 'true');
  };

  const unlockWallet = async (password: string) => {
    const storedHash = await storage.getItem<string>(STORAGE_KEYS.PASSWORD);
    const isCorrect = CryptoService.verify(password, storedHash);
    
    if (isCorrect) {
      setIsAuthenticated(true);
      await storage.setItem('isAuthenticated', 'true');
    }
    
    return isCorrect;
  };

  const logout = () => {
    storeLogout();
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