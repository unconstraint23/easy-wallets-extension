import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const ConfirmTransactionPage = () => {
  const [origin, setOrigin] = useState('');
  const [requestId, setRequestId] = useState('');
  const [txDetails, setTxDetails] = useState(null);
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const txParams = queryParams.get('tx');
    if (txParams) {
        try {
            const decodedTx = JSON.parse(decodeURIComponent(txParams));
            setTxDetails(decodedTx);

            // Handle value display
            if (decodedTx.value) {
                let valueInEth = 'Invalid Value';
                try {
                    // The standard is a hex string in wei. Ethers handles it.
                    valueInEth = ethers.formatEther(decodedTx.value);
                } catch (e) {
                    // It might be a non-standard decimal string in ETH, like "0.001".
                    // Let's try to parse it that way.
                    try {
                        const wei = ethers.parseEther(decodedTx.value.toString());
                        valueInEth = ethers.formatEther(wei);
                    } catch (e2) {
                        console.error("Could not parse transaction value:", decodedTx.value);
                    }
                }
                setDisplayValue(valueInEth);
            }

        } catch (e) {
            console.error("Failed to parse transaction details", e);
        }
    }
    setOrigin(queryParams.get('origin') || '');
    setRequestId(queryParams.get('requestId') || '');
  }, []);

  const handleResponse = (approved: boolean) => {
    chrome.runtime.sendMessage({
      type: 'TRANSACTION_RESPONSE',
      approved,
      requestId,
    }, () => {
      window.close();
    });
  };

  if (!txDetails) {
    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
            Loading transaction details or invalid request...
        </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh', justifyContent: 'center', backgroundColor: '#f9f9f9' }}>
      <h1 style={{ fontSize: '22px', marginBottom: '15px', color: '#333' }}>Transaction Request</h1>
      <div style={{ width: '100%', maxWidth: '340px' }}>
        <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>From Website:</p>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#007bff', fontSize: '16px' }}>{origin}</p>
        </div>

        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff', marginBottom: '25px' }}>
            <div style={{ marginBottom: '10px' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>From Account:</p>
                <p style={{ margin: 0, fontFamily: 'monospace', wordBreak: 'break-all' }}>{txDetails.from}</p>
            </div>
            <div style={{ marginBottom: '10px' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>To Address:</p>
                <p style={{ margin: 0, fontFamily: 'monospace', wordBreak: 'break-all' }}>{txDetails.to}</p>
            </div>
            <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Amount:</p>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>{displayValue} ETH</p>
            </div>
             {/* In a real app, you would also estimate and display gas fees here */}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: '340px' }}>
        <button
          onClick={() => handleResponse(false)}
          style={{ padding: '12px 24px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', flex: 1, marginRight: '10px' }}
        >
          Reject
        </button>
        <button
          onClick={() => handleResponse(true)}
          style={{ padding: '12px 24px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', flex: 1, marginLeft: '10px' }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default ConfirmTransactionPage;