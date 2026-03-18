import React, { useState } from 'react';
import { Task, TaskStatus } from '../types/task';
import { StatusBadge } from './StatusBadge';
import { ProductBadge } from './ProductBadge';
import { StatusSelector } from './StatusSelector';
import { CommentSection } from './CommentSection';
import { ExternalLink, Edit2, ChevronDown, Calendar, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskCardProps {
  task: Task;
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddComment: (text: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export function TaskCard({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  onAddComment,
  onDeleteComment,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-all group"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono font-semibold text-indigo-400">{task.taskId}</span>
              <ProductBadge productName={task.productName} />
              <StatusBadge status={task.status} size="sm" />
            </div>
            
            <h3 className="text-lg font-medium text-slate-100 mb-2 line-clamp-2">
              {task.description}
            </h3>
            
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(task.createdDate)}
              </div>
              {task.link && (
                <a
                  href={task.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View in Linear
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusSelector currentStatus={task.status} onStatusChange={onStatusChange} />
            <button
              onClick={onEdit}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
              title="Edit task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-slate-400 hover:text-red-400"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          {isExpanded ? 'Hide' : 'Show'} Comments ({task.comments.length})
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <CommentSection
                comments={task.comments}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
