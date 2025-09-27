import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { StorageManager, STORAGE_KEYS, DEFAULT_DATA, type TokenAsset } from "../lib/storage";
import { walletService, type MnemonicWallet } from "../lib/wallet-service";
import { useAuth } from "../auth/AuthContext";
import { providerManager } from "../lib/provider";
import { CryptoService } from "~src/lib/crypto-service";

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
  watchedTokens: TokenAsset[];
  mnemonicWallets: MnemonicWallet[];
  createWallet: (name?: string, passwordOverride?: string) => Promise<void>;
  importWalletFromMnemonic: (mnemonic: string, name?: string, passwordOverride?: string) => Promise<void>;
  importWalletFromPrivateKey: (privateKey: string, name?: string, passwordOverride?: string) => Promise<void>;
  generateMnemonic: () => string;
  importMnemonicWallet: (mnemonic: string, passphrase?: string, name?: string, passwordOverride?: string) => Promise<void>;
  selectAccount: (address: string) => void;
  selectChain: (chainId: string) => void;
  addWallet: (wallet: WalletAccount) => void;
  setCurrentAccount: (account: WalletAccount | null) => void;
  setCurrentChainId: (chainId: string) => void;
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
  const [watchedTokens, setWatchedTokens] = useState<TokenAsset[]>(DEFAULT_DATA.watchedTokens);
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

  const refreshWallets = async () => {
    const currentPassword = getPassword();
    const updatedWallets = await walletService.getWallets(currentPassword);
    setWallets(updatedWallets);
    return updatedWallets; // 返回更新后的钱包列表
  };

  // 加载数据
  const loadData = async () => {
    try {
      // 首先加载非钱包相关的持久化数据
      const [savedCurrentAccountAddress, savedChains, savedCurrentChainId, savedWatchedTokens] = await Promise.all([
        storage.getItem<string>(STORAGE_KEYS.CURRENT_ACCOUNT_ADDRESS),
        storage.getItem<ChainConfig[]>(STORAGE_KEYS.CHAINS),
        storage.getItem<string>(STORAGE_KEYS.CURRENT_CHAIN_ID),
        storage.getItem<TokenAsset[]>(STORAGE_KEYS.WATCHED_TOKENS)
      ]);

      if (savedChains) setChains(savedChains);
      if (savedCurrentChainId) setCurrentChainId(savedCurrentChainId);
      if (savedWatchedTokens) setWatchedTokens(savedWatchedTokens);
      
      if (isAuthenticated && password) {
        // 如果已登录，则加载所有钱包
        const updatedWallets = await refreshWallets();
        
        // 从加载后的钱包列表中恢复当前账户
        if (updatedWallets.length > 0) {
          const accountToSelect = updatedWallets.find(w => w.address === savedCurrentAccountAddress) || updatedWallets[0];
          console.log("Restoring current account:", accountToSelect);
          setCurrentAccount(accountToSelect);
        } else {
          setCurrentAccount(null);
        }

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

  // 保存当前账户地址
  const saveCurrentAccountAddress = async (account: WalletAccount | null) => {
    try {
      if (account) {
        await storage.setItem(STORAGE_KEYS.CURRENT_ACCOUNT_ADDRESS, account.address);
      } else {
        await storage.removeItem(STORAGE_KEYS.CURRENT_ACCOUNT_ADDRESS);
      }
      console.log('Current account address saved to storage');
    } catch (error) {
      console.error('Error saving current account address:', error);
    }
  };

  // 保存当前链ID
  const saveCurrentChainId = async (chainId: string) => {
    try {
      await storage.setItem(STORAGE_KEYS.CURRENT_CHAIN_ID, chainId);
      console.log('Current chainId saved to storage');
    } catch (error) {
      console.error('Error saving current chainId:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated, password]);

  useEffect(() => {
    if (isLoaded) {
      saveCurrentAccountAddress(currentAccount);
    }
  }, [currentAccount, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveCurrentChainId(currentChainId);
    }
  }, [currentChainId, isLoaded]);

  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      console.log("Current account or chain changed, refreshing watched tokens...");
      refreshWatchedTokens();
    }
  }, [currentAccount, currentChainId, isLoaded, isAuthenticated]);


  const createWallet = async (name?: string, passwordOverride?: string) => {
    const currentPassword = getPassword(passwordOverride);
    await walletService.createWallet(currentPassword, name);
    await refreshWallets();
  };

  const importWalletFromMnemonic = async (mnemonic: string, name?: string, passwordOverride?: string) => {
    const currentPassword = getPassword(passwordOverride);
    await walletService.importWalletFromMnemonic(currentPassword, mnemonic, name);
    await refreshWallets();
  };

  const importWalletFromPrivateKey = async (privateKey: string, name?: string, passwordOverride?: string) => {
    const currentPassword = getPassword(passwordOverride);
    await walletService.importWalletFromPrivateKey(currentPassword, privateKey, name);
    await refreshWallets();
  };

  // 生成助记词
  const generateMnemonic = () => {
    return walletService.generateMnemonic();
  };

  // 导入助记词钱包
  const importMnemonicWallet = async (mnemonic: string, passphrase?: string, name?: string, passwordOverride?: string) => {
    const currentPassword = getPassword(passwordOverride);
    await walletService.importMnemonicWallet(currentPassword, mnemonic, passphrase, 1);
    await refreshMnemonicWallets();
    await refreshWallets(); // 导入后也刷新普通钱包列表
  };

  // 选择账户
  const selectAccount = async (address: string) => {
    const currentPassword = getPassword();
    const account = await walletService.getWalletByAddress(currentPassword, address);
    if (account) {
      setCurrentAccount(account);
    }
  };

  // 选择链
  const selectChain = (chainId: string) => {
    setCurrentChainId(chainId);
  };

  // 添加钱包（主要用于测试或特殊情况）
  const addWallet = async (wallet: WalletAccount) => {
    // This is a private method, so we can't call it directly.
    // We should create a public method in wallet-service for this.
    // For now, let's assume there's a method like `addNewWallet`
    // await walletService.saveWallet(wallet); 
    console.warn("addWallet is not fully implemented due to private saveWallet method.");
    await refreshWallets();
  };

  // 添加监控的代币
  const addWatchedToken = async (token: Omit<TokenAsset, 'balance'>) => {
    const newTokens = [...watchedTokens, token as TokenAsset];
    console.log("Add watched token:", newTokens);
    setWatchedTokens(newTokens);
    await storage.setItem(STORAGE_KEYS.WATCHED_TOKENS, newTokens);
    // 添加后立即刷新余额
    await refreshWatchedTokens();
  };

  // 移除监控的代币
  const removeWatchedToken = async (tokenAddress: string) => {
    const newTokens = watchedTokens.filter(t => t.address !== tokenAddress);
    setWatchedTokens(newTokens);
    await storage.setItem(STORAGE_KEYS.WATCHED_TOKENS, newTokens);
  };

  // 刷新监控代币的余额
  const refreshWatchedTokens = async () => {
    const currentPassword = getPassword();
    if (!currentAccount || !currentChainId) {
      console.log("Cannot refresh token balances: no current account or chain.");
      return;
    }

    const currentChain = chains.find(c => c.chainId === currentChainId);
    if (!currentChain) {
      console.log("Cannot refresh token balances: current chain config not found.");
      return;
    }

    console.log("Refreshing watched tokens balances...");
    let data = await storage.getItem<TokenAsset[]>(STORAGE_KEYS.WATCHED_TOKENS);
    console.log(data, "watchedTokens");
    const updatedTokens = await Promise.all(
      data
        .filter(token => token.chainId === currentChainId) // 只刷新当前链的代币
        .map(async (token) => {
          try {
            const balance = await providerManager.getTokenBalance(
              currentChain,
              token.address,
              token.type,
              token.decimals,
              currentAccount.address
            );
            console.log(`Balance for ${token.symbol} (${token.address}):`, balance);
            return { ...token, balance };
          } catch (error) {
            console.error(`Failed to get balance for ${token.symbol}:`, error);
            return { ...token, balance: '0' }; // 出错时余额设为0
          }
        })
    );
    console.log("Updated tokens:", updatedTokens);
    // 合并刷新后的代币和未刷新的代币（其他链的）
    const finalTokens = data.map(
      (t) => updatedTokens.find((ut) => ut.address === t.address && ut.chainId === t.chainId) || t
    );

    setWatchedTokens(finalTokens);
    await storage.setItem(STORAGE_KEYS.WATCHED_TOKENS, finalTokens);
    console.log("Token balances refreshed and saved.");
  };

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
    wallets,
    currentAccount,
    chains,
    currentChainId,
    watchedTokens,
    mnemonicWallets,
    createWallet,
    importWalletFromMnemonic,
    importWalletFromPrivateKey,
    generateMnemonic,
    importMnemonicWallet,
    selectAccount,
    selectChain,
    addWallet,
    setCurrentAccount,
    setCurrentChainId,
    setWallets,
    setChains,
    addWatchedToken,
    removeWatchedToken,
    refreshWatchedTokens,
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