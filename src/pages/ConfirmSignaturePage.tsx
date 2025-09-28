import React, { useEffect, useState } from 'react';

const ConfirmSignaturePage = () => {
  const [origin, setOrigin] = useState('');
  const [account, setAccount] = useState('');
  const [message, setMessage] = useState('');
  const [requestId, setRequestId] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    setOrigin(queryParams.get('origin') || '');
    setAccount(queryParams.get('account') || '');
    // Decode the message in case it contains special characters
    setMessage(decodeURIComponent(queryParams.get('message') || ''));
    setRequestId(queryParams.get('requestId') || '');
  }, []);

  const handleResponse = (approved: boolean) => {
    chrome.runtime.sendMessage({
      type: 'SIGNATURE_RESPONSE',
      approved,
      requestId,
    }, () => {
      window.close();
    });
  };

  if (!origin || !account || !message) {
    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
            Loading or invalid request...
        </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh', justifyContent: 'center', backgroundColor: '#f9f9f9' }}>
      <h1 style={{ fontSize: '22px', marginBottom: '15px', color: '#333' }}>Signature Request</h1>
      <div style={{ width: '100%', maxWidth: '320px' }}>
        <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>From:</p>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#007bff', fontSize: '16px' }}>{origin}</p>
        </div>
        <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Account:</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontFamily: 'monospace', wordBreak: 'break-all' }}>{account}</p>
        </div>
        <div style={{ marginBottom: '25px', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Message to sign:</p>
            <textarea
                readOnly
                value={message}
                style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '120px',
                    border: '1px solid #ccc',
                    padding: '8px',
                    fontFamily: 'monospace',
                    backgroundColor: '#f0f0f0',
                    resize: 'none'
                }}
            />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: '320px' }}>
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
          Sign
        </button>
      </div>
    </div>
  );
};

export default ConfirmSignaturePage;
