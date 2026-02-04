import React from 'react';
import { motion } from 'framer-motion';
import { currentBrand } from '../../config/branding';

export interface ActionToggleProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  variant?: 'blue' | 'green' | 'yellow' | 'pink' | 'purple' | 'orange' | 'brand';
  activeColor?: string;
  onClick: () => void;
  title?: string;
  className?: string;
}

export const ActionToggle: React.FC<ActionToggleProps> = ({
  icon,
  label,
  isActive = false,
  variant = 'blue',
  activeColor,
  onClick,
  title,
  className = '',
}) => {
  const variants = {
    blue: 'bg-blue-500/20 text-black border-blue-500/30 hover:border-blue-500/50',
    green: 'bg-green-500/20 text-black border-green-500/30 hover:border-green-500/50',
    yellow: 'bg-yellow-500/20 text-black border-yellow-500/30 hover:border-yellow-500/50',
    pink: 'bg-pink-500/20 text-black border-pink-500/30 hover:border-pink-500/50',
    purple: 'bg-purple-500/20 text-black border-purple-500/30 hover:border-purple-500/50',
    orange: 'bg-brand-orange/20 text-black border-brand-orange/30 hover:border-brand-orange/50',
    brand: variant === 'brand' && activeColor 
      ? '' // Managed by style prop
      : 'bg-[#D448AA]/20 text-black border-[#D448AA]/30 hover:border-[#D448AA]/50',
  };

  const activeClass = variants[variant];
  
  // Adapt inactive state based on brand theme (HabitAware is light)
  const isLightTheme = currentBrand?.name === 'habitaware-ai' || currentBrand?.name === 'genius-talent';
  const inactiveClass = isLightTheme
    ? 'bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200 hover:text-black'
    : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-200';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      title={title}
      style={isActive && variant === 'brand' && activeColor ? {
        backgroundColor: `${activeColor}20`,
        color: '#000000',
        borderColor: `${activeColor}40`
      } : {}}
      className={`
        flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all border
        ${isActive ? activeClass : inactiveClass}
        ${className}
      `}
    >
      <span className="flex items-center justify-center">
        {icon}
      </span>
      <span>{label}</span>
    </motion.button>
  );
};
