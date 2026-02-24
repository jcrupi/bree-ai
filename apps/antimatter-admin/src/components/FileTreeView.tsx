import React, { useState } from 'react';
import './FileTreeView.css';

interface FileEntry {
  path: string;
  id?: string;
  name?: string;
  isDirectory: boolean;
  children?: FileEntry[];
}

interface FileTreeViewProps {
  files: FileEntry[];
  onSelectEntry: (entry: FileEntry) => void;
  selectedPath?: string;
}

function FileTreeNode({
  entry,
  onSelectEntry,
  selectedPath,
  level = 0,
}: {
  entry: FileEntry;
  onSelectEntry: (entry: FileEntry) => void;
  selectedPath?: string;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(level < 2);
  const isSelected = selectedPath === entry.path;

  const handleClick = () => {
    if (entry.isDirectory) {
      setExpanded(!expanded);
    } else {
      onSelectEntry(entry);
    }
  };

  return (
    <div className="tree-node">
      <div
        className={`tree-item ${isSelected ? 'selected' : ''} ${
          entry.isDirectory ? 'directory' : 'file'
        }`}
        style={{ paddingLeft: `${level * 1.25}rem` }}
        onClick={handleClick}
      >
        {entry.isDirectory && (
          <span className="tree-toggle">
            {expanded ? '▼' : '▶'}
          </span>
        )}
        <span className="tree-icon">
          {entry.isDirectory ? '📁' : '📄'}
        </span>
        <span className="tree-label">{entry.name || entry.path.split('/').pop()}</span>
      </div>

      {entry.isDirectory && expanded && entry.children && (
        <div className="tree-children">
          {entry.children.map((child) => (
            <FileTreeNode
              key={child.path}
              entry={child}
              onSelectEntry={onSelectEntry}
              selectedPath={selectedPath}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTreeView({
  files,
  onSelectEntry,
  selectedPath,
}: FileTreeViewProps) {
  return (
    <div className="file-tree-view">
      {files.map((file) => (
        <FileTreeNode
          key={file.path}
          entry={file}
          onSelectEntry={onSelectEntry}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}
