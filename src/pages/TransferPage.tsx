import React, { useState } from "react";
import { walletService } from "../lib/wallet-service";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../commonprovider/commonProvider";
import { useAuth } from "../auth/AuthContext";

const TransferPage = () => {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { currentAccount,chains, currentChainId } = useWallet();
  const { password } = useAuth();
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
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">ETH 转账</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="to-address" className="block text-sm font-medium text-gray-700">
            收款地址
          </label>
          <input
            type="text"
            id="to-address"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="0x..."
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            金额 (ETH)
          </label>
          <input
            type="text"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="0.1"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}
        <button
          onClick={handleTransfer}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          发送
        </button>
        <button
          onClick={() => navigate(-1)}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mt-2"
        >
          返回
        </button>
      </div>
    </div>
  );
};

export default TransferPage;
