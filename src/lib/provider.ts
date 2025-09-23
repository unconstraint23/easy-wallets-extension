import { ethers } from "ethers"

export interface ChainConfig {
  chainId: string
  chainName: string
  rpcUrls: string[]
  blockExplorerUrls?: string[]
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

let browserProvider: ethers.BrowserProvider | null = null;

function normalizeChainId(chainId: string): number | null {
  if (!chainId) return null
  const str = String(chainId).trim()
  try {
    if (str.startsWith("0x") || str.startsWith("0X")) {
      return parseInt(str, 16)
    }
    // 环境变量可能已是十进制字符串
    const num = Number(str)
    return Number.isFinite(num) ? num : null
  } catch {
    return null
  }
}

export class ProviderManager {
  private static instance: ProviderManager
  private urlToProvider: Map<string, ethers.JsonRpcProvider> = new Map()

  static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager()
    }
    return ProviderManager.instance
  }

  getProviderForChain(chain: ChainConfig): ethers.JsonRpcProvider {
    const url = chain.rpcUrls?.[0]
    if (!url) {
      throw new Error("No RPC URL found for chain")
    }

    // 以 URL 作为缓存键，避免不同链ID共享错误缓存
    const cacheKey = url
    const cached = this.urlToProvider.get(cacheKey)
    if (cached) return cached

    // 关键修复：不强制传入 staticNetwork，让 ethers 自动探测，避免 NETWORK_ERROR
    const provider = new ethers.JsonRpcProvider(url)
    this.urlToProvider.set(cacheKey, provider)
    return provider
  }

  async getEthBalance(chain: ChainConfig, address: string): Promise<bigint> {
    const provider = this.getProviderForChain(chain)

    // 如果检测到网络与期望不一致，仅记录日志，不抛错
    try {
      const detected = await provider.getNetwork()
      const expected = normalizeChainId(chain.chainId)
      if (expected !== null && detected?.chainId !== expected) {
        // 可能是链配置与 RPC 不一致，给出提示
        console.warn(
          `Provider network mismatch: rpc=${detected?.chainId} expected=${expected}. Using RPC detected network.`
        )
      }
    } catch {
      // 忽略网络探测异常，由后续调用决定重试
    }

    return provider.getBalance(address)
  }

  // 获取ERC20代币余额
  async getTokenBalance(chain: ChainConfig, tokenAddress: string, walletAddress: string): Promise<bigint> {
    const provider = this.getProviderForChain(chain)
    
    // ERC20 balanceOf 函数签名
    const balanceOfAbi = [
      "function balanceOf(address owner) view returns (uint256)"
    ]
    
    const contract = new ethers.Contract(tokenAddress, balanceOfAbi, provider)
    return await contract.balanceOf(walletAddress)
  }

  // 获取ERC20代币信息
  async getTokenInfo(chain: ChainConfig, tokenAddress: string): Promise<{name: string, symbol: string, decimals: number}> {
    const provider = this.getProviderForChain(chain)
    
    const erc20Abi = [
      "function name() view returns (string)",
      "function symbol() view returns (string)", 
      "function decimals() view returns (uint8)"
    ]
    
    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider)
    
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals()
    ])
    
    return { name, symbol, decimals }
  }

  // 获取ERC721代币余额
  async getERC721Balance(chain: ChainConfig, tokenAddress: string, walletAddress: string): Promise<bigint> {
    const provider = this.getProviderForChain(chain)
    
    const balanceOfAbi = [
      "function balanceOf(address owner) view returns (uint256)"
    ]
    
    const contract = new ethers.Contract(tokenAddress, balanceOfAbi, provider)
    return await contract.balanceOf(walletAddress)
  }

  // 获取ERC721代币信息
  async getERC721Info(chain: ChainConfig, tokenAddress: string): Promise<{name: string, symbol: string}> {
    const provider = this.getProviderForChain(chain)
    
    const erc721Abi = [
      "function name() view returns (string)",
      "function symbol() view returns (string)"
    ]
    
    const contract = new ethers.Contract(tokenAddress, erc721Abi, provider)
    
    const [name, symbol] = await Promise.all([
      contract.name(),
      contract.symbol()
    ])
    
    return { name, symbol }
  }

  formatEther(value: bigint): string {
    return ethers.formatEther(value)
  }

  // 格式化代币金额
  formatUnits(value: bigint, decimals: number): string {
    return ethers.formatUnits(value, decimals)
  }

  // 解析代币金额
  parseUnits(value: string, decimals: number): bigint {
    return ethers.parseUnits(value, decimals)
  }

  // 获取浏览器钱包提供者
  getBrowserProvider(): ethers.BrowserProvider | null {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      return null;
    }
    
    if (!browserProvider) {
      browserProvider = new ethers.BrowserProvider((window as any).ethereum);
    }
    
    return browserProvider;
  }

  // 调用钱包方法
  async requestWalletMethod(method: string, params?: any[]): Promise<any> {
    const provider = this.getBrowserProvider();
    if (!provider) {
      throw new Error('No browser wallet provider available');
    }

    try {
      const signer = await provider.getSigner();
      return await provider.send(method, params || []);
    } catch (error) {
      console.error(`Error requesting wallet method ${method}:`, error);
      throw error;
    }
  }
}

export const providerManager = ProviderManager.getInstance()
