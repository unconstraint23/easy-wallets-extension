(function() {
  // A map to store resolve/reject functions for pending requests
  const pendingRequests = new Map();

  // Function to generate a unique ID for each request
  const generateId = () => `request-${Date.now()}-${Math.random()}`;

  // --- Ethereum Provider ---
  const ethereum = {
    isMetaMask: false,
    isMyWallet: true, // Deprecated, use isWalletExtension
    isWalletExtension: true,
    isConnected: () => true,

    request: (request) => {
      return new Promise((resolve, reject) => {
        const id = generateId();
        pendingRequests.set(id, { resolve, reject });
        window.postMessage({
          type: 'ETHEREUM_REQUEST_FROM_PAGE',
          id: id,
          payload: request
        }, '*');
      });
    },

    // Event listeners (simplified)
    on: (event, listener) => {
      window.addEventListener(`ethereum:${event}`, (e: CustomEvent) => listener(e.detail));
    },
    removeListener: (event, listener) => {
      // Implementation for removeListener would require more complex tracking
      console.log(`removeListener for ${event} called but not fully implemented.`);
    },

    // Properties that will be updated by messages from the content script
    selectedAddress: null,
    chainId: null,
    networkVersion: null,

    // Legacy methods
    enable: () => ethereum.request({ method: 'eth_requestAccounts' }),
    send: (method, params) => ethereum.request({ method, params }),
    sendAsync: (request, callback) => {
      ethereum.request(request)
        .then(result => callback(null, { result }))
        .catch(error => callback(error, null));
    }
  };

  // --- WalletExtension Specific Object ---
  const walletExtension = {
    ...ethereum,
    version: '1.0.0',
    name: 'WalletExtension',

    // Custom methods are now just wrappers around the standard request
    generateMnemonic: () => ethereum.request({ method: 'wallet_generateMnemonic' }),
    importMnemonic: (mnemonic, passphrase) => ethereum.request({
      method: 'wallet_importMnemonic',
      params: [mnemonic, passphrase]
    }),
    getTokenBalance: (tokenAddress, walletAddress) => {
      const address = walletAddress || ethereum.selectedAddress;
      if (!address) return Promise.reject(new Error('No wallet address available'));
      return ethereum.request({
        method: 'eth_getTokenBalance',
        params: [address, tokenAddress]
      });
    },
    watchAsset: (type, options) => ethereum.request({
      method: 'wallet_watchAsset',
      params: [{ type, options }]
    }),
    getWatchedTokens: () => ethereum.request({ method: 'wallet_getWatchedTokens' }),
    sendEthTransaction: (to, value) => ethereum.request({
      method: 'wallet_sendEthTransaction',
      params: [to, value]
    }),
    sendTokenTransaction: (tokenAddress, to, amount) => ethereum.request({
      method: 'wallet_sendTokenTransaction',
      params: [tokenAddress, to, amount]
    })
  };

  // --- Message Handling from Content Script ---
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    const { data } = event;

    // Handle responses to requests
    if (data.type === 'ETHEREUM_RESPONSE_FROM_EXTENSION' && data.id && pendingRequests.has(data.id)) {
      const { resolve, reject } = pendingRequests.get(data.id);
      const { response } = data;

      if (response.error) {
        reject(new Error(response.error.message));
      } else {
        resolve(response.result);
      }
      pendingRequests.delete(data.id);
    }

    // Handle pushed events from the background
    if (data.type === 'ETHEREUM_ACCOUNT_CHANGED') {
      ethereum.selectedAddress = data.address;
      window.dispatchEvent(new CustomEvent('ethereum:accountsChanged', { detail: data.address ? [data.address] : [] }));
    }

    if (data.type === 'ETHEREUM_CHAIN_CHANGED') {
      ethereum.chainId = data.chainId;
      ethereum.networkVersion = parseInt(data.chainId, 16).toString();
      window.dispatchEvent(new CustomEvent('ethereum:chainChanged', { detail: data.chainId }));
    }
  });

  // --- Inject into Page ---
  if (typeof window !== 'undefined') {
    try {
      // Use a more robust way to define properties
      Object.defineProperty(window, 'ethereum', {
        value: Object.freeze(ethereum),
        writable: false,
        configurable: true
      });

      Object.defineProperty(window, 'walletExtension', {
        value: Object.freeze(walletExtension),
        writable: false,
        configurable: true
      });

      console.log("✅ WalletExtension provider injected into page context.");

    } catch (err) {
      console.error("Failed to inject wallet objects:", err);
    }
  }
})();

