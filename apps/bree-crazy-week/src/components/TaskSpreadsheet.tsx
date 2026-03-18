import React, { useState } from 'react';
import { Task, TaskStatus } from '../types/task';
import { ChevronDown, ChevronRight, Settings2, Check } from 'lucide-react';
import { CommentSection } from './CommentSection';

const LinearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.22541 61.5228c-.2225-.9485.90748-1.5459 1.59638-.857l37.9438 37.9438c.6889.6889.0915 1.8189-.857 1.5964C17.3165 95.8428 4.1572 82.6835 1.22541 61.5228zM.00189135 46.8891c-.01764375 1.1378.30657 2.2569.9141 3.2136l48.9820998 48.982c.9567.6075 2.0758.9317 3.2136.9141C32.1373 99.48.52 67.8627.00189135 46.8891zM5.68654 31.1801l62.9944 62.9944c1.4647-.3734 2.9094-.8967 4.3154-1.5758L7.26196 26.8647c-.67913 1.406-1.20239 2.8507-1.57542 4.3154zM15.3845 18.6962l65.9193 65.9193c1.1608-.7589 2.2629-1.6044 3.2969-2.5338L17.9183 15.3993c-.9294 1.034-1.7749 2.1361-2.5338 3.2969zM27.2103 9.29837l63.4893 63.4893c.8551-1.1608 1.6232-2.3646 2.2856-3.6236L30.8339 7.01278c-1.259.66236-2.4628 1.43056-3.6236 2.28559zM41.5301 3.36932l54.1004 54.1004c.5253-1.5129.9253-3.0645 1.1972-4.6381L46.1682 2.17217c-1.5736.27196-3.1252.67193-4.6381 1.19715zM57.0547 .90961l41.1353 41.1353c.1271-1.7828.1386-3.5638.0346-5.3336L62.3883.87501c-1.7698-.10399-3.5508-.09246-5.3336.03460z" fill="currentColor"/>
  </svg>
);

interface Column {
  key: string;
  label: string;
  visible: boolean;
  width?: string;
}

interface TaskSpreadsheetProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddComment: (taskId: string, text: string) => void;
  onDeleteComment: (taskId: string, commentId: string) => void;
}

const defaultColumns: Column[] = [
  { key: 'productName', label: 'Product Name', visible: true, width: '120px' },
  { key: 'taskId', label: 'Task ID', visible: true, width: '100px' },
  { key: 'description', label: 'Description', visible: true, width: '180px' },
  { key: 'link', label: 'Link', visible: true, width: '48px' },
  { key: 'createdDate', label: 'Task Created Date', visible: true, width: '130px' },
  { key: 'status', label: 'Status', visible: true, width: '100px' },
];

export function TaskSpreadsheet({
  tasks,
  onStatusChange,
  onEdit,
  onAddComment,
  onDeleteComment,
}: TaskSpreadsheetProps) {
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const toggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const toggleRow = (taskId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const visibleColumns = columns.filter((col) => col.visible);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const renderCell = (task: Task, columnKey: string) => {
    switch (columnKey) {
      case 'productName':
        return <span className="text-slate-200">{task.productName}</span>;
      case 'taskId':
        return <span className="text-slate-300">{task.taskId}</span>;
      case 'description': {
        const full = task.description;
        const short = full.length > 25 ? full.slice(0, 25) + '…' : full;
        return (
          <div className="relative group">
            <span
              className="text-slate-300 cursor-pointer hover:text-white"
              onClick={() => onEdit(task)}
            >
              {short}
            </span>
            {full.length > 25 && (
              <div className="absolute z-50 left-0 top-full mt-1.5 w-72 p-3 rounded-lg bg-slate-800 border border-slate-600 shadow-xl text-xs text-slate-200 leading-relaxed pointer-events-none hidden group-hover:block">
                {full}
              </div>
            )}
          </div>
        );
      }
      case 'link':
        return task.link ? (
          <a
            href={task.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-200 transition-colors inline-flex items-center"
            title="Open in Linear"
          >
            <LinearIcon />
          </a>
        ) : null;
      case 'createdDate':
        return <span className="text-slate-400">{formatDate(task.createdDate)}</span>;
      case 'status':
        return (
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            className="bg-transparent border-none text-slate-300 text-sm focus:outline-none cursor-pointer"
          >
            <option value="pending" className="bg-slate-900">Pending</option>
            <option value="investigating" className="bg-slate-900">Investigating</option>
            <option value="active" className="bg-slate-900">Inprocess</option>
            <option value="complete" className="bg-slate-900">Complete</option>
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Column Toggle Button */}
      <div className="flex justify-end mb-2">
        <div className="relative">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            Columns
          </button>
          {showColumnMenu && (
            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 min-w-[180px]">
              {columns.map((col) => (
                <button
                  key={col.key}
                  onClick={() => toggleColumn(col.key)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${col.visible ? 'bg-indigo-600 border-indigo-600' : 'border-slate-500'}`}>
                    {col.visible && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {col.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Container with Horizontal Scroll */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900">
                <th className="w-8 px-2 py-3"></th>
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-sm font-medium text-slate-400"
                    style={{ minWidth: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => (
                <React.Fragment key={task.id}>
                  <tr 
                    className={`border-b border-slate-800 hover:bg-slate-800/30 transition-colors ${
                      index % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-900/30'
                    }`}
                  >
                    <td className="px-2 py-2">
                      <button
                        onClick={() => toggleRow(task.id)}
                        className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-500 hover:text-slate-300"
                      >
                        {expandedRows.has(task.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-2 text-sm"
                        style={{ minWidth: col.width }}
                      >
                        {renderCell(task, col.key)}
                      </td>
                    ))}
                  </tr>
                  {expandedRows.has(task.id) && (
                    <tr className="bg-slate-800/50">
                      <td colSpan={visibleColumns.length + 1} className="px-6 py-4">
                        <CommentSection
                          comments={task.comments}
                          onAddComment={(text) => onAddComment(task.id, text)}
                          onDeleteComment={(commentId) => onDeleteComment(task.id, commentId)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {tasks.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No tasks found
          </div>
        )}
      </div>
    </div>
  );
}
