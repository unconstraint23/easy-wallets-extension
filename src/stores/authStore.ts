import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chromeStorage } from './chrome-storage';

interface AuthState {
  isAuthenticated: boolean;
  password: string | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
  unlockWallet: (password: string) => Promise<boolean>;
  setPassword: (password: string | null) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      password: null,
      
      login: async (password: string) => {
        // 这里应该实现实际的登录逻辑
        // 目前简化处理
        set({ isAuthenticated: true, password });
      },
      
      logout: () => {
        set({ isAuthenticated: false, password: null });
      },
      
      unlockWallet: async (password: string) => {
        // 这里应该实现实际的解锁逻辑
        // 目前简化处理
        set({ isAuthenticated: true });
        return true;
      },
      
      setPassword: (password) => set({ password }),
      setIsAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
    }),
    {
      name: 'auth-storage',
      storage: chromeStorage,
    }
  )
);