import React from 'react';
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'outline' | 'blue' | 'green' | 'red' | 'purple';
  className?: string;
}
export function Badge({
  children,
  variant = 'default',
  className = ''
}: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-600',
    outline: 'border border-slate-200 text-slate-500',
    blue: 'bg-blue-50 text-blue-600 border border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    red: 'bg-rose-50 text-rose-600 border border-rose-100',
    purple: 'bg-violet-50 text-violet-600 border border-violet-100'
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>

      {children}
    </span>);

}