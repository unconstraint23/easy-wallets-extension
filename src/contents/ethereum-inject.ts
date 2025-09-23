import { rpcHandler } from '../lib/rpc-handler';

// Plasmo content script config
export const config = {
  matches: ["<all_urls>"],
  all_frames: true,
  run_at: "document_start"
}

// 创建 ethereum 对象
const ethereum = {
  isMetaMask: false,
  isMyWallet: true,
  isConnected: () => true,
  request: async (request: any) => {
    console.log('Ethereum request:', request);
    
    // 通过 chrome.runtime.sendMessage 发送到 background script
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'ETHEREUM_REQUEST', payload: request },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (response.error) {
            reject(new Error(response.error.message));
            return;
          }
          
          resolve(response.result);
        }
      );
    });
  },
  
  // 事件监听器
  on: (event: string, callback: Function) => {
    console.log('Ethereum event listener added:', event);
    // 这里可以添加事件监听逻辑
  },
  
  removeListener: (event: string, callback: Function) => {
    console.log('Ethereum event listener removed:', event);
  },
  
  // 账户相关
  selectedAddress: null,
  chainId: `0x${Number(`${process.env.PLASMO_PUBLIC_ALCHEMY_MAINNET_CHAINID}`).toString(16)}`,
  
  // 网络相关
  networkVersion: '1',
  
  // 其他常用方法
  enable: async () => {
    return await ethereum.request({ method: 'eth_requestAccounts' });
  },
  
  send: async (method: string, params?: any[]) => {
    return await ethereum.request({ method, params });
  },
  
  sendAsync: async (request: any, callback: Function) => {
    try {
      const result = await ethereum.request(request);
      callback(null, { result });
    } catch (error) {
      callback(error, null);
    }
  }
};

// 创建 mywallet 对象
const mywallet = {
  ...ethereum,
  version: '1.0.0',
  name: 'MyWallet',
  
  // 自定义方法
  generateMnemonic: async () => {
    return await ethereum.request({ method: 'wallet_generateMnemonic' });
  },
  
  importMnemonic: async (mnemonic: string, passphrase?: string) => {
    return await ethereum.request({ 
      method: 'wallet_importMnemonic', 
      params: [mnemonic, passphrase] 
    });
  },
  
  getTokenBalance: async (tokenAddress: string, walletAddress?: string) => {
    const address = walletAddress || ethereum.selectedAddress;
    if (!address) {
      throw new Error('No wallet address available');
    }
    return await ethereum.request({ 
      method: 'eth_getTokenBalance', 
      params: [address, tokenAddress] 
    });
  },
  
  watchAsset: async (type: string, options: any) => {
    return await ethereum.request({ 
      method: 'wallet_watchAsset', 
      params: [{ type, options }] 
    });
  },
  
  getWatchedTokens: async () => {
    return await ethereum.request({ method: 'wallet_getWatchedTokens' });
  },

  sendEthTransaction: async (to: string, value: string) => {
    return await ethereum.request({ 
      method: 'wallet_sendEthTransaction', 
      params: [to, value] 
    });
  },

  sendTokenTransaction: async (tokenAddress: string, to: string, amount: string) => {
    return await ethereum.request({ 
      method: 'wallet_sendTokenTransaction', 
      params: [tokenAddress, to, amount] 
    });
  }
};

// 注入到页面
if (typeof window !== 'undefined') {
  // 检查是否已经存在 ethereum 对象
  if (!window.ethereum) {
    (window as any).ethereum = ethereum;
    console.log('Ethereum object injected');
  }
  
  // 注入 mywallet 对象
  (window as any).mywallet = mywallet;
  console.log('MyWallet object injected');
  
  // 监听来自 background script 的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ETHEREUM_ACCOUNT_CHANGED') {
      ethereum.selectedAddress = message.address;
      // 触发账户变化事件
      window.dispatchEvent(new CustomEvent('ethereum#accountsChanged', {
        detail: message.address ? [message.address] : []
      }));
    }
    
    if (message.type === 'ETHEREUM_CHAIN_CHANGED') {
      ethereum.chainId = message.chainId;
      ethereum.networkVersion = parseInt(message.chainId, 16).toString();
      // 触发链变化事件
      window.dispatchEvent(new CustomEvent('ethereum#chainChanged', {
        detail: message.chainId
      }));
    }
    
    sendResponse({ success: true });
  });
}

// 导出类型定义
export interface EthereumProvider {
  isMetaMask: boolean;
  isMyWallet: boolean;
  isConnected: () => boolean;
  request: (request: any) => Promise<any>;
  on: (event: string, callback: Function) => void;
  removeListener: (event: string, callback: Function) => void;
  selectedAddress: string | null;
  chainId: string;
  networkVersion: string;
  enable: () => Promise<string[]>;
  send: (method: string, params?: any[]) => Promise<any>;
  sendAsync: (request: any, callback: Function) => void;
}

export interface MyWalletProvider extends EthereumProvider {
  version: string;
  name: string;
  generateMnemonic: () => Promise<string>;
  importMnemonic: (mnemonic: string, passphrase?: string) => Promise<any>;
  getTokenBalance: (tokenAddress: string, walletAddress?: string) => Promise<string>;
  watchAsset: (type: string, options: any) => Promise<boolean>;
  getWatchedTokens: () => Promise<any[]>;
  sendEthTransaction: (to: string, value: string) => Promise<string>;
  sendTokenTransaction: (tokenAddress: string, to: string, amount: string) => Promise<string>;
}

// 添加默认导出
export default ethereum;

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    mywallet?: MyWalletProvider;
  }
}
