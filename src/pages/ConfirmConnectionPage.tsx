import React, { useEffect, useState } from 'react';

const ConfirmConnectionPage = () => {
  const [origin, setOrigin] = useState('');
  const [account, setAccount] = useState('');
  const [requestId, setRequestId] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const originParam = queryParams.get('origin');
    const accountParam = queryParams.get('account');
    const reqId = queryParams.get('requestId');

    if (originParam && accountParam && reqId) {
      setOrigin(originParam);
      setAccount(accountParam);
      setRequestId(reqId);
    } else {
      console.error("Missing required query parameters for connection confirmation.");
    }
  }, []);

  const handleResponse = (approved: boolean) => {
    chrome.runtime.sendMessage({
      type: 'CONNECTION_RESPONSE',
      approved,
      requestId,
    }, () => {
      window.close();
    });
  };

  if (!origin || !account) {
    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
            Loading or invalid request...
        </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh', justifyContent: 'center', backgroundColor: '#f9f9f9' }}>
      <h1 style={{ fontSize: '22px', marginBottom: '15px', color: '#333' }}>Connection Request</h1>
      <div style={{ marginBottom: '25px', textAlign: 'center', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>The website</p>
        <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#007bff', fontSize: '16px' }}>{origin}</p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>wants to connect to your account:</p>
        <p style={{ margin: '5px 0', fontWeight: 'bold', fontFamily: 'monospace', backgroundColor: '#eee', padding: '8px', borderRadius: '4px', wordBreak: 'break-all' }}>{account}</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: '300px' }}>
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
          Approve
        </button>
      </div>
    </div>
  );
};

export default ConfirmConnectionPage;
