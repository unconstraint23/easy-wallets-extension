import "../inpage"

// --- 监听页面消息，转发到 background ---
window.addEventListener("message", (event) => {
  if (event.source !== window) return
  if (event.data?.__MYWALLET_REQUEST__) {
    chrome.runtime.sendMessage(event.data.__MYWALLET_REQUEST__, (response) => {
      window.postMessage({ __MYWALLET_RESPONSE__: response }, "*")
    })
  }
})





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



declare global {
  interface Window {
    ethereum?: EthereumProvider;
    mywallet?: MyWalletProvider;
  }
}

// "web_accessible_resources": [
//   {
//     "matches": ["<all_urls>"],
//     "resources": ["inpage.*.js"]
//   }
// ]
