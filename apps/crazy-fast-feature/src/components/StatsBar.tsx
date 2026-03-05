import React from 'react';
import { Clock, Search, Zap, CheckCircle2, LayoutList } from 'lucide-react';

interface StatsBarProps {
  stats: {
    total: number;
    pending: number;
    investigating: number;
    active: number;
    complete: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  const statItems = [
    { label: 'Total', value: stats.total, icon: <LayoutList className="w-4 h-4" />, color: 'text-slate-300' },
    { label: 'Pending', value: stats.pending, icon: <Clock className="w-4 h-4" />, color: 'text-slate-400' },
    { label: 'Investigating', value: stats.investigating, icon: <Search className="w-4 h-4" />, color: 'text-amber-400' },
    { label: 'Active', value: stats.active, icon: <Zap className="w-4 h-4" />, color: 'text-blue-400' },
    { label: 'Complete', value: stats.complete, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 flex items-center gap-3"
        >
          <div className={`p-2 rounded-lg bg-slate-800/50 ${item.color}`}>
            {item.icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{item.value}</p>
            <p className="text-xs text-slate-400">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
