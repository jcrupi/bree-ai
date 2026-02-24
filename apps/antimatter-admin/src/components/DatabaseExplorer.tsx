import React, { useState, useEffect } from 'react';
import FileTreeView from './FileTreeView';
import EntryViewer from './EntryViewer';
import QueryBuilder from './QueryBuilder';
import './DatabaseExplorer.css';

interface DatabaseExplorerProps {
  dbPath: string;
}

interface FileEntry {
  path: string;
  id?: string;
  name?: string;
  isDirectory: boolean;
  children?: FileEntry[];
}

export default function DatabaseExplorer({ dbPath }: DatabaseExplorerProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null);
  const [entryData, setEntryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'explorer' | 'query'>('explorer');
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalDirectories: 0,
  });

  // Fetch file structure
  useEffect(() => {
    fetchFileStructure();
  }, [dbPath]);

  const fetchFileStructure = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/explorer?path=${encodeURIComponent(dbPath)}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.files || []);
        setStats(data.stats || { totalEntries: 0, totalDirectories: 0 });
      } else {
        setError(data.error || 'Failed to load file structure');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEntry = async (entry: FileEntry) => {
    setSelectedEntry(entry);
    setEntryData(null);

    if (!entry.isDirectory) {
      setLoading(true);
      try {
        const fullPath = `${dbPath}/${entry.path}`;
        const response = await fetch(
          `/api/entries?path=${encodeURIComponent(fullPath)}`
        );
        const data = await response.json();

        if (data.success) {
          setEntryData(data.entry);
        } else {
          setError(data.error || 'Failed to load entry');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load entry');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="database-explorer">
      <div className="explorer-header">
        <div className="header-info">
          <h2>Database Explorer</h2>
          <p className="db-path">📁 {dbPath}</p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{stats.totalEntries}</span>
            <span className="stat-label">Entries</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.totalDirectories}</span>
            <span className="stat-label">Folders</span>
          </div>
          <button className="btn-refresh" onClick={fetchFileStructure}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="explorer-tabs">
        <button
          className={`tab ${activeTab === 'explorer' ? 'active' : ''}`}
          onClick={() => setActiveTab('explorer')}
        >
          📂 Explorer
        </button>
        <button
          className={`tab ${activeTab === 'query' ? 'active' : ''}`}
          onClick={() => setActiveTab('query')}
        >
          🔍 Query
        </button>
      </div>

      <div className="explorer-content">
        {activeTab === 'explorer' ? (
          <div className="explorer-view">
            <div className="file-tree">
              <h3>Files & Folders</h3>
              {loading ? (
                <div className="loading-state">
                  <div className="spinner-sm"></div>
                  <p>Loading...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <p>❌ {error}</p>
                  <button onClick={fetchFileStructure}>Retry</button>
                </div>
              ) : files.length === 0 ? (
                <div className="empty-state">
                  <p>No files found</p>
                </div>
              ) : (
                <FileTreeView
                  files={files}
                  onSelectEntry={handleSelectEntry}
                  selectedPath={selectedEntry?.path}
                />
              )}
            </div>

            <div className="entry-panel">
              {selectedEntry ? (
                <EntryViewer
                  entry={selectedEntry}
                  data={entryData}
                  loading={loading}
                  onRefresh={() =>
                    selectedEntry && handleSelectEntry(selectedEntry)
                  }
                />
              ) : (
                <div className="empty-panel">
                  <p>Select an entry to view details</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <QueryBuilder dbPath={dbPath} />
        )}
      </div>
    </div>
  );
}
