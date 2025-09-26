import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useWallet } from '../commonprovider/commonProvider';
import { ethers } from 'ethers';

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

const ERC721_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)"
];
const ERC721_INTERFACE_ID = "0x80ac58cd";

const AddTokenPage: React.FC = () => {
  const navigate = useNavigate();
  const { chains, currentChainId, addWatchedToken } = useWallet();
  
  const [tokenType, setTokenType] = useState<'ERC-20' | 'ERC-721'>('ERC-20');
  const [contractAddress, setContractAddress] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState('');
  const [detectionSuccess, setDetectionSuccess] = useState(false);

  const handleDetect = async () => {
    if (!ethers.isAddress(contractAddress)) {
      setError('请输入有效的合约地址');
      return;
    }
    setError('');
    setIsDetecting(true);
    setDetectionSuccess(false);

    const currentChain = chains.find(c => c.chainId === currentChainId);
    if (!currentChain) {
      setError('无法获取当前网络信息');
      setIsDetecting(false);
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(currentChain.rpcUrls[0]);
      if (tokenType === 'ERC-20') {
        const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
        const [detectedName, detectedSymbol, detectedDecimals] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals()
        ]);
        setName(detectedName);
        setSymbol(detectedSymbol);
        setDecimals(detectedDecimals.toString());
      } else { // ERC-721
        const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
        const supportsInterface = await contract.supportsInterface(ERC721_INTERFACE_ID);
        if (!supportsInterface) {
          throw new Error('该合约地址不是一个有效的 ERC-721 合约');
        }
        const [detectedName, detectedSymbol] = await Promise.all([
          contract.name(),
          contract.symbol()
        ]);
        setName(detectedName);
        setSymbol(detectedSymbol);
        setDecimals('0'); // NFTs don't have decimals
      }
      setDetectionSuccess(true);
    } catch (e) {
      console.error(e);
      setError('检测失败，请检查合约地址和网络');
      setName('');
      setSymbol('');
      setDecimals('');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleAddToken = () => {
    if (!contractAddress || !symbol || !name || !decimals) {
      setError('请填写所有必填字段');
      return;
    }
    addWatchedToken({
      address: contractAddress,
      name,
      symbol,
      decimals: parseInt(decimals, 10),
      logoURI: iconUrl,
      chainId: currentChainId,
      type: tokenType === 'ERC-20' ? 'ERC20' : 'ERC721',
    });
    navigate('/wallet');
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">添加自定义代币</h1>
        <div className="w-6"></div>
      </div>

      <div className="flex-1 p-6 space-y-5 overflow-y-auto">
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">代币类型</label>
          <select
            value={tokenType}
            onChange={(e) => setTokenType(e.target.value as 'ERC-20' | 'ERC-721')}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ERC-20">ERC-20 代币</option>
            <option value="ERC-721">ERC-721 代币 (NFT)</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">合约地址 *</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0x..."
              className="flex-grow px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleDetect}
              disabled={isDetecting || !contractAddress}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isDetecting ? <Loader2 className="w-5 h-5 animate-spin" /> : '检测'}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">代币符号 *</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="USDT"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            readOnly={detectionSuccess}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">代币名称 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tether USD"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            readOnly={detectionSuccess}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">小数位数</label>
          <input
            type="number"
            value={decimals}
            onChange={(e) => setDecimals(e.target.value)}
            placeholder="18"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            readOnly={detectionSuccess && tokenType === 'ERC-20'}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">图标URL (可选)</label>
          <input
            type="text"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      <div className="p-4 mt-auto border-t border-gray-800">
        <button
          onClick={handleAddToken}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out flex items-center justify-center"
        >
          <LinkIcon className="w-5 h-5 mr-2" />
          添加代币
        </button>
      </div>
    </div>
  );
};

export default AddTokenPage;
