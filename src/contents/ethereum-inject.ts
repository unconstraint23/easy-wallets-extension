import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start",
  all_frames: true
}

/**
 * Injects a script into the page's context.
 * @param filePath - The path to the script file, relative to the extension's root.
 */
const injectScript = (filePath: string) => {
  try {
    const container = document.head || document.documentElement;
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(filePath);
    script.async = false;
    container.insertBefore(script, container.firstChild);
    script.onload = () => {
      console.log(`${filePath} injected and loaded.`);
      // The script can be removed after it has been executed.
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  } catch (error) {
    console.error(`Wallet injection failed for ${filePath}:`, error);
  }
};

// Inject the inpage script
injectScript('inpage.js');

// Listen for messages from the page (sent by the inpage script)
// and forward them to the background script.
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data || event.data.type !== 'ETHEREUM_REQUEST_FROM_PAGE') {
    return;
  }

  const { payload, id } = event.data;
  chrome.runtime.sendMessage({ type: 'ETHEREUM_REQUEST', payload }, (response) => {
    const error = chrome.runtime.lastError;
    // Post the response back to the page
    window.postMessage({
      type: 'ETHEREUM_RESPONSE_FROM_EXTENSION',
      id: id,
      response: {
        ...response,
        // Include runtime error if any
        error: error ? { message: error.message } : response?.error,
      }
    }, '*');
  });
});

// Listen for messages from the background script (e.g., account or chain changes)
// and forward them to the page.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only forward messages that are intended for the page
  if (message.type === 'ETHEREUM_ACCOUNT_CHANGED' || message.type === 'ETHEREUM_CHAIN_CHANGED') {
    window.postMessage(message, '*');
  }
  // It's good practice to return true for async sendResponse, though we don't use it here.
  return true;
});




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
