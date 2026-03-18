import React, { useState, useRef, useEffect } from 'react';
import { TaskStatus } from '../types/task';
import { ChevronDown, Clock, Search, Zap, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusSelectorProps {
  currentStatus: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
}

const statusOptions: { value: TaskStatus; label: string; icon: React.ReactNode; className: string }[] = [
  {
    value: 'pending',
    label: 'Pending',
    icon: <Clock className="w-4 h-4" />,
    className: 'text-slate-300 hover:bg-slate-500/20',
  },
  {
    value: 'investigating',
    label: 'Investigating',
    icon: <Search className="w-4 h-4" />,
    className: 'text-amber-300 hover:bg-amber-500/20',
  },
  {
    value: 'active',
    label: 'Active',
    icon: <Zap className="w-4 h-4" />,
    className: 'text-blue-300 hover:bg-blue-500/20',
  },
  {
    value: 'complete',
    label: 'Complete',
    icon: <CheckCircle2 className="w-4 h-4" />,
    className: 'text-emerald-300 hover:bg-emerald-500/20',
  },
];

export function StatusSelector({ currentStatus, onStatusChange }: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = statusOptions.find((opt) => opt.value === currentStatus)!;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all text-sm"
      >
        {currentOption.icon}
        <span className={currentOption.className.split(' ')[0]}>{currentOption.label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden"
          >
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onStatusChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-all ${option.className} ${
                  option.value === currentStatus ? 'bg-slate-700/50' : ''
                }`}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
