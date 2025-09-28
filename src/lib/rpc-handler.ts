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
  // A map to store resolve/reject functions for pending connection requests
  private pendingConnectionRequests = new Map<string, { resolve: (value: boolean) => void, reject: (reason?: any) => void }>();

  // A map to store resolve/reject functions for pending signature requests
  private pendingSignatureRequests = new Map<string, { resolve: (value: boolean) => void, reject: (reason?: any) => void }>();

  // A map to store resolve/reject functions for pending transaction requests
  private pendingTransactionRequests = new Map<string, { resolve: (value: boolean) => void, reject: (reason?: any) => void }>();

  // Public method to resolve pending connection requests from the background script
  public resolveConnectionRequest(requestId: string, approved: boolean) {
    const promise = this.pendingConnectionRequests.get(requestId);
    if (promise) {
      if (approved) {
        promise.resolve(true);
      } else {
        promise.reject(ethErrors.provider.userRejectedRequest('User rejected the connection request.'));
      }
      this.pendingConnectionRequests.delete(requestId);
    }
  }

  // Public method to resolve pending signature requests from the background script
  public resolveSignatureRequest(requestId: string, approved: boolean) {
    const promise = this.pendingSignatureRequests.get(requestId);
    if (promise) {
      if (approved) {
        promise.resolve(true);
      } else {
        promise.reject(ethErrors.provider.userRejectedRequest('User rejected the signature request.'));
      }
      this.pendingSignatureRequests.delete(requestId);
    }
  }

  // Public method to resolve pending transaction requests from the background script
  public resolveTransactionRequest(requestId: string, approved: boolean) {
    const promise = this.pendingTransactionRequests.get(requestId);
    if (promise) {
      if (approved) {
        promise.resolve(true);
      } else {
        promise.reject(ethErrors.provider.userRejectedRequest('User rejected the transaction.'));
      }
      this.pendingTransactionRequests.delete(requestId);
    }
  }

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
          result = await this.handleEthSendTransaction(params, context);
          break;

        case 'personal_sign':
          result = await this.handlePersonalSign(params, context);
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
    const wallets = await walletService.getWallets("ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f");
    return wallets.map(wallet => wallet.address);
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
    const address = "0xD877C8aAf9Aa37B8c4975f2ce6580d24461F83b2"
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

  // 请求连接权限
  private async requestConnectionPermission(origin: string, accounts: string[]): Promise<boolean> {
    const requestId = `conn-${Date.now()}-${Math.random()}`;
    const account = accounts[0]; // Assuming one account for now

    const url = new URL(chrome.runtime.getURL('popup.html'));
    url.hash = '/confirm-connection';
    url.searchParams.set('origin', origin);
    url.searchParams.set('account', account);
    url.searchParams.set('requestId', requestId);

    // Create a popup window for the user to confirm
    await chrome.windows.create({
      url: url.toString(),
      type: 'popup',
      width: 370,
      height: 600,
    });

    return new Promise<boolean>((resolve, reject) => {
      this.pendingConnectionRequests.set(requestId, { resolve, reject });
    });
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

  private async handleEthSendTransaction(params: any[], context?: RPCRequestContext): Promise<string> {
    if (!params || params.length === 0) {
      throw ethErrors.rpc.invalidParams('Missing transaction parameters');
    }

    const transaction = params[0];

    // Normalize the transaction value. The standard is a hex string in wei.
    // If we get a non-standard decimal string in ETH, we convert it to the standard.
    if (transaction.value) {
        try {
            // Check if it's already a valid BigNumberish (hex, number, etc.)
            ethers.toBigInt(transaction.value);
        } catch (e) {
            // If not, assume it's a decimal string in ETH and convert to hex wei
            try {
                transaction.value = ethers.parseEther(transaction.value.toString()).toHexString();
            } catch (e2) {
                throw ethErrors.rpc.invalidParams(`Invalid transaction value: ${transaction.value}`);
            }
        }
    }

    // Ensure 'from' address matches the current account
    const currentAddress = "0xD877C8aAf9Aa37B8c4975f2ce6580d24461F83b2"; // Using hardcoded from previous version
    if (transaction.from.toLowerCase() !== currentAddress.toLowerCase()) {
        throw ethErrors.rpc.invalidParams(`Transaction 'from' address ${transaction.from} does not match current account ${currentAddress}`);
    }

    // Request user confirmation for the transaction
    const approved = await this.requestTransactionPermission(context.origin, transaction);

    if (approved) {
        // Logic from old implementation
        if (transaction.to && transaction.value !== undefined) {
            const chains = await walletService.getChains();
            const currentChainId = walletService.getCurrentChainId();
            const currentChain = {
              chainId: `0x${Number(`${process.env.PLASMO_PUBLIC_SEPOLIA_CHAINID}`).toString(16)}`,
              chainName: 'Sepolia Testnet',
              rpcUrls: [`${process.env.PLASMO_PUBLIC_SEPOLIA_URL}`],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
              nativeCurrency: {
                name: 'Sepolia Ether',
                symbol: 'ETH',
                decimals: 18,
              },
            }
            
            if (!currentChain) {
                throw new Error('Current chain not found');
            }

            // The walletService.sendEthTransaction function seems to expect a decimal string in ETH.
            // Since we normalized transaction.value to a hex string in wei, we can now safely format it.
            const valueInEth = ethers.formatEther(transaction.value);
            return await walletService.sendEthTransaction(transaction.to, valueInEth, currentChain);
        }
        // Fallback to just signing
        return await walletService.signTransaction(transaction);
    } else {
      throw ethErrors.provider.userRejectedRequest('User rejected the transaction.');
    }
  }

  private async requestTransactionPermission(origin: string, transaction: any): Promise<boolean> {
    const requestId = `tx-${Date.now()}-${Math.random()}`;

    const url = new URL(chrome.runtime.getURL('popup.html'));
    url.hash = '/confirm-transaction';
    url.searchParams.set('origin', origin);
    // Serialize the transaction object and encode it
    url.searchParams.set('tx', encodeURIComponent(JSON.stringify(transaction)));
    url.searchParams.set('requestId', requestId);

    // Create a popup window for the user to confirm
    await chrome.windows.create({
      url: url.toString(),
      type: 'popup',
      width: 370,
      height: 600,
    });

    return new Promise<boolean>((resolve, reject) => {
      this.pendingTransactionRequests.set(requestId, { resolve, reject });
    });
  }

  // 发送ETH转账
  private async handleWalletSendEthTransaction(params: any[]): Promise<string> {
    if (!params || params.length < 2) {
      throw ethErrors.rpc.invalidParams('Missing parameters: to, value');
    }

    const [to, value] = params;
    const chains = await walletService.getChains();
    const currentChainId = "0x11155111"
    const currentChain =  {
      chainId: `0x${Number(`${process.env.PLASMO_PUBLIC_SEPOLIA_CHAINID}`).toString(16)}`,
      chainName: 'Sepolia Testnet',
      rpcUrls: [`${process.env.PLASMO_PUBLIC_SEPOLIA_URL}`],
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
      nativeCurrency: {
        name: 'Sepolia Ether',
        symbol: 'ETH',
        decimals: 18,
      },
    }
    
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

  private async handlePersonalSign(params: any[], context?: RPCRequestContext): Promise<string> {
    if (!params || params.length < 2) {
      throw ethErrors.rpc.invalidParams('Expected at least 2 parameters for personal_sign: [message, address]');
    }

    const [message, address] = params;

    const currentAddress = "0xD877C8aAf9Aa37B8c4975f2ce6580d24461F83b2" // Using hardcoded from previous version
    if (address.toLowerCase() !== currentAddress.toLowerCase()) {
      throw ethErrors.rpc.invalidParams(`Requested signing address ${address} does not match current account ${currentAddress}`);
    }

    // Request user confirmation for signing
    const approved = await this.requestSignaturePermission(context.origin, address, message);

    if (approved) {
      return await walletService.signMessage(message);
    } else {
      // The rejection is handled by the promise, but this is a fallback.
      throw ethErrors.provider.userRejectedRequest('User rejected the signature request.');
    }
  }

  private async requestSignaturePermission(origin: string, account: string, message: string): Promise<boolean> {
    const requestId = `sig-${Date.now()}-${Math.random()}`;

    const url = new URL(chrome.runtime.getURL('popup.html'));
    url.hash = '/confirm-signature';
    url.searchParams.set('origin', origin);
    url.searchParams.set('account', account);
    url.searchParams.set('message', encodeURIComponent(message)); // Ensure message is URL-safe
    url.searchParams.set('requestId', requestId);

    // Create a popup window for the user to confirm
    await chrome.windows.create({
      url: url.toString(),
      type: 'popup',
      width: 370,
      height: 600,
    });

    return new Promise<boolean>((resolve, reject) => {
      this.pendingSignatureRequests.set(requestId, { resolve, reject });
    });
  }

  private async handleEthGetBalance(params: any[]): Promise<string> {
    if (!params || params.length === 0) {
      throw ethErrors.rpc.invalidParams('Missing address parameter');
    }

    const address = params[0];
    // const currentAddress = walletService.getCurrentAddress();
    //
    // if (address !== currentAddress) {
    //   throw ethErrors.rpc.invalidParams('Address mismatch');
    // }

    try {
      const chains = await walletService.getChains();
      const currentChainId = walletService.getCurrentChainId();
      const currentChain = chains.find(chain => chain.chainId === currentChainId);
      
      if (!currentChain) {
        throw new Error('Current chain not found');
      }
    const chain =  {
        chainId: `0x${process.env.PLASMO_PUBLIC_SEPOLIA_CHAINID}`,
        chainName: 'Sepolia Testnet',
        rpcUrls: [`${process.env.PLASMO_PUBLIC_SEPOLIA_URL}`],
        blockExplorerUrls: ['https://etherscan.io'],
        nativeCurrency: {
          name: 'Sepolia Ether',
          symbol: 'ETH',
          decimals: 18
        }
      }
      const balance = await providerManager.getEthBalance(chain, address);
      return balance.toString();
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
