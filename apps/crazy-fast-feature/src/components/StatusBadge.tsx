import React from 'react';
import { TaskStatus } from '../types/task';
import { Clock, Search, Zap, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<TaskStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    className: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    icon: <Clock className="w-3 h-3" />,
  },
  investigating: {
    label: 'Investigating',
    className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: <Search className="w-3 h-3" />,
  },
  active: {
    label: 'Active',
    className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: <Zap className="w-3 h-3" />,
  },
  complete: {
    label: 'Complete',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.className} ${sizeClasses}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
