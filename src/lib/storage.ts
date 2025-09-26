import { CryptoService } from './crypto-service';

// 代币接口
export interface TokenAsset {
  address: string;
  symbol: string;
  decimals: number;
  image?: string;
  logoURI?: string; // 添加这个可选字段
  chainId: string; // 添加 chainId
  balance?: string; // 用于存储余额
  type: 'ERC20' | 'ERC721' | 'ERC1155';
  name?: string;
  tokenId?: string; // 对于ERC721/ERC1155
}

export interface ConnectionPermission {
  origin: string;
  accounts: string[];
  timestamp: number;
}

// 存储键名常量
export const STORAGE_KEYS = {
  PASSWORD: 'password_hash',
  WALLETS: 'encryptedWallets',
  MNEMONIC_WALLETS: 'encryptedMnemonicWallets',
  CURRENT_ACCOUNT_ADDRESS: 'current_account_address',
  CHAINS: 'chains',
  CURRENT_CHAIN_ID: 'current_chain_id',
  WATCHED_TOKENS: 'watched_tokens',
  CONNECTIONS: 'connections',
} as const;

// 存储工具类
export class StorageManager {
  private static instance: StorageManager;
  
  private constructor() {}
  
  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // 保存数据到 Chrome Storage
  async setItem<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  // 从 Chrome Storage 获取数据
  async getItem<T>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key] || null);
        }
      });
    });
  }

  // 删除数据
  async removeItem(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([key], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  // 清空所有数据
  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  // 监听存储变化
  onChanged(callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void): void {
    chrome.storage.onChanged.addListener(callback);
  }

  // 移除存储变化监听
  removeChangedListener(callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void): void {
    chrome.storage.onChanged.removeListener(callback);
  }

  // 设置密码并加密存储
  async setPassword(password: string): Promise<void> {
    const encryptedPassword = CryptoService.encrypt(password);
    await this.setItem(STORAGE_KEYS.PASSWORD, encryptedPassword);
  }
}

// 默认数据
export const DEFAULT_DATA = {
  wallets: [],
  currentAccount: null,
  chains: [
    {
      chainId: `0x${process.env.PLASMO_PUBLIC_ALCHEMY_MAINNET_CHAINID}`,
      chainName: 'Ethereum Mainnet',
      rpcUrls: [`${process.env.PLASMO_PUBLIC_ALCHEMY_MAINNET_URL}`],
      blockExplorerUrls: ['https://etherscan.io'],
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      }
    },
    {
      chainId: `0x${process.env.PLASMO_PUBLIC_SEPOLIA_CHAINID}`,
      chainName: 'Sepolia Testnet',
      rpcUrls: [`${process.env.PLASMO_PUBLIC_SEPOLIA_URL}`],
      blockExplorerUrls: ['https://etherscan.io'],
      nativeCurrency: {
        name: 'Sepolia Ether',
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
  ],
  currentChainId: `0x${process.env.PLASMO_PUBLIC_SEPOLIA_CHAINID || 'aa36a7'}`,
  password: '',
  isPasswordSet: false,
  currentPage: 'wallet',
  watchedTokens: [] as TokenAsset[],
  connectionPermissions: [] as ConnectionPermission[]
};
