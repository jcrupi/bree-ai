import React, { useState } from 'react';
import { Task, TaskStatus } from '../types/task';
import { ChevronDown, ChevronRight, Settings2, Check } from 'lucide-react';
import { CommentSection } from './CommentSection';

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
  { key: 'description', label: 'Description', visible: true, width: '400px' },
  { key: 'link', label: 'Link', visible: true, width: '400px' },
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
      case 'description':
        return (
          <span 
            className="text-slate-300 cursor-pointer hover:text-white"
            onClick={() => onEdit(task)}
          >
            {task.description}
          </span>
        );
      case 'link':
        return task.link ? (
          <a
            href={task.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-200 truncate block"
          >
            {task.link}
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
