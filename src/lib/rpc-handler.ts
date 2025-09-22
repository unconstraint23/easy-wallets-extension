import { ethErrors } from 'eth-rpc-errors';



import { walletService, type ChainConfig } from "./wallet-service"


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

export class RPCHandler {
  async handleRequest(request: RPCRequest): Promise<RPCResponse> {
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
          result = await this.handleEthRequestAccounts();
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

  private async handleEthRequestAccounts(): Promise<string[]> {
    const address = walletService.getCurrentAddress();
    if (!address) {
      throw ethErrors.rpc.unauthorized('No accounts available');
    }
    return [address];
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
    return await walletService.signTransaction(transaction);
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

    // 这里应该查询实际的余额，暂时返回 0
    return '0x0';
  }
}

export const rpcHandler = new RPCHandler();
