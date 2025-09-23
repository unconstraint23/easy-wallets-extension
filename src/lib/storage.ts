// 代币接口
export interface TokenAsset {
  address: string;
  symbol: string;
  decimals: number;
  image?: string;
  type: 'ERC20' | 'ERC721' | 'ERC1155';
  name?: string;
  tokenId?: string; // 对于ERC721/ERC1155
}

export interface ConnectionPermission {
  origin: string;
  accounts: string[];
  timestamp: number;
}

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
}

// 存储键名常量
export const STORAGE_KEYS = {
  WALLETS: 'wallets',
  CURRENT_ACCOUNT: 'currentAccount',
  CHAINS: 'chains',
  CURRENT_CHAIN_ID: 'currentChainId',
  PASSWORD: 'password',
  IS_PASSWORD_SET: 'isPasswordSet',
  CURRENT_PAGE: 'currentPage',
  WATCHED_TOKENS: 'watchedTokens',
  MNEMONIC_WALLETS: 'mnemonicWallets',
  CONNECTION_PERMISSIONS: 'connectionPermissions'
} as const;

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
