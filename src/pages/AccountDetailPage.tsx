import React, { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Wallet, Coins, Send } from "lucide-react"
import { useWallet } from "../commonprovider/commonProvider"
import { providerManager } from "../lib/provider"
import { useNavigate } from "react-router-dom"

const AccountDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentAccount, currentChainId, chains } = useWallet()
  const [balance, setBalance] = useState<string>("-")
  const [loading, setLoading] = useState<boolean>(false)
  const chain = useMemo(() => chains.find((c) => c.chainId === currentChainId) || chains[0], [chains, currentChainId])

  useEffect(() => {
    const fetchBalance = async () => {
      if (!currentAccount || !chain) return
      try {
        setLoading(true)
        console.log('fetch balance', currentAccount.address, chain.chainId)
        const raw = await providerManager.getEthBalance(chain, currentAccount.address)
        setBalance(providerManager.formatEther(raw))
      } catch (e) {
        console.error(e)
        setBalance("-")
      } finally {
        setLoading(false)
      }
    }
    fetchBalance()
  }, [currentAccount?.address, chain?.chainId])

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

  if (!currentAccount) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <button onClick={() => navigate('/wallet')} className="p-1 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400">暂无账户</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">账户详情</h1>
          <div className="w-6"></div> {/* 占位符 */}
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 p-4 space-y-4">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-400 mb-1">地址</div>
          <div className="font-mono">{currentAccount.address}</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-400 mb-1">网络</div>
          <div>{chain?.chainName} ({chain?.chainId})</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Coins className="w-4 h-4 text-yellow-400 mr-2" />
              <div>
                <div className="text-sm text-gray-400">ETH 余额</div>
                <div className="text-lg font-semibold">{loading ? '查询中...' : `${balance} ${chain?.nativeCurrency?.symbol ?? 'ETH'}`}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="p-4 mt-auto border-t border-gray-800">
        <button
          onClick={() => navigate('/transfer')}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out flex items-center justify-center"
        >
          <Send className="w-5 h-5 mr-2" />
          转账
        </button>
      </div>
    </div>
  )
}

export default AccountDetailPage
