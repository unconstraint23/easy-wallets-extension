import { Download, Key, Plus, Settings, Shield, Wallet } from "lucide-react";
import React, { useEffect, useState } from "react";






import "../assets/style.css";



import { useWallet } from "../commonprovider/commonProvider";


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

function IndexPopup() {
  const {
    wallets,
    currentAccount,
    chains,
    currentChainId,
    isPasswordSet,
    setWallets,
    setCurrentAccount,
    setChains,
    setCurrentChainId,
    setIsPasswordSet
  } = useWallet();

  const [password, setPassword] = useState('')
  const [showCreateWallet, setShowCreateWallet] = useState(false)
  const [showImportWallet, setShowImportWallet] = useState(false)
  const [newWalletName, setNewWalletName] = useState('')
  const [importPrivateKey, setImportPrivateKey] = useState('')
  const [importWalletName, setImportWalletName] = useState('')
  const [port, setPort] = useState<chrome.runtime.Port | null>(null)

  useEffect(() => {
    // 建立与 background script 的连接
    const newPort = chrome.runtime.connect({ name: 'popup' })
    setPort(newPort)

    // 监听来自 background script 的消息
    newPort.onMessage.addListener((message) => {
      console.log('comPopup received message:', message)
      switch (message.type) {
        case 'ACCOUNTS_RESPONSE':
          setWallets(message.data)
          break
        case 'CURRENT_ACCOUNT_SET':
          console.log("wallets", wallets)
          let target = wallets.find(w => w.address === message.address)
          console.log('target:', target)
          setCurrentAccount(target || null)
          break
        case 'PASSWORD_SET':
          setIsPasswordSet(true)
          break
        case 'WALLET_CREATED':
          setWallets(prev => [...prev, message.data])
          setCurrentAccount(message.data)
          setShowCreateWallet(false)
          setNewWalletName('')
          break
        case 'WALLET_IMPORTED':
          setWallets((prev) => [...prev, message.data])
          setCurrentAccount(message.data)
          setShowImportWallet(false)
          setImportPrivateKey('')
          setImportWalletName('')
          break
        case 'CHAINS_RESPONSE':
          setChains(message.data)
          break
        case 'CHAIN_ID_SET':
          setCurrentChainId(message.chainId)
          break
        case 'ERROR':
          console.error('Error:', message.error)
          break
      }
    })



    // return () => {
    //   newPort.disconnect()
    // }
  }, [])
  useEffect(() => {
    if(!isPasswordSet) {
      return
    }
    if(port) {
      // 请求初始数据
      port.postMessage({ type: 'GET_ACCOUNTS' })
      port.postMessage({ type: 'GET_CHAINS' })
    }
  }, [isPasswordSet, port])

  const handleSetPassword = () => {
    if (password && port) {
      port.postMessage({ type: 'SET_PASSWORD', password })
    }
  }

  const handleCreateWallet = () => {
    if (port) {
      port.postMessage({ 
        type: 'CREATE_WALLET', 
        name: newWalletName || undefined 
      })
    }
  }

  const handleImportWallet = () => {
    if (importPrivateKey && port) {
      port.postMessage({ 
        type: 'IMPORT_WALLET', 
        privateKey: importPrivateKey,
        name: importWalletName || undefined
      })
    }
  }

  const handleSelectAccount = (address: string) => {
    if (port) {
      port.postMessage({ type: 'SET_CURRENT_ACCOUNT', address })
    }
  }

  const handleSelectChain = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chainId = e.target.value;
    if (port) {
      port.postMessage({ type: 'SET_CHAIN_ID', chainId })
      // 立即更新本地状态，提供更好的用户体验
      setCurrentChainId(chainId)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!isPasswordSet) {
    return (
      <div className="w-[400px] h-[32rem] bg-gray-900 text-white p-6">
        <div className="flex items-center mb-6">
          <Shield className="w-8 h-8 text-blue-500 mr-3" />
          <h1 className="text-xl font-bold">设置密码</h1>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">设置钱包密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入密码"
          />
        </div>
        
        <button
          onClick={handleSetPassword}
          disabled={!password}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          确认密码
        </button>
      </div>
    )
  }

  return (
    <div className="w-96 h-[32rem] bg-gray-900 text-white overflow-y-auto">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Wallet className="w-6 h-6 text-blue-500 mr-2" />
            <h1 className="text-lg font-bold">钱包</h1>
          </div>
          <Settings className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* 当前账户 */}
      {currentAccount && (
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-sm font-medium text-gray-400 mb-2">当前账户</h2>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{currentAccount.name}</p>
                <p className="text-sm text-gray-400">{formatAddress(currentAccount.address)}</p>
              </div>
              <Key className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* 网络选择 */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-medium text-gray-400 mb-2">网络</h2>
        <select
          value={currentChainId}
          onChange={handleSelectChain}
          className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {chains.map((chain) => (
            <option key={chain.chainId} value={chain.chainId}>
              {chain.chainName}
            </option>
          ))}
        </select>
      </div>

      {/* 钱包列表 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-400">钱包账户</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowCreateWallet(true)}
              className="p-1 text-blue-500 hover:bg-gray-800 rounded"
              title="创建钱包"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowImportWallet(true)}
              className="p-1 text-green-500 hover:bg-gray-800 rounded"
              title="导入钱包"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {wallets.map((wallet) => (
            <div
              key={wallet.address}
              onClick={() => handleSelectAccount(wallet.address)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                currentAccount?.address === wallet.address
                  ? 'bg-blue-600'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{wallet.name}</p>
                  <p className="text-sm text-gray-400">{formatAddress(wallet.address)}</p>
                </div>
                {currentAccount?.address === wallet.address && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 创建钱包模态框 */}
      {showCreateWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-80">
            <h3 className="text-lg font-bold mb-4">创建新钱包</h3>
            <input
              type="text"
              value={newWalletName}
              onChange={(e) => setNewWalletName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="钱包名称（可选）"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateWallet(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateWallet}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入钱包模态框 */}
      {showImportWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-80">
            <h3 className="text-lg font-bold mb-4">导入钱包</h3>
            <input
              type="text"
              value={importWalletName}
              onChange={(e) => setImportWalletName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="钱包名称（可选）"
            />
            <input
              value={importPrivateKey}
              onChange={(e) => setImportPrivateKey(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="私钥"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowImportWallet(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleImportWallet}
                disabled={!importPrivateKey}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IndexPopup
