import * as ethers from 'ethers';
import * as passworder from '@metamask/browser-passworder';
import { ethErrors } from 'eth-rpc-errors';
import * as bip39 from 'bip39';
import { HDKey } from '@scure/bip32';
import { providerManager } from './provider';


export interface WalletAccount {
  address: string;
  privateKey: string;
  name?: string;
  derivationPath?: string;
}

export interface MnemonicWallet {
  mnemonic: string;
  accounts: WalletAccount[];
  passphrase?: string;
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



  // 创建新钱包
  async createWallet(password: string, name?: string): Promise<WalletAccount> {
    if (!password) {
      throw new Error('Password not provided');
    }

    try {
      const wallet = ethers.Wallet.createRandom();
      const account: WalletAccount = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        name: name || `Account ${Date.now()}`
      };

      await this.saveWallet(password, account);
      this.currentAccount = account;
      return account;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw new Error('Failed to create wallet: ' + (error as Error).message);
    }
  }

  // 导入钱包
  async importWalletFromPrivateKey(password: string, privateKey: string, name?: string): Promise<WalletAccount> {
    if (!password) {
      throw new Error('Password not provided');
    }
    
    try {
      // 验证私钥
      if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
      }
      const wallet = new ethers.Wallet(privateKey);
      const account: WalletAccount = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        name: name || `Imported Account ${Date.now()}`
      };

      await this.saveWallet(password, account);
      this.currentAccount = account;
      return account;
    } catch (error) {
      console.error('Error importing wallet from private key:', error);
      throw new Error('无效的私钥');
    }
  }

  // 从助记词导入钱包
  async importWalletFromMnemonic(password: string, mnemonic: string, name?: string): Promise<WalletAccount> {
    if (!password) {
      throw new Error('Password not provided');
    }
    try {
      // 验证助记词
      if (!ethers.Mnemonic.isValidMnemonic(mnemonic)) {
        throw new Error('无效的助记词');
      }
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      const account: WalletAccount = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        name: name || `Imported Account ${Date.now()}`
      };

      await this.saveWallet(password, account);
      this.currentAccount = account;
      return account;
    } catch (error) {
      console.error('Error importing wallet from mnemonic:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('从助记词导入钱包失败');
    }
  }

  // 保存钱包到加密存储
  private async saveWallet(password: string, account: WalletAccount): Promise<void> {
    const encryptedWallets = await this.getStorage('encryptedWallets');
    let wallets: WalletAccount[] = [];

    if (encryptedWallets) {
      try {
        wallets = await passworder.decrypt(password, encryptedWallets) as WalletAccount[];
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

    const encrypted = await passworder.encrypt(password, wallets);
    await this.setStorage('encryptedWallets', encrypted);
  }

  // 获取所有钱包
  async getWallets(password: string): Promise<WalletAccount[]> {
    if (!password) {
      throw new Error('Password not provided');
    }

    const encryptedWallets = await this.getStorage('encryptedWallets');
    if (!encryptedWallets) return [];

    try {
      let res = await passworder.decrypt(password, encryptedWallets) as WalletAccount[];
      console.log('Decrypted wallets:', res);
      return res;
    } catch (error) {
      console.error('Error decrypting wallets:', error);
      return [];
    }
  }

  // 设置当前账户
  async setCurrentAccount(password: string, address: string): Promise<void> {
    const wallets = await this.getWallets(password);
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

  // 获取当前 RPC URL
  getCurrentRpcUrl(): string {
    // 这里可以根据 currentChainId 从预设的链配置中获取
    // 为简单起见，我们暂时硬编码
    return 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'; // 请替换为你的 Infura Project ID
  }

  // 根据地址获取钱包
  async getWalletByAddress(password: string, address: string): Promise<WalletAccount | null> {
    if (!password) {
      return null;
    }
    const encryptedWallets = await this.getStorage('encryptedWallets');
    if (!encryptedWallets) {
      return null;
    }
    const wallets = (await passworder.decrypt(password, encryptedWallets)) as WalletAccount[];
    return wallets.find(w => w.address.toLowerCase() === address.toLowerCase()) || null;
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

  // 发送 ETH 交易
  async sendEthTransaction(chainConfig: ChainConfig, password: string, from: string, to: string, value: string): Promise<string> {
    if (!password) {
      throw new Error('Password not provided');
    }

    const wallet = await this.getWalletByAddress(password, from);
    if (!wallet) {
      throw new Error('Sender wallet not found');
    }

    const provider =  providerManager.getProviderForChain(chainConfig);
    const ethWallet = new ethers.Wallet(wallet.privateKey, provider);

    const balance = await provider.getBalance(from);
    const requiredAmount = ethers.parseEther(value);

    if (balance < requiredAmount) {
      throw new Error('Insufficient balance');
    }

    const tx = {
      to: to,
      value: requiredAmount
    };

    const txResponse = await ethWallet.sendTransaction(tx);
    return txResponse.hash;
  }

  // 发送ERC20代币转账
  async sendTokenTransaction(password: string, tokenAddress: string, to: string, amount: string, chainConfig: ChainConfig): Promise<string> {
    if (!this.currentAccount) {
      throw ethErrors.rpc.invalidParams('No account selected');
    }
    if (!password) {
      throw new Error('Password not provided');
    }

    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrls[0], parseInt(chainConfig.chainId, 16));
    const wallet = new ethers.Wallet(this.currentAccount.privateKey, provider);
    
    // ERC20 transfer 函数 ABI
    const erc20Abi = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)"
    ];
    
    const contract = new ethers.Contract(tokenAddress, erc20Abi, wallet);
    
    // 获取代币精度
    const decimals = await contract.decimals();
    const amountWithDecimals = ethers.parseUnits(amount, decimals);
    
    const tx = await contract.transfer(to, amountWithDecimals);
    return tx.hash;
  }

  // 生成助记词
  generateMnemonic(strength: number = 128): string {
    return bip39.generateMnemonic(strength);
  }

  // 验证助记词
  validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }

  // 从助记词创建HD钱包
  async createMnemonicWallet(password: string, mnemonic: string, passphrase?: string, accountCount: number = 1): Promise<MnemonicWallet> {
    if (!password) {
      throw ethErrors.rpc.invalidParams('Password not provided');
    }

    if (!this.validateMnemonic(mnemonic)) {
      throw ethErrors.rpc.invalidParams('Invalid mnemonic');
    }

    const seed = await bip39.mnemonicToSeed(mnemonic, passphrase);
    const hdKey = HDKey.fromMasterSeed(new Uint8Array(seed));
    
    const accounts: WalletAccount[] = [];
    
    for (let i = 0; i < accountCount; i++) {
      // BIP44 路径: m/44'/60'/0'/0/i
      const derivationPath = `m/44'/60'/0'/0/${i}`;
      const derivedKey = hdKey.derive(derivationPath);
      
      if (!derivedKey.privateKey) {
        throw new Error('Failed to derive private key');
      }

      const wallet = new ethers.Wallet(ethers.hexlify(derivedKey.privateKey));
      const account: WalletAccount = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        name: `Account ${i + 1}`,
        derivationPath
      };
      
      accounts.push(account);
      await this.saveWallet(password, account);
    }

    const mnemonicWallet: MnemonicWallet = {
      mnemonic,
      accounts,
      passphrase
    };

    // 保存助记词钱包信息
    await this.saveMnemonicWallet(password, mnemonicWallet);

    return mnemonicWallet;
  }

  // 从助记词导入钱包
  async importMnemonicWallet(password: string, mnemonic: string, passphrase?: string, accountCount: number = 1): Promise<MnemonicWallet> {
    return this.createMnemonicWallet(password, mnemonic, passphrase, accountCount);
  }

  // 从助记词派生新账户
  async deriveAccountFromMnemonic(password: string, mnemonic: string, accountIndex: number, passphrase?: string): Promise<WalletAccount> {
    if (!password) {
      throw ethErrors.rpc.invalidParams('Password not provided');
    }

    if (!this.validateMnemonic(mnemonic)) {
      throw ethErrors.rpc.invalidParams('Invalid mnemonic');
    }

    const seed = await bip39.mnemonicToSeed(mnemonic, passphrase);
    const hdKey = HDKey.fromMasterSeed(new Uint8Array(seed));
    
    const derivationPath = `m/44'/60'/0'/0/${accountIndex}`;
    const derivedKey = hdKey.derive(derivationPath);
    
    if (!derivedKey.privateKey) {
      throw new Error('Failed to derive private key');
    }

    const wallet = new ethers.Wallet(ethers.hexlify(derivedKey.privateKey));
    const account: WalletAccount = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      name: `Account ${accountIndex + 1}`,
      derivationPath
    };

    await this.saveWallet(password, account);
    return account;
  }

  // 保存助记词钱包
  private async saveMnemonicWallet(password: string, mnemonicWallet: MnemonicWallet): Promise<void> {
    const encryptedMnemonicWallets = await this.getStorage('encryptedMnemonicWallets');
    let mnemonicWallets: MnemonicWallet[] = [];

    if (encryptedMnemonicWallets) {
      try {
        mnemonicWallets = await passworder.decrypt(password, encryptedMnemonicWallets) as MnemonicWallet[];
      } catch {
        mnemonicWallets = [];
      }
    }

    // 检查是否已存在相同的助记词
    const existingIndex = mnemonicWallets.findIndex(w => w.mnemonic === mnemonicWallet.mnemonic);
    if (existingIndex >= 0) {
      mnemonicWallets[existingIndex] = mnemonicWallet;
    } else {
      mnemonicWallets.push(mnemonicWallet);
    }

    const encrypted = await passworder.encrypt(password, mnemonicWallets);
    await this.setStorage('encryptedMnemonicWallets', encrypted);
  }

  // 获取助记词钱包
  async getMnemonicWallets(password: string): Promise<MnemonicWallet[]> {
    if (!password) {
      throw ethErrors.rpc.invalidParams('Password not provided');
    }

    const encryptedMnemonicWallets = await this.getStorage('encryptedMnemonicWallets');
    if (!encryptedMnemonicWallets) return [];

    try {
      let res = await passworder.decrypt(password, encryptedMnemonicWallets) as MnemonicWallet[];
      return res;
    } catch {
      return [];
    }
  }
}

export const walletService = new WalletService();
