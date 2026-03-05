import React from 'react';
import { TaskFilters, ProductName, TaskStatus } from '../types/task';
import { Search, Filter, X } from 'lucide-react';

interface FilterBarProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}

const productOptions: { value: ProductName | 'all'; label: string }[] = [
  { value: 'all', label: 'All Products' },
  { value: 'Wound AI', label: 'Wound AI' },
  { value: 'Performance AI', label: 'Performance AI' },
  { value: 'Extraction AI', label: 'Extraction AI' },
];

const statusOptions: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'active', label: 'Active' },
  { value: 'complete', label: 'Complete' },
];

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const hasActiveFilters = filters.productName !== 'all' || filters.status !== 'all' || filters.search !== '';

  const clearFilters = () => {
    onFiltersChange({ productName: 'all', status: 'all', search: '' });
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              placeholder="Search tasks..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <select
          value={filters.productName}
          onChange={(e) => onFiltersChange({ ...filters, productName: e.target.value as ProductName | 'all' })}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {productOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as TaskStatus | 'all' })}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
