import React, { useState, useEffect } from 'react';
import DatabaseExplorer from './components/DatabaseExplorer';
import './App.css';

interface Config {
  dbPath?: string;
}

function App() {
  const [config, setConfig] = useState<Config>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get config from window or environment
    const dbPath = (window as any).__ANTIMATTER_DB_PATH__ ||
                   new URLSearchParams(window.location.search).get('db') ||
                   './test_db';

    setConfig({ dbPath });
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading AntiMatterDB...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <h1>🗄️ AntiMatterDB</h1>
            <p className="subtitle">Schema-Driven Markdown Database Explorer</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {config.dbPath ? (
            <DatabaseExplorer dbPath={config.dbPath} />
          ) : (
            <div className="no-db">
              <p>No database path specified</p>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>AntiMatterDB v0.1.0 • File-based markdown database with YAML front-matter</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
