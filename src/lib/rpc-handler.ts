import { ethErrors } from 'eth-rpc-errors';
import { ethers } from 'ethers';
import { walletService, type ChainConfig } from "./wallet-service"
import { providerManager } from "./provider"
import { StorageManager, STORAGE_KEYS, type TokenAsset, type ConnectionPermission } from "./storage"


export interface RPCRequest {
  method: string;
  params?: any[];
  id: number;
  jsonrpc: string;
}

export interface RPCResponse {
  id: number;
  jsonrpc: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface RPCRequestContext {
  origin?: string;
  tabId?: number;
}

export class RPCHandler {
  async handleRequest(request: RPCRequest, context?: RPCRequestContext): Promise<RPCResponse> {
    const { method, params = [], id, jsonrpc } = request;

    try {
      let result: any;

      switch (method) {
        case 'eth_accounts':
          result = await this.handleEthAccounts();
          break;

        case 'eth_chainId':
          result = await this.handleEthChainId();
          break;

        case 'wallet_addEthereumChain':
          result = await this.handleWalletAddEthereumChain(params);
          break;

        case 'eth_requestAccounts':
          result = await this.handleEthRequestAccounts(context);
          break;

        case 'eth_sign':
          result = await this.handleEthSign(params);
          break;

        case 'eth_sendTransaction':
          result = await this.handleEthSendTransaction(params);
          break;

        case 'personal_sign':
          result = await this.handlePersonalSign(params);
          break;

        case 'eth_getBalance':
          result = await this.handleEthGetBalance(params);
          break;

        case 'wallet_watchAsset':
          result = await this.handleWalletWatchAsset(params);
          break;

        case 'eth_getTokenBalance':
          result = await this.handleEthGetTokenBalance(params);
          break;

        case 'wallet_generateMnemonic':
          result = await this.handleWalletGenerateMnemonic();
          break;

        case 'wallet_importMnemonic':
          result = await this.handleWalletImportMnemonic(params);
          break;

        case 'wallet_getWatchedTokens':
          result = await this.handleWalletGetWatchedTokens();
          break;

        case 'eth_sendTransaction':
          result = await this.handleEthSendTransaction(params);
          break;

        case 'wallet_sendEthTransaction':
          result = await this.handleWalletSendEthTransaction(params);
          break;

        case 'wallet_sendTokenTransaction':
          result = await this.handleWalletSendTokenTransaction(params);
          break;

        default:
          throw ethErrors.rpc.methodNotFound(`Method ${method} not found`);
      }

      return {
        id,
        jsonrpc,
        result
      };
    } catch (error: any) {
      return {
        id,
        jsonrpc,
        error: {
          code: error.code || -32603,
          message: error.message || 'Internal error',
          data: error.data
        }
      };
    }
  }

  private async handleEthAccounts(): Promise<string[]> {
    const address = walletService.getCurrentAddress();
    return address ? [address] : [];
  }

  private async handleEthChainId(): Promise<string> {
    return walletService.getCurrentChainId();
  }

  private async handleWalletAddEthereumChain(params: any[]): Promise<null> {
    if (!params || params.length === 0) {
      throw ethErrors.rpc.invalidParams('Missing chain configuration');
    }

    const chainConfig: ChainConfig = {
      chainId: params[0].chainId,
      chainName: params[0].chainName,
      rpcUrls: params[0].rpcUrls || [params[0].rpcUrl],
      blockExplorerUrls: params[0].blockExplorerUrls,
      nativeCurrency: params[0].nativeCurrency
    };

    await walletService.addEthereumChain(chainConfig);
    return null;
  }

  private async handleEthRequestAccounts(context?: RPCRequestContext): Promise<string[]> {
    const address = walletService.getCurrentAddress();
    if (!address) {
      throw ethErrors.rpc.invalidRequest('No accounts available');
    }

    // 如果没有上下文信息，直接返回账户（向后兼容）
    if (!context?.origin) {
      return [address];
    }

    // 检查权限
    const hasPermission = await this.checkConnectionPermission(context.origin, address);
    
    if (hasPermission) {
      return [address];
    }

    // 请求用户授权
    const granted = await this.requestConnectionPermission(context.origin, [address]);
    
    if (granted) {
      await this.grantConnectionPermission(context.origin, [address]);
      return [address];
    } else {
      throw ethErrors.rpc.invalidRequest('User rejected the request');
    }
  }

  // 检查连接权限
  private async checkConnectionPermission(origin: string, account: string): Promise<boolean> {
    const storage = StorageManager.getInstance();
    const permissions = await storage.getItem<ConnectionPermission[]>(STORAGE_KEYS.CONNECTION_PERMISSIONS) || [];
    
    const permission = permissions.find(p => p.origin === origin);
    return permission ? permission.accounts.includes(account) : false;
  }

  // 授予连接权限
  private async grantConnectionPermission(origin: string, accounts: string[]): Promise<void> {
    const storage = StorageManager.getInstance();
    const permissions = await storage.getItem<ConnectionPermission[]>(STORAGE_KEYS.CONNECTION_PERMISSIONS) || [];
    
    const existingIndex = permissions.findIndex(p => p.origin === origin);
    const permission: ConnectionPermission = {
      origin,
      accounts,
      timestamp: Date.now()
    };

    if (existingIndex >= 0) {
      permissions[existingIndex] = permission;
    } else {
      permissions.push(permission);
    }

    await storage.setItem(STORAGE_KEYS.CONNECTION_PERMISSIONS, permissions);
  }

  // 请求连接权限（这里应该显示UI让用户确认）
  private async requestConnectionPermission(origin: string, accounts: string[]): Promise<boolean> {
    // 在实际实现中，这里应该显示一个权限请求对话框
    // 现在为了演示，我们假设用户总是同意
    console.log(`Requesting permission for ${origin} to access accounts:`, accounts);
    
    // 发送消息到popup显示权限请求
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'REQUEST_CONNECTION_PERMISSION',
          origin,
          accounts
        });
      }
    } catch (error) {
      console.error('Error sending permission request:', error);
    }
    
    // 暂时返回true，在实际实现中应该等待用户响应
    return true;
  }

  private async handleEthSign(params: any[]): Promise<string> {
    if (!params || params.length < 2) {
      throw ethErrors.rpc.invalidParams('Missing parameters');
    }

    const [address, message] = params;
    const currentAddress = walletService.getCurrentAddress();
    
    if (address !== currentAddress) {
      throw ethErrors.rpc.invalidParams('Address mismatch');
    }

    return await walletService.signMessage(message);
  }

  private async handleEthSendTransaction(params: any[]): Promise<string> {
    if (!params || params.length === 0) {
      throw ethErrors.rpc.invalidParams('Missing transaction parameters');
    }

    const transaction = params[0];
    
    // 检查是否有to和value字段，如果有则执行实际转账
    if (transaction.to && transaction.value !== undefined) {
      const chains = await walletService.getChains();
      const currentChainId = walletService.getCurrentChainId();
      const currentChain = chains.find(chain => chain.chainId === currentChainId);
      
      if (!currentChain) {
        throw new Error('Current chain not found');
      }

      const valueInEth = ethers.formatEther(transaction.value);
      return await walletService.sendEthTransaction(transaction.to, valueInEth, currentChain);
    }

    // 否则只是签名交易
    return await walletService.signTransaction(transaction);
  }

  // 发送ETH转账
  private async handleWalletSendEthTransaction(params: any[]): Promise<string> {
    if (!params || params.length < 2) {
      throw ethErrors.rpc.invalidParams('Missing parameters: to, value');
    }

    const [to, value] = params;
    const chains = await walletService.getChains();
    const currentChainId = walletService.getCurrentChainId();
    const currentChain = chains.find(chain => chain.chainId === currentChainId);
    
    if (!currentChain) {
      throw new Error('Current chain not found');
    }

    return await walletService.sendEthTransaction(to, value, currentChain);
  }

  // 发送代币转账
  private async handleWalletSendTokenTransaction(params: any[]): Promise<string> {
    if (!params || params.length < 3) {
      throw ethErrors.rpc.invalidParams('Missing parameters: tokenAddress, to, amount');
    }

    const [tokenAddress, to, amount] = params;
    const chains = await walletService.getChains();
    const currentChainId = walletService.getCurrentChainId();
    const currentChain = chains.find(chain => chain.chainId === currentChainId);
    
    if (!currentChain) {
      throw new Error('Current chain not found');
    }

    return await walletService.sendTokenTransaction(tokenAddress, to, amount, currentChain);
  }

  private async handlePersonalSign(params: any[]): Promise<string> {
    if (!params || params.length < 2) {
      throw ethErrors.rpc.invalidParams('Missing parameters');
    }

    const [message, address] = params;
    const currentAddress = walletService.getCurrentAddress();
    
    if (address !== currentAddress) {
      throw ethErrors.rpc.invalidParams('Address mismatch');
    }

    return await walletService.signMessage(message);
  }

  private async handleEthGetBalance(params: any[]): Promise<string> {
    if (!params || params.length === 0) {
      throw ethErrors.rpc.invalidParams('Missing address parameter');
    }

    const address = params[0];
    const currentAddress = walletService.getCurrentAddress();
    
    if (address !== currentAddress) {
      throw ethErrors.rpc.invalidParams('Address mismatch');
    }

    try {
      const chains = await walletService.getChains();
      const currentChainId = walletService.getCurrentChainId();
      const currentChain = chains.find(chain => chain.chainId === currentChainId);
      
      if (!currentChain) {
        throw new Error('Current chain not found');
      }

      const balance = await providerManager.getEthBalance(currentChain, address);
      return '0x' + balance.toString(16);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0x0';
    }
  }

  // EIP-747: wallet_watchAsset
  private async handleWalletWatchAsset(params: any[]): Promise<boolean> {
    if (!params || params.length === 0) {
      throw ethErrors.rpc.invalidParams('Missing asset parameter');
    }

    const asset = params[0];
    const { type, options } = asset;

    if (!type || !options) {
      throw ethErrors.rpc.invalidParams('Invalid asset format');
    }

    const tokenAsset: TokenAsset = {
      address: options.address,
      symbol: options.symbol,
      decimals: options.decimals || 18,
      image: options.image,
      type: type as 'ERC20' | 'ERC721' | 'ERC1155',
      name: options.name
    };

    // 保存到存储
    const storage = StorageManager.getInstance();
    const watchedTokens = await storage.getItem<TokenAsset[]>(STORAGE_KEYS.WATCHED_TOKENS) || [];
    
    // 检查是否已存在
    const existingIndex = watchedTokens.findIndex(token => 
      token.address.toLowerCase() === tokenAsset.address.toLowerCase() && 
      token.type === tokenAsset.type
    );

    if (existingIndex >= 0) {
      watchedTokens[existingIndex] = tokenAsset;
    } else {
      watchedTokens.push(tokenAsset);
    }

    await storage.setItem(STORAGE_KEYS.WATCHED_TOKENS, watchedTokens);
    return true;
  }

  // 获取代币余额
  private async handleEthGetTokenBalance(params: any[]): Promise<string> {
    if (!params || params.length < 2) {
      throw ethErrors.rpc.invalidParams('Missing parameters: address, tokenAddress');
    }

    const [address, tokenAddress] = params;
    const currentAddress = walletService.getCurrentAddress();
    
    if (address !== currentAddress) {
      throw ethErrors.rpc.invalidParams('Address mismatch');
    }

    try {
      const chains = await walletService.getChains();
      const currentChainId = walletService.getCurrentChainId();
      const currentChain = chains.find(chain => chain.chainId === currentChainId);
      
      if (!currentChain) {
        throw new Error('Current chain not found');
      }

      const balance = await providerManager.getTokenBalance(currentChain, tokenAddress, address);
      return '0x' + balance.toString(16);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return '0x0';
    }
  }

  // 生成助记词
  private async handleWalletGenerateMnemonic(): Promise<string> {
    return walletService.generateMnemonic();
  }

  // 导入助记词
  private async handleWalletImportMnemonic(params: any[]): Promise<any> {
    if (!params || params.length === 0) {
      throw ethErrors.rpc.invalidParams('Missing mnemonic parameter');
    }

    const [mnemonic, passphrase] = params;
    const mnemonicWallet = await walletService.importMnemonicWallet(mnemonic, passphrase);
    return mnemonicWallet;
  }

  // 获取已观察的代币
  private async handleWalletGetWatchedTokens(): Promise<TokenAsset[]> {
    try {
      return await walletService.getWatchedTokens();
    } catch (error) {
      console.error('Error getting watched tokens:', error);
      return [];
    }
  }
}

export const rpcHandler = new RPCHandler();
