// 注入 inpage 脚本
const injectScript = () => {
  try {
    const script = document.createElement("script")
    const manifest = chrome.runtime.getManifest()
    const resources = manifest.web_accessible_resources?.[0] as { resources: string[] }
    if (!resources?.resources) {
      throw new Error("No web_accessible_resources found in manifest")
    }
    
    const inpageFile = resources.resources.find(f => f.startsWith("inpage"))
    if (!inpageFile) {
      throw new Error("Inpage script not found in manifest")
    }
    
    // Get the actual filename from the build directory
    const files = document.querySelector('script[src*="inpage"]')?.getAttribute('src')
    if (!files) {
      throw new Error("Could not find inpage script in DOM")
    }
    
    script.src = chrome.runtime.getURL(files)
    script.type = "module"
    ;(document.head || document.documentElement).appendChild(script)
    console.log("Injected inpage script successfully")
  } catch (err) {
    console.error("Failed to inject inpage script:", err)
  }
}

// 确保 DOM 加载完成后注入
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectScript)
} else {
  injectScript()
}

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
