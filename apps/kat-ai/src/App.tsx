import React, { useState, useEffect } from 'react';
import { DocumentQA, Login } from '@bree-ai/core';

export function App() {
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
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <DocumentQA hideCreateCollection />;
}

export default App;
