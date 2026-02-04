import React from 'react';

export interface ActionGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionGroup: React.FC<ActionGroupProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${className}`}>
      {children}
    </div>
  );
};
