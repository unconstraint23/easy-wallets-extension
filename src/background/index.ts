import { rpcHandler } from '../lib/rpc-handler';
import { walletService } from '../lib/wallet-service';

// 监听来自 content script 和其他地方的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ETHEREUM_REQUEST') {
    handleEthereumRequest(message.payload, sender, sendResponse);
    return true; // 保持消息通道开放以进行异步响应
  }
  
  if (message.type === 'CONNECTION_RESPONSE') {
    const { requestId, approved } = message;
    rpcHandler.resolveConnectionRequest(requestId, approved);
    // 不需要 sendResponse，因为这是单向通知
  }

  if (message.type === 'SIGNATURE_RESPONSE') {
    const { requestId, approved } = message;
    rpcHandler.resolveSignatureRequest(requestId, approved);
    // 不需要 sendResponse
  }

  if (message.type === 'TRANSACTION_RESPONSE') {
    const { requestId, approved } = message;
    rpcHandler.resolveTransactionRequest(requestId, approved);
    // 不需要 sendResponse
  }
});

// 处理 ethereum 请求
async function handleEthereumRequest(request: any, sender: chrome.runtime.MessageSender, sendResponse: Function) {
  try {
    console.log('Background handling ethereum request:', request);
    
    // 创建请求上下文
    const context = {
      origin: sender.origin,
      tabId: sender.tab?.id
    };
    
    const response = await rpcHandler.handleRequest(request, context);
    sendResponse(response);
  } catch (error: any) {
    console.error('Error handling ethereum request:', error);
    sendResponse({
      id: request.id,
      jsonrpc: request.jsonrpc,
      error: {
        code: error.code || -32603,
        message: error.message || 'Internal error'
      }
    });
  }
}

// 监听来自 popup 的消息
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);
  
  port.onMessage.addListener(async (message) => {
    console.log('Background received message:', message);
    
    try {
      switch (message.type) {
        case 'GET_ACCOUNTS':
          const accounts = await walletService.getWallets();
          port.postMessage({
            type: 'ACCOUNTS_RESPONSE',
            data: accounts
          });
          break;
          
        case 'SET_CURRENT_ACCOUNT':
          await walletService.setCurrentAccount(message.address);
          // 通知所有 content scripts 账户已更改
          notifyContentScripts('ETHEREUM_ACCOUNT_CHANGED', {
            address: message.address
          });
          port.postMessage({
            type: 'CURRENT_ACCOUNT_SET',
            success: true,
            address: message.address
          });
          break;
          
        case 'SET_PASSWORD':
          await walletService.setPassword(message.password);
          port.postMessage({
            type: 'PASSWORD_SET',
            success: true
          });
          break;
          
        case 'CREATE_WALLET':
          try {
            const newWallet = await walletService.createWallet(message.name);
            port.postMessage({
              type: 'WALLET_CREATED',
              data: newWallet
            });
          } catch (error: any) {
            port.postMessage({
              type: 'ERROR',
              error: '创建钱包失败: ' + error.message
            });
          }
          break;
          
        case 'IMPORT_WALLET':
          try {
            const importedWallet = await walletService.importWallet(
              message.privateKey,
              message.name
            );
            port.postMessage({
              type: 'WALLET_IMPORTED',
              data: importedWallet
            });
          } catch (error: any) {
            port.postMessage({
              type: 'ERROR',
              error: '导入钱包失败: ' + error.message
            });
          }
          break;
          
        case 'SET_CHAIN_ID':
          walletService.setCurrentChainId(message.chainId);
          // 通知所有 content scripts 链已更改
          notifyContentScripts('ETHEREUM_CHAIN_CHANGED', {
            chainId: message.chainId
          });
          port.postMessage({
            type: 'CHAIN_ID_SET',
            success: true
          });
          break;
          
        case 'GET_CHAINS':
          const chains = await walletService.getChains();
          port.postMessage({
            type: 'CHAINS_RESPONSE',
            data: chains
          });
          break;
          
        case 'ADD_CHAIN':
          await walletService.addEthereumChain(message.chainConfig);
          port.postMessage({
            type: 'CHAIN_ADDED',
            success: true
          });
          break;
          
        default:
          port.postMessage({
            type: 'ERROR',
            error: 'Unknown message type'
          });
      }
    } catch (error: any) {
      console.error('Error handling message:', error);
      port.postMessage({
        type: 'ERROR',
        error: error.message
      });
    }
  });
  
  port.onDisconnect.addListener(() => {
    console.log('Port disconnected');
  });
});

// 通知所有 content scripts
async function notifyContentScripts(type: string, data: any) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type, ...data }).catch(() => {
          // 忽略无法发送消息的标签页（如 chrome:// 页面）
        });
      }
    }
  } catch (error) {
    console.error('Error notifying content scripts:', error);
  }
}

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details);
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // 可以在这里添加页面加载完成后的逻辑
    console.log('Tab updated:', tab.url);
  }
});
