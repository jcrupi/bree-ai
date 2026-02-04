import React, { useState } from 'react';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  isSidebarCollapsed: boolean;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebar,
  isSidebarCollapsed,
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-dark-950 ${className}`}>
      {sidebar}
      <main
        className={`
          transition-all duration-300
          ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}
        `}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
