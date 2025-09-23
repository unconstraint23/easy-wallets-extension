import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { StorageManager, STORAGE_KEYS, DEFAULT_DATA, type TokenAsset } from "../lib/storage";
import { walletService, type MnemonicWallet } from "../lib/wallet-service";

interface WalletAccount {
  address: string;
  privateKey: string;
  name?: string;
}

interface ChainConfig {
  chainId: string;
  chainName: string;
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

interface WalletContextType {
  wallets: WalletAccount[];
  currentAccount: WalletAccount | null;
  chains: ChainConfig[];
  currentChainId: string;
  password: string;
  isPasswordSet: boolean;
  watchedTokens: TokenAsset[];
  mnemonicWallets: MnemonicWallet[];
  setPassword: (password: string) => void;
  createWallet: (name?: string) => void;
  importWallet: (privateKey: string, name?: string) => void;
  generateMnemonic: () => string;
  importMnemonicWallet: (mnemonic: string, passphrase?: string, name?: string) => Promise<void>;
  selectAccount: (address: string) => void;
  selectChain: (chainId: string) => void;
  addWallet: (wallet: WalletAccount) => void;
  setCurrentAccount: (account: WalletAccount | null) => void;
  setCurrentChainId: (chainId: string) => void;
  setIsPasswordSet: (isSet: boolean) => void;
  setWallets: (wallets: WalletAccount[] | ((prev: WalletAccount[]) => WalletAccount[])) => void;
  setChains: (chains: ChainConfig[]) => void;
  addWatchedToken: (token: TokenAsset) => void;
  removeWatchedToken: (tokenAddress: string) => void;
  refreshWatchedTokens: () => Promise<void>;
  refreshMnemonicWallets: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallets, setWallets] = useState<WalletAccount[]>(DEFAULT_DATA.wallets);
  const [currentAccount, setCurrentAccount] = useState<WalletAccount | null>(DEFAULT_DATA.currentAccount);
  const [chains, setChains] = useState<ChainConfig[]>(DEFAULT_DATA.chains);
  const [currentChainId, setCurrentChainId] = useState(DEFAULT_DATA.currentChainId);
  const [password, setPasswordState] = useState(DEFAULT_DATA.password);
  const [isPasswordSet, setIsPasswordSet] = useState(DEFAULT_DATA.isPasswordSet);
  const [watchedTokens, setWatchedTokens] = useState<TokenAsset[]>(DEFAULT_DATA.watchedTokens);
  const [mnemonicWallets, setMnemonicWallets] = useState<MnemonicWallet[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const storage = StorageManager.getInstance();

  // 加载数据
  const loadData = async () => {
    try {
      const [savedCurrentAccount, savedChains, savedCurrentChainId, savedPassword, savedIsPasswordSet, savedWatchedTokens] = await Promise.all([
        storage.getItem<WalletAccount | null>(STORAGE_KEYS.CURRENT_ACCOUNT),
        storage.getItem<ChainConfig[]>(STORAGE_KEYS.CHAINS),
        storage.getItem<string>(STORAGE_KEYS.CURRENT_CHAIN_ID),
        storage.getItem<string>(STORAGE_KEYS.PASSWORD),
        storage.getItem<boolean>(STORAGE_KEYS.IS_PASSWORD_SET),
        storage.getItem<TokenAsset[]>(STORAGE_KEYS.WATCHED_TOKENS)
      ]);

      if (savedCurrentAccount) setCurrentAccount(savedCurrentAccount);
      if (savedChains) setChains(savedChains);
      if (savedCurrentChainId) setCurrentChainId(savedCurrentChainId);
      if (savedPassword) setPasswordState(savedPassword);
      if (savedIsPasswordSet !== null) setIsPasswordSet(savedIsPasswordSet);
      if (savedWatchedTokens) setWatchedTokens(savedWatchedTokens);

      // 如果密码已设置，从加密存储加载钱包
      if (savedIsPasswordSet && savedPassword) {
        try {
          await walletService.setPassword(savedPassword);
          const encryptedWallets = await walletService.getWallets();
          setWallets(encryptedWallets);
        } catch (error) {
          console.error('Error loading encrypted wallets:', error);
          setWallets([]);
        }
      }

      // 加载助记词钱包
      await refreshMnemonicWallets();

      console.log('Data loaded from storage');
    } catch (error) {
      console.error('Error loading data from storage:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  

  // 保存当前账户
  const saveCurrentAccount = async (account: WalletAccount | null) => {
    try {
      await storage.setItem(STORAGE_KEYS.CURRENT_ACCOUNT, account);
      console.log('Current account saved to storage');
    } catch (error) {
      console.error('Error saving current account:', error);
    }
  };

  // 保存链数据
  const saveChains = async (newChains: ChainConfig[]) => {
    try {
      await storage.setItem(STORAGE_KEYS.CHAINS, newChains);
      console.log('Chains saved to storage');
    } catch (error) {
      console.error('Error saving chains:', error);
    }
  };

  // 保存当前链ID
  const saveCurrentChainId = async (chainId: string) => {
    try {
      await storage.setItem(STORAGE_KEYS.CURRENT_CHAIN_ID, chainId);
      console.log('Current chain ID saved to storage');
    } catch (error) {
      console.error('Error saving current chain ID:', error);
    }
  };

  // 保存密码状态
  const savePasswordState = async (password: string, isSet: boolean) => {
    try {
      await Promise.all([
        storage.setItem(STORAGE_KEYS.PASSWORD, password),
        storage.setItem(STORAGE_KEYS.IS_PASSWORD_SET, isSet)
      ]);
      console.log('Password state saved to storage');
    } catch (error) {
      console.error('Error saving password state:', error);
    }
  };

  const setPassword = (newPassword: string) => {
    console.log('Setting password in context:', newPassword);
    setPasswordState(newPassword);
    setIsPasswordSet(true);
    savePasswordState(newPassword, true);
    console.log('Password set and isPasswordSet updated to true');
  };

  // 初始化时加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 默认选中第一个钱包
  useEffect(() => {
    if (wallets.length > 0 && !currentAccount) {
      setCurrentAccount(wallets[0]);
      saveCurrentAccount(wallets[0]);
    }
  }, [wallets, currentAccount]);

  // 钱包状态现在通过WalletService自动保存到加密存储
  // 不需要手动监听和保存钱包状态变化

  useEffect(() => {
    if (isLoaded) {
      saveCurrentAccount(currentAccount);
    }
  }, [currentAccount, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveChains(chains);
    }
  }, [chains, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveCurrentChainId(currentChainId);
    }
  }, [currentChainId, isLoaded]);

  const addWallet = (wallet: WalletAccount) => {
    // 检查是否已存在相同地址的钱包
    const existingWallet = wallets.find(w => w.address.toLowerCase() === wallet.address.toLowerCase());
    if (existingWallet) {
      console.log('Wallet already exists:', wallet.address);
      return;
    }
    
    const newWallets = [...wallets, wallet];
    setWallets(newWallets);
    if (!currentAccount) {
      setCurrentAccount(wallet);
      saveCurrentAccount(wallet);
    }
  };

  const createWallet = async (name?: string) => {
    try {
      await walletService.setPassword(password);
      const newWallet = await walletService.createWallet(name);
      addWallet(newWallet);
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  };

  const importWallet = async (privateKey: string, name?: string) => {
    try {
      await walletService.setPassword(password);
      const importedWallet = await walletService.importWallet(privateKey, name);
      addWallet(importedWallet);
    } catch (error) {
      console.error('Error importing wallet:', error);
      throw error;
    }
  };

  const selectAccount = (address: string) => {
    const account = wallets.find(w => w.address === address);
    if (account) {
      setCurrentAccount(account);
      saveCurrentAccount(account);
    }
  };

  const selectChain = (chainId: string) => {
    setCurrentChainId(chainId);
    saveCurrentChainId(chainId);
  };

  // 生成助记词
  const generateMnemonic = () => {
    return walletService.generateMnemonic();
  };

  // 导入助记词钱包
  const importMnemonicWallet = async (mnemonic: string, passphrase?: string, name?: string) => {
    try {
      await walletService.setPassword(password);
      const mnemonicWallet = await walletService.importMnemonicWallet(mnemonic, passphrase);
      
      // 将助记词钱包中的账户添加到钱包列表
      mnemonicWallet.accounts.forEach(account => {
        if (name) {
          account.name = name;
        }
        addWallet(account);
      });
      
      // 刷新助记词钱包列表
      await refreshMnemonicWallets();
    } catch (error) {
      console.error('Error importing mnemonic wallet:', error);
      throw error;
    }
  };

  // 添加观察的代币
  const addWatchedToken = async (token: TokenAsset) => {
    const newTokens = [...watchedTokens, token];
    setWatchedTokens(newTokens);
    await storage.setItem(STORAGE_KEYS.WATCHED_TOKENS, newTokens);
  };

  // 移除观察的代币
  const removeWatchedToken = async (tokenAddress: string) => {
    const newTokens = watchedTokens.filter(token => token.address !== tokenAddress);
    setWatchedTokens(newTokens);
    await storage.setItem(STORAGE_KEYS.WATCHED_TOKENS, newTokens);
  };

  // 刷新观察的代币
  const refreshWatchedTokens = async () => {
    try {
      const tokens = await storage.getItem<TokenAsset[]>(STORAGE_KEYS.WATCHED_TOKENS) || [];
      setWatchedTokens(tokens);
    } catch (error) {
      console.error('Error refreshing watched tokens:', error);
    }
  };

  // 刷新助记词钱包
  const refreshMnemonicWallets = async () => {
    try {
      if (isPasswordSet && password) {
        await walletService.setPassword(password);
        const mnemonicWallets = await walletService.getMnemonicWallets();
        setMnemonicWallets(mnemonicWallets);
      }
    } catch (error) {
      console.error('Error refreshing mnemonic wallets:', error);
    }
  };

  const value = {
    wallets,
    currentAccount,
    chains,
    currentChainId,
    password,
    isPasswordSet,
    watchedTokens,
    mnemonicWallets,
    setPassword,
    createWallet,
    importWallet,
    generateMnemonic,
    importMnemonicWallet,
    selectAccount,
    selectChain,
    addWallet,
    setCurrentAccount,
    setCurrentChainId,
    setIsPasswordSet,
    setWallets,
    setChains,
    addWatchedToken,
    removeWatchedToken,
    refreshWatchedTokens,
    refreshMnemonicWallets
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
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};