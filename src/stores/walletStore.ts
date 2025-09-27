import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chromeStorage } from './chrome-storage';
import { walletService } from '../lib/wallet-service';
import { CryptoService } from '../lib/crypto-service';
import { StorageManager, STORAGE_KEYS, type TokenAsset } from '../lib/storage';
import { providerManager } from '../lib/provider';
import type { MnemonicWallet } from '../lib/wallet-service';

interface WalletAccount {
  address: string;
  privateKey: string;
  name?: string;
}

interface ChainConfig {
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

interface WalletState {
  wallets: WalletAccount[];
  currentAccount: WalletAccount | null;
  chains: ChainConfig[];
  currentChainId: string;
  watchedTokens: TokenAsset[];
  isAuthenticated: boolean;
  password: string | null;
  
  // Actions
  setWallets: (wallets: WalletAccount[]) => void;
  setCurrentAccount: (account: WalletAccount | null) => void;
  setChains: (chains: ChainConfig[]) => void;
  setCurrentChainId: (chainId: string) => void;
  setWatchedTokens: (tokens: TokenAsset[]) => void;
  addWatchedToken: (token: TokenAsset) => void;
  removeWatchedToken: (tokenAddress: string) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
  setPassword: (password: string | null) => void;
  addWallet: (wallet: WalletAccount) => void;
  removeWallet: (address: string) => void;
  
  // Wallet operations
  createWallet: (password: string, name?: string) => Promise<void>;
  importWalletFromMnemonic: (password: string, mnemonic: string, name?: string) => Promise<void>;
  importWalletFromPrivateKey: (password: string, privateKey: string, name?: string) => Promise<void>;
  importMnemonicWallet: (password: string, mnemonic: string, passphrase: string | undefined, index: number, name?: string) => Promise<void>;
  selectAccount: (address: string) => Promise<void>;
  selectChain: (chainId: string) => void;
  refreshWatchedTokens: (password: string) => Promise<void>;
  refreshWallets: (password: string) => Promise<WalletAccount[]>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      wallets: [],
      currentAccount: null,
      chains: [],
      currentChainId: '',
      watchedTokens: [],
      isAuthenticated: false,
      password: null,
      
      // Actions
      setWallets: (wallets) => set({ wallets }),
      setCurrentAccount: (account) => set({ currentAccount: account }),
      setChains: (chains) => set({ chains }),
      setCurrentChainId: (chainId) => set({ currentChainId: chainId }),
      setWatchedTokens: (tokens) => set({ watchedTokens: tokens }),
      addWatchedToken: (token) => set((state) => ({
        watchedTokens: [...state.watchedTokens, token]
      })),
      removeWatchedToken: (tokenAddress) => set((state) => ({
        watchedTokens: state.watchedTokens.filter(t => t.address !== tokenAddress)
      })),
      setIsAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      setPassword: (password) => set({ password }),
      addWallet: (wallet) => set((state) => ({
        wallets: [...state.wallets, wallet]
      })),
      removeWallet: (address) => set((state) => ({
        wallets: state.wallets.filter(w => w.address !== address)
      })),
      
      // Wallet operations
      createWallet: async (password: string, name?: string) => {
        await walletService.createWallet(password, name);
        await get().refreshWallets(password);
      },
      
      importWalletFromMnemonic: async (password: string, mnemonic: string, name?: string) => {
        await walletService.importWalletFromMnemonic(password, mnemonic, name);
        await get().refreshWallets(password);
      },
      
      importWalletFromPrivateKey: async (password: string, privateKey: string, name?: string) => {
        await walletService.importWalletFromPrivateKey(password, privateKey, name);
        await get().refreshWallets(password);
      },
      
      importMnemonicWallet: async (password: string, mnemonic: string, passphrase: string | undefined, index: number, name?: string) => {
        await walletService.importMnemonicWallet(password, mnemonic, passphrase, index, name);
        await get().refreshWallets(password);
      },
      
      selectAccount: async (address: string) => {
        const { password } = get();
        if (!password) {
          throw new Error("User is not authenticated");
        }
        
        const account = await walletService.getWalletByAddress(password, address);
        if (account) {
          set({ currentAccount: account });
        }
      },
      
      selectChain: (chainId: string) => {
        set({ currentChainId: chainId });
      },
      
      refreshWatchedTokens: async (password: string) => {
        const { currentAccount, currentChainId, chains, watchedTokens } = get();
        const storage = StorageManager.getInstance();
        
        if (!currentAccount || !currentChainId) {
          console.log("Cannot refresh token balances: no current account or chain.");
          return;
        }

        const currentChain = chains.find(c => c.chainId === currentChainId);
        if (!currentChain) {
          console.log("Cannot refresh token balances: current chain config not found.");
          return;
        }

        console.log("Refreshing watched tokens balances...");
        let data = await storage.getItem<TokenAsset[]>(STORAGE_KEYS.WATCHED_TOKENS);
        console.log(data, "watchedTokens");
        const updatedTokens = await Promise.all(
          data
            .filter(token => token.chainId === currentChainId) // 只刷新当前链的代币
            .map(async (token) => {
              try {
                const balance = await providerManager.getTokenBalance(
                  currentChain,
                  token.address,
                  token.type,
                  token.decimals,
                  currentAccount.address
                );
                console.log(`Balance for ${token.symbol} (${token.address}):`, balance);
                return { ...token, balance };
              } catch (error) {
                console.error(`Failed to get balance for ${token.symbol}:`, error);
                return { ...token, balance: '0' }; // 出错时余额设为0
              }
            })
        );
        console.log("Updated tokens:", updatedTokens);
        // 合并刷新后的代币和未刷新的代币（其他链的）
        const finalTokens = data.map(
          (t) => updatedTokens.find((ut) => ut.address === t.address && ut.chainId === t.chainId) || t
        );

        set({ watchedTokens: finalTokens });
        await storage.setItem(STORAGE_KEYS.WATCHED_TOKENS, finalTokens);
        console.log("Token balances refreshed and saved.");
      },
      
      refreshWallets: async (password: string) => {
        const updatedWallets = await walletService.getWallets(password);
        set({ wallets: updatedWallets });
        return updatedWallets;
      },
    }),
    {
      name: 'wallet-storage',
      storage: chromeStorage,
      partialize: (state) => ({
        wallets: state.wallets,
        currentAccount: state.currentAccount,
        chains: state.chains,
        currentChainId: state.currentChainId,
        watchedTokens: state.watchedTokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export type { WalletAccount, ChainConfig };