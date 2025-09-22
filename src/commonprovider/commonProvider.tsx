import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

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
  setPassword: (password: string) => void;
  createWallet: (name?: string) => void;
  importWallet: (privateKey: string, name?: string) => void;
  selectAccount: (address: string) => void;
  selectChain: (chainId: string) => void;
  addWallet: (wallet: WalletAccount) => void;
  setCurrentAccount: (account: WalletAccount | null) => void;
  setCurrentChainId: (chainId: string) => void;
  setIsPasswordSet: (isSet: boolean) => void;
  setWallets: (wallets: WalletAccount[] | ((prev: WalletAccount[]) => WalletAccount[])) => void;
  setChains: (chains: ChainConfig[]) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<WalletAccount | null>(null);
  const [chains, setChains] = useState<ChainConfig[]>([
    {
      chainId: '0x1',
      chainName: 'Ethereum Mainnet',
      rpcUrls: ['https://mainnet.infura.io/v3/'],
      blockExplorerUrls: ['https://etherscan.io'],
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      }
    },
    {
      chainId: '0x89',
      chainName: 'Polygon Mainnet',
      rpcUrls: ['https://polygon-rpc.com'],
      blockExplorerUrls: ['https://polygonscan.com'],
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      }
    }
  ]);
  const [currentChainId, setCurrentChainId] = useState('0x1');
  const [password, setPasswordState] = useState('');
  const [isPasswordSet, setIsPasswordSet] = useState(false);

  const setPassword = (newPassword: string) => {
    console.log('Setting password in context:', newPassword);
    setPasswordState(newPassword);
    setIsPasswordSet(true);
    console.log('Password set and isPasswordSet updated to true');
  };

  // 默认选中第一个钱包
  useEffect(() => {
    if (wallets.length > 0 && !currentAccount) {
      setCurrentAccount(wallets[0]);
    }
  }, [wallets, currentAccount]);

  const addWallet = (wallet: WalletAccount) => {
    setWallets(prev => [...prev, wallet]);
    if (!currentAccount) {
      setCurrentAccount(wallet);
    }
  };

  const createWallet = (name?: string) => {
    // 模拟创建钱包
    const newWallet: WalletAccount = {
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      privateKey: `0x${Math.random().toString(16).substr(2, 64)}`,
      name: name || `Account ${wallets.length + 1}`
    };
    addWallet(newWallet);
  };

  const importWallet = (privateKey: string, name?: string) => {
    // 模拟导入钱包
    const importedWallet: WalletAccount = {
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      privateKey,
      name: name || `Imported Account ${wallets.length + 1}`
    };
    addWallet(importedWallet);
  };

  const selectAccount = (address: string) => {
    const account = wallets.find(w => w.address === address);
    if (account) {
      setCurrentAccount(account);
    }
  };

  const selectChain = (chainId: string) => {
    setCurrentChainId(chainId);
  };

  const value = {
    wallets,
    currentAccount,
    chains,
    currentChainId,
    password,
    isPasswordSet,
    setPassword,
    createWallet,
    importWallet,
    selectAccount,
    selectChain,
    addWallet,
    setCurrentAccount,
    setCurrentChainId,
    setIsPasswordSet,
    setWallets,
    setChains
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