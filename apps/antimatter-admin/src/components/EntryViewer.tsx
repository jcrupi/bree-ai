import React from 'react';
import './EntryViewer.css';

interface FileEntry {
  path: string;
  id?: string;
  name?: string;
  isDirectory: boolean;
}

interface EntryViewerProps {
  entry: FileEntry;
  data?: any;
  loading: boolean;
  onRefresh: () => void;
}

export default function EntryViewer({
  entry,
  data,
  loading,
  onRefresh,
}: EntryViewerProps) {
  if (entry.isDirectory) {
    return (
      <div className="entry-viewer">
        <h3>📁 Directory</h3>
        <p className="path">{entry.path}</p>
        <p className="info">This is a directory. Select a file to view its content.</p>
      </div>
    );
  }

  return (
    <div className="entry-viewer">
      <div className="viewer-header">
        <div>
          <h3>📄 {entry.name || entry.path.split('/').pop()}</h3>
          <p className="path">{entry.path}</p>
        </div>
        <button className="btn-refresh" onClick={onRefresh} disabled={loading}>
          🔄
        </button>
      </div>

      <div className="viewer-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner-sm"></div>
            <p>Loading...</p>
          </div>
        ) : data ? (
          <div className="entry-data">
            <div className="data-section">
              <h4>Front Matter</h4>
              <div className="yaml-preview">
                <pre>{JSON.stringify(data.frontmatter || {}, null, 2)}</pre>
              </div>
            </div>

            {data.content && (
              <div className="data-section">
                <h4>Content</h4>
                <div className="markdown-preview">
                  {data.content}
                </div>
              </div>
            )}

            <div className="data-section">
              <h4>Metadata</h4>
              <ul className="metadata-list">
                <li>
                  <span className="label">ID:</span>
                  <span className="value">{data.id || 'N/A'}</span>
                </li>
                <li>
                  <span className="label">Created:</span>
                  <span className="value">{data.created || 'N/A'}</span>
                </li>
                <li>
                  <span className="label">Updated:</span>
                  <span className="value">{data.updated || 'N/A'}</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>No data to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
