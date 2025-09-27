import React, { useState } from "react";
import { walletService } from "../lib/wallet-service";
import { useNavigate } from "react-router-dom";
import { useWalletStore } from "../stores/walletStore";
import { useAuthStore } from "../stores/authStore";

const TransferPage = () => {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { currentAccount, chains, currentChainId } = useWalletStore();
  const { password } = useAuthStore();
  
  const handleTransfer = async () => {
    setError("");
    setSuccess("");
    if (!to || !amount) {
      setError("请输入收款地址和金额");
      return;
    }

    try {
      
      if (!currentAccount) {
        setError("没有可用的账户");
        return;
      }
      const chain = chains.find((c) => c.chainId === currentChainId) || chains[0]
      console.log("chain",chain)
      const txHash = await walletService.sendEthTransaction(chain, password, currentAccount.address, to, amount);
      setSuccess(`转账成功！交易哈希: ${txHash}`);
      setTo("");
      setAmount("");
    } catch (e: any) {
      setError(`转账失败: ${e.message}`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">转账</h1>
          <div className="w-6"></div> {/* 占位符 */}
        </div>
      </div>

      {/* 表单 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">收款地址</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入收款地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">转账金额</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入转账金额"
              step="0.0001"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {success && (
            <div className="text-green-500 text-sm">{success}</div>
          )}
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleTransfer}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          确认转账
        </button>
      </div>
    </div>
  );
};

export default TransferPage;