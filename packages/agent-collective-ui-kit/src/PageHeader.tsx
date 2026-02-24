import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => (
  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
    <div>
      <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '4px', fontFamily: '"Outfit", sans-serif', color: 'var(--text-main, #f8fafc)' }}>
        {title}
      </h1>
      {description && (
        <p style={{ color: 'var(--text-muted, #94a3b8)' }}>
          {description}
        </p>
      )}
    </div>
    {actions && (
      <div style={{ display: 'flex', gap: '12px' }}>
        {actions}
      </div>
    )}
  </header>
);
