import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Download, Settings, Key, Shield, ArrowLeft, Coins, Eye, EyeOff } from 'lucide-react';
import { useWallet } from '../commonprovider/commonProvider';
import { providerManager } from '../lib/provider';

interface WalletPageProps {
  onNavigate: (page: 'home' | 'wallet' | 'settings' | 'accountDetail') => void;
}

const WalletPage: React.FC<WalletPageProps> = ({ onNavigate }) => {
  const { 
    wallets, 
    currentAccount, 
    chains, 
    currentChainId,
    password,
    isPasswordSet,
    watchedTokens,
    setPassword,
    createWallet,
    importWallet,
    generateMnemonic,
    importMnemonicWallet,
    selectAccount,
    selectChain,
    addWatchedToken,
    removeWatchedToken,
    refreshWatchedTokens
  } = useWallet();

  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showImportWallet, setShowImportWallet] = useState(false);
  const [showMnemonicWallet, setShowMnemonicWallet] = useState(false);
  const [showImportMnemonic, setShowImportMnemonic] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [importPrivateKey, setImportPrivateKey] = useState('');
  const [importWalletName, setImportWalletName] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');
  const [importMnemonic, setImportMnemonic] = useState('');
  const [mnemonicPassphrase, setMnemonicPassphrase] = useState('');
  const [mnemonicWalletName, setMnemonicWalletName] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState('18');
  const [showMnemonic, setShowMnemonic] = useState(false);

  // 默认选中第一个钱包
  useEffect(() => {
    if (wallets.length > 0 && !currentAccount) {
      selectAccount(wallets[0].address);
    }
  }, [wallets, currentAccount, selectAccount]);

  // 定期刷新代币列表
  useEffect(() => {
    const interval = setInterval(() => {
      refreshWatchedTokens();
    }, 30000); // 每30秒刷新一次

    return () => clearInterval(interval);
  }, [refreshWatchedTokens]);

  const handleSetPassword = () => {
    console.log('Setting password:', passwordInput);
    if (passwordInput) {
      setPassword(passwordInput);
      console.log('Password set successfully');
    } else {
      console.log('Password input is empty');
    }
  };

  const handleCreateWallet = async () => {
    try {
      if (newWalletName.trim()) {
        await createWallet(newWalletName.trim());
      } else {
        await createWallet();
      }
      setShowCreateWallet(false);
      setNewWalletName('');
    } catch (error) {
      console.error('Error creating wallet:', error);
      alert('创建钱包失败: ' + (error as Error).message);
    }
  };

  const handleImportWallet = async () => {
    try {
      if (importPrivateKey && importWalletName.trim()) {
        await importWallet(importPrivateKey, importWalletName.trim());
      } else if (importPrivateKey) {
        await importWallet(importPrivateKey);
      } else {
        alert('请输入私钥');
        return;
      }
      setShowImportWallet(false);
      setImportPrivateKey('');
      setImportWalletName('');
    } catch (error) {
      console.error('Error importing wallet:', error);
      alert('导入钱包失败: ' + (error as Error).message);
    }
  };

  const handleGenerateMnemonic = () => {
    const mnemonic = generateMnemonic();
    setGeneratedMnemonic(mnemonic);
    setShowMnemonicWallet(true);
  };

  const handleCreateMnemonicWallet = async () => {
    try {
      await importMnemonicWallet(generatedMnemonic, '', mnemonicWalletName.trim() || undefined);
      setShowMnemonicWallet(false);
      setGeneratedMnemonic('');
      setMnemonicWalletName('');
      setShowMnemonic(false);
    } catch (error) {
      console.error('Error creating mnemonic wallet:', error);
    }
  };

  const handleImportMnemonicWallet = async () => {
    try {
      await importMnemonicWallet(
        importMnemonic, 
        mnemonicPassphrase || undefined, 
        mnemonicWalletName.trim() || undefined
      );
      setShowImportMnemonic(false);
      setImportMnemonic('');
      setMnemonicPassphrase('');
      setMnemonicWalletName('');
    } catch (error) {
      console.error('Error importing mnemonic wallet:', error);
    }
  };

  const handleAddToken = async () => {
    if (tokenAddress && tokenSymbol) {
      try {
        // 使用 wallet_watchAsset RPC 方法添加代币
        const result = await providerManager.requestWalletMethod('wallet_watchAsset', [{
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: parseInt(tokenDecimals) || 18,
            image: undefined,
          },
        }]);
        
        if (result) {
          console.log('Token added successfully');
          // 刷新观察的代币列表
          await refreshWatchedTokens();
        }
      } catch (error) {
        console.error('Error adding token:', error);
        alert('添加代币失败: ' + (error as Error).message);
      } finally {
        setShowAddToken(false);
        setTokenAddress('');
        setTokenSymbol('');
        setTokenDecimals('18');
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isPasswordSet) {
    return (
      <div className="h-full flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('home')}
              className="mr-3 p-1 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-blue-500 mr-2" />
              <h1 className="text-lg font-bold">设置密码</h1>
            </div>
          </div>
        </div>

        {/* 密码设置 */}
        <div className="flex-1 p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">设置钱包密码</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入密码"
            />
          </div>

          <button
            onClick={handleSetPassword}
            disabled={!passwordInput}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            确认密码
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('home')}
              className="mr-3 p-1 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <Wallet className="w-6 h-6 text-blue-500 mr-2" />
              <h1 className="text-lg font-bold">钱包</h1>
            </div>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 当前账户 */}
      {currentAccount && (
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-sm font-medium text-gray-400 mb-2">当前账户</h2>
          <button onClick={() => onNavigate('accountDetail')} className="w-full text-left">
            <div className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{currentAccount.name}</p>
                  <p className="text-sm text-gray-400">{formatAddress(currentAccount.address)}</p>
                </div>
                <Key className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 网络选择 */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-medium text-gray-400 mb-2">网络</h2>
        <select
          value={currentChainId}
          onChange={(e) => selectChain(e.target.value)}
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
      <div className="flex-1 p-4 overflow-y-auto">
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
              title="导入私钥"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleGenerateMnemonic}
              className="p-1 text-purple-500 hover:bg-gray-800 rounded"
              title="生成助记词"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowImportMnemonic(true)}
              className="p-1 text-orange-500 hover:bg-gray-800 rounded"
              title="导入助记词"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {wallets.map((wallet) => (
            <div
              key={wallet.address}
              onClick={() => selectAccount(wallet.address)}
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

        {/* 代币部分 */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-400">代币</h2>
            <button
              onClick={() => setShowAddToken(true)}
              className="p-1 text-blue-500 hover:bg-gray-800 rounded"
              title="添加代币"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {watchedTokens.map((token, index) => (
              <div
                key={`${token.address}-${index}`}
                className="bg-gray-800 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Coins className="w-4 h-4 text-yellow-500 mr-2" />
                    <div>
                      <p className="font-medium">{token.symbol}</p>
                      <p className="text-xs text-gray-400">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-300">
                      {token.type === 'ERC20' ? '0.00' : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">{formatAddress(token.address)}</p>
                  </div>
                </div>
              </div>
            ))}

            {watchedTokens.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Coins className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无代币</p>
                <p className="text-xs">点击 + 添加代币</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 创建钱包模态框 */}
      {showCreateWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-72">
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
          <div className="bg-gray-800 rounded-lg p-6 w-72">
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

      {/* 助记词钱包模态框 */}
      {showMnemonicWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">创建助记词钱包</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">钱包名称（可选）</label>
              <input
                type="text"
                value={mnemonicWalletName}
                onChange={(e) => setMnemonicWalletName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入钱包名称"
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">助记词</label>
                <button
                  onClick={() => setShowMnemonic(!showMnemonic)}
                  className="text-blue-500 hover:text-blue-400"
                >
                  {showMnemonic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="bg-gray-700 p-3 rounded-md">
                <p className={`text-sm ${showMnemonic ? 'text-white' : 'text-gray-400'}`}>
                  {showMnemonic ? generatedMnemonic : '••• ••• ••• ••• ••• ••• ••• ••• ••• ••• ••• •••'}
                </p>
              </div>
              <p className="text-xs text-red-400 mt-2">
                ⚠️ 请安全保存您的助记词，丢失后将无法恢复钱包！
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowMnemonicWallet(false);
                  setGeneratedMnemonic('');
                  setMnemonicWalletName('');
                  setShowMnemonic(false);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateMnemonicWallet}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                创建钱包
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入助记词模态框 */}
      {showImportMnemonic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">导入助记词钱包</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">钱包名称（可选）</label>
              <input
                type="text"
                value={mnemonicWalletName}
                onChange={(e) => setMnemonicWalletName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入钱包名称"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">助记词</label>
              <textarea
                value={importMnemonic}
                onChange={(e) => setImportMnemonic(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入12或24个助记词，用空格分隔"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">密码短语（可选）</label>
              <input
                type="password"
                value={mnemonicPassphrase}
                onChange={(e) => setMnemonicPassphrase(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入密码短语"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowImportMnemonic(false);
                  setImportMnemonic('');
                  setMnemonicPassphrase('');
                  setMnemonicWalletName('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleImportMnemonicWallet}
                disabled={!importMnemonic}
                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                导入钱包
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加代币模态框 */}
      {showAddToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-72">
            <h3 className="text-lg font-bold mb-4">添加代币</h3>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">代币地址</label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">代币符号</label>
              <input
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="USDT"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">小数位数</label>
              <input
                type="number"
                value={tokenDecimals}
                onChange={(e) => setTokenDecimals(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="18"
                min="0"
                max="18"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddToken(false);
                  setTokenAddress('');
                  setTokenSymbol('');
                  setTokenDecimals('18');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleAddToken()}
                disabled={!tokenAddress || !tokenSymbol}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                添加代币
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
