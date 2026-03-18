import React, { useState, useRef } from 'react';
import { Task, TaskStatus } from '../types/task';
import { Edit2, Trash2, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { CommentSection } from './CommentSection';

/** Linear's triangle logo as a minimal SVG */
const LinearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.22541 61.5228c-.2225-.9485.90748-1.5459 1.59638-.857l37.9438 37.9438c.6889.6889.0915 1.8189-.857 1.5964C17.3165 95.8428 4.1572 82.6835 1.22541 61.5228zM.00189135 46.8891c-.01764375 1.1378.30657 2.2569.9141 3.2136l48.9820998 48.982c.9567.6075 2.0758.9317 3.2136.9141C32.1373 99.48.52 67.8627.00189135 46.8891zM5.68654 31.1801l62.9944 62.9944c1.4647-.3734 2.9094-.8967 4.3154-1.5758L7.26196 26.8647c-.67913 1.406-1.20239 2.8507-1.57542 4.3154zM15.3845 18.6962l65.9193 65.9193c1.1608-.7589 2.2629-1.6044 3.2969-2.5338L17.9183 15.3993c-.9294 1.034-1.7749 2.1361-2.5338 3.2969zM27.2103 9.29837l63.4893 63.4893c.8551-1.1608 1.6232-2.3646 2.2856-3.6236L30.8339 7.01278c-1.259.66236-2.4628 1.43056-3.6236 2.28559zM41.5301 3.36932l54.1004 54.1004c.5253-1.5129.9253-3.0645 1.1972-4.6381L46.1682 2.17217c-1.5736.27196-3.1252.67193-4.6381 1.19715zM57.0547 .90961l41.1353 41.1353c.1271-1.7828.1386-3.5638.0346-5.3336L62.3883.87501c-1.7698-.10399-3.5508-.09246-5.3336.03460z" fill="currentColor"/>
  </svg>
);

/** Truncated description cell with hover tooltip */
function DescriptionCell({ text }: { text: string }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const truncated = text.length > 50 ? text.slice(0, 50) + '…' : text;
  const needsTooltip = text.length > 50;

  return (
    <div className="relative" ref={ref}>
      <span
        className={`text-sm text-slate-200 ${needsTooltip ? 'cursor-help' : ''}`}
        onMouseEnter={() => needsTooltip && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {truncated}
      </span>
      {hovered && needsTooltip && (
        <div className="absolute z-50 left-0 top-full mt-1.5 w-80 p-3 rounded-lg bg-slate-800 border border-slate-600 shadow-xl text-xs text-slate-200 leading-relaxed pointer-events-none">
          {text}
        </div>
      )}
    </div>
  );
}

interface TaskTableProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddComment: (taskId: string, text: string) => void;
  onDeleteComment: (taskId: string, commentId: string) => void;
}

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-slate-500' },
  { value: 'investigating', label: 'Investigating', color: 'bg-amber-500' },
  { value: 'active', label: 'Active', color: 'bg-blue-500' },
  { value: 'complete', label: 'Complete', color: 'bg-emerald-500' },
];

const productColors: Record<string, string> = {
  'Wound AI': 'text-rose-400',
  'Performance AI': 'text-violet-400',
  'Extraction AI': 'text-cyan-400',
};

export function TaskTable({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  onAddComment,
  onDeleteComment,
}: TaskTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/50">
              <th className="w-10 px-4 py-3"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Task ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Link</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {tasks.map((task) => (
              <React.Fragment key={task.id}>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleRow(task.id)}
                      className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400"
                    >
                      {expandedRows.has(task.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium ${productColors[task.productName] || 'text-slate-300'}`}>
                    {task.productName}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-indigo-400">
                    {task.taskId}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-200 max-w-xs">
                    <DescriptionCell text={task.description} />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {task.link && (
                      <a
                        href={task.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-200 transition-colors inline-flex items-center"
                        title="Open in Linear"
                      >
                        <LinearIcon />
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {formatDate(task.createdDate)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                      className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleRow(task.id)}
                        className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200"
                        title="Comments"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {task.comments.length > 0 && (
                          <span className="ml-0.5 text-xs">{task.comments.length}</span>
                        )}
                      </button>
                      <button
                        onClick={() => onEdit(task)}
                        className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(task.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-slate-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRows.has(task.id) && (
                  <tr className="bg-slate-800/20">
                    <td colSpan={8} className="px-8 py-4">
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
  );
}
