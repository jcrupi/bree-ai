import React, { useState } from 'react';
import { Task, TaskStatus } from '../types/task';
import { ExternalLink, Edit2, Trash2, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { CommentSection } from './CommentSection';

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
                  <td className="px-4 py-3 text-sm text-slate-200 max-w-md">
                    <div className="truncate" title={task.description}>
                      {task.description}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {task.link && (
                      <a
                        href={task.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Linear
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
