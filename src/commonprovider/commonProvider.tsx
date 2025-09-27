import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { StorageManager, STORAGE_KEYS, DEFAULT_DATA, type TokenAsset } from "../lib/storage";
import { walletService, type MnemonicWallet } from "../lib/wallet-service";
import { useAuth } from "../auth/AuthContext";
import { providerManager } from "../lib/provider";
import { CryptoService } from "~src/lib/crypto-service";
import { useWalletStore, type WalletAccount, type ChainConfig } from "../stores/walletStore";

interface WalletContextType {
  mnemonicWallets: MnemonicWallet[];
  refreshMnemonicWallets: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mnemonicWallets, setMnemonicWallets] = useState<MnemonicWallet[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { isAuthenticated, password } = useAuth();

  const storage = StorageManager.getInstance();

  // 用于所有钱包操作的密码优先级：参数 > context
  const getPassword = (passwordOverride?: string) => {
    if (passwordOverride) return CryptoService.encrypt(passwordOverride);
    if (!isAuthenticated || !password) {
      throw new Error("User is not authenticated");
    }
    return password;
  }

  // 加载数据
  const loadData = async () => {
    try {
      // 首先加载非钱包相关的持久化数据
      const [savedChains, savedCurrentChainId, savedWatchedTokens] = await Promise.all([
        storage.getItem<ChainConfig[]>(STORAGE_KEYS.CHAINS),
        storage.getItem<string>(STORAGE_KEYS.CURRENT_CHAIN_ID),
        storage.getItem<TokenAsset[]>(STORAGE_KEYS.WATCHED_TOKENS)
      ]);

      if (savedChains) useWalletStore.getState().setChains(savedChains);
      if (savedCurrentChainId) useWalletStore.getState().setCurrentChainId(savedCurrentChainId);
      if (savedWatchedTokens) useWalletStore.getState().setWatchedTokens(savedWatchedTokens);
      
      if (isAuthenticated && password) {
        // 如果已登录，则加载所有钱包
        const currentPassword = getPassword();
        await useWalletStore.getState().refreshWallets(currentPassword);
        
        // 加载助记词钱包
        await refreshMnemonicWallets();
      }

      console.log('Data loaded from storage');
    } catch (error) {
      console.error('Error loading data from storage:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated, password]);

  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      console.log("Current account or chain changed, refreshing watched tokens...");
      const currentPassword = getPassword();
      useWalletStore.getState().refreshWatchedTokens(currentPassword);
    }
  }, [useWalletStore().currentAccount, useWalletStore().currentChainId, isLoaded, isAuthenticated]);

  // 刷新助记词钱包
  const refreshMnemonicWallets = async () => {
    const currentPassword = getPassword();
    const mnemonics = await walletService.getMnemonicWallets(currentPassword);
    setMnemonicWallets(mnemonics);
  };

  if (!isLoaded) {
    return <div>Loading...</div>; // 或者一个更复杂的加载屏幕
  }

  const value = {
    mnemonicWallets,
    refreshMnemonicWallets,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};