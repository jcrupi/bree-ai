import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { DocumentQA, Login } from '@bree-ai/core';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bree_jwt');
    setIsAuthenticated(!!token);
    setIsChecking(false);
  }, []);

  const handleLoginSuccess = (_user: any, _token: string) => {
    setIsAuthenticated(true);
  };

  if (isChecking) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <DocumentQA hideCreateCollection />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
