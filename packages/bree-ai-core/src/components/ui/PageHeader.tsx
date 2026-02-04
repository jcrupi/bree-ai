import React from 'react';
import { motion } from 'framer-motion';
import { currentBrand } from '../../config/branding';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  logo?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  description?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  logo,
  actions,
  description,
  className = '',
}) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between mb-8 sm:mb-12 ${className}`}
    >
      <div className="flex items-center gap-4">
        {logo && (
          <motion.div 
            className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-white shadow-lg flex-shrink-0" 
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            {logo}
          </motion.div>
        )}
        <div>
          {subtitle && (
            <div className={`text-xs font-medium uppercase tracking-wider mb-1 ${
              currentBrand.name === 'habitaware-ai' ? 'text-[#D448AA]' : 'text-blue-400'
            }`}>
              {subtitle}
            </div>
          )}
          <h1 className={`font-bold tracking-tight transition-all duration-500 ${
            currentBrand.name === 'habitaware-ai' 
              ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-slate-900' 
              : 'text-xl sm:text-2xl md:text-3xl text-black'
          }`}>{title}</h1>
          {description && (
            <p className={`${
              currentBrand.name === 'habitaware-ai' ? 'text-slate-500' : 'text-slate-400'
            } text-sm md:text-base mt-1`}>{description}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </motion.header>
  );
};
