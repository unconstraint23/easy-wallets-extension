import * as ethers from 'ethers';
import * as passworder from '@metamask/browser-passworder';
import { ethErrors } from 'eth-rpc-errors';

export interface WalletAccount {
  address: string;
  privateKey: string;
  name?: string;
}

export interface ChainConfig {
  chainId: string;
  chainName: string;
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export class WalletService {
  private password: string | null = null;
  private currentAccount: WalletAccount | null = null;
  private currentChainId: string = '0x1'; // 默认以太坊主网

  // Chrome storage 辅助方法
  private async getStorage(key: string): Promise<any> {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key]);
      });
    });
  }

  private async setStorage(key: string, value: any): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  }

  // 设置密码
  async setPassword(password: string): Promise<void> {
    this.password = password;
  }

  // 验证密码
  async verifyPassword(password: string): Promise<boolean> {
    try {
      const encryptedWallets = await this.getStorage('encryptedWallets');
      if (!encryptedWallets) return true; // 如果没有钱包，任何密码都可以

      const decrypted = await passworder.decrypt(password, encryptedWallets);
      return Array.isArray(decrypted);
    } catch {
      return false;
    }
  }

  // 创建新钱包
  async createWallet(name?: string): Promise<WalletAccount> {
    if (!this.password) {
      throw ethErrors.rpc.invalidParams('Password not set');
    }

    const wallet = ethers.Wallet.createRandom();
    const account: WalletAccount = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      name: name || `Account ${Date.now()}`
    };

    await this.saveWallet(account);
    this.currentAccount = account;
    return account;
  }

  // 导入钱包
  async importWallet(privateKey: string, name?: string): Promise<WalletAccount> {
    if (!this.password) {
      throw ethErrors.rpc.invalidParams('Password not set');
    }
    try {
      console.log('importWallet privateKey:', privateKey)
      console.log(ethers)
      const wallet = new ethers.Wallet(privateKey);
      const account: WalletAccount = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        name: name || `Imported Account ${Date.now()}`
      };
      console.log('importWallet account:', account)
      await this.saveWallet(account);
      this.currentAccount = account;
      return account;
    } catch (error) {
      throw ethErrors.rpc.invalidParams('Invalid private key');
    }
  }

  // 保存钱包到存储
  private async saveWallet(account: WalletAccount): Promise<void> {
    const encryptedWallets = await this.getStorage('encryptedWallets');
    let wallets: WalletAccount[] = [];

    if (encryptedWallets) {
      try {
        wallets = await passworder.decrypt(this.password!, encryptedWallets);
      } catch {
        wallets = [];
      }
    }

    // 检查是否已存在相同地址的钱包
    const existingIndex = wallets.findIndex(w => w.address === account.address);
    if (existingIndex >= 0) {
      wallets[existingIndex] = account;
    } else {
      wallets.push(account);
    }

    const encrypted = await passworder.encrypt(this.password!, wallets);
    await this.setStorage('encryptedWallets', encrypted);
  }

  // 获取所有钱包
  async getWallets(): Promise<any> {
    if (!this.password) {
      throw ethErrors.rpc.invalidParams('Password not set');
    }

    const encryptedWallets = await this.getStorage('encryptedWallets');
    if (!encryptedWallets) return [];

    try {
      return await passworder.decrypt(this.password, encryptedWallets);
    } catch {
      return [];
    }
  }

  // 设置当前账户
  async setCurrentAccount(address: string): Promise<void> {
    const wallets = await this.getWallets();
    const account = wallets.find(w => w.address === address);
    if (!account) {
      throw ethErrors.rpc.invalidParams('Account not found');
    }
    this.currentAccount = account;
  }

  // 获取当前账户
  getCurrentAccount(): WalletAccount | null {
    return this.currentAccount;
  }

  // 获取当前账户地址
  getCurrentAddress(): string | null {
    return this.currentAccount?.address || null;
  }

  // 设置当前链ID
  setCurrentChainId(chainId: string): void {
    this.currentChainId = chainId;
  }

  // 获取当前链ID
  getCurrentChainId(): string {
    return this.currentChainId;
  }

  // 添加网络
  async addEthereumChain(chainConfig: ChainConfig): Promise<void> {
    const chains = await this.getStorage('customChains') || [];
    const existingChain = chains.find((c: ChainConfig) => c.chainId === chainConfig.chainId);
    
    if (!existingChain) {
      chains.push(chainConfig);
      await this.setStorage('customChains', chains);
    }
  }

  // 获取所有网络
  async getChains(): Promise<ChainConfig[]> {
    const defaultChains: ChainConfig[] = [
      {
        chainId: `0x${Number(`${process.env.PLASMO_PUBLIC_ALCHEMY_MAINNET_CHAINID}`).toString(16)}`,
        chainName: 'Ethereum Mainnet',
        rpcUrls: [`${process.env.PLASMO_PUBLIC_ALCHEMY_MAINNET_URL}`],
        blockExplorerUrls: ['https://etherscan.io'],
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
      },
      {
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
    ];

    const customChains = await this.getStorage('customChains') || [];
    return [...defaultChains, ...customChains];
  }

  // 签名消息
  async signMessage(message: string): Promise<string> {
    if (!this.currentAccount) {
      throw ethErrors.rpc.invalidParams('No account selected');
    }

    const wallet = new ethers.Wallet(this.currentAccount.privateKey);
    return await wallet.signMessage(message);
  }

  // 签名交易
  async signTransaction(transaction: any): Promise<string> {
    if (!this.currentAccount) {
      throw ethErrors.rpc.invalidParams('No account selected');
    }

    const wallet = new ethers.Wallet(this.currentAccount.privateKey);
    return await wallet.signTransaction(transaction);
  }
}

export const walletService = new WalletService();
