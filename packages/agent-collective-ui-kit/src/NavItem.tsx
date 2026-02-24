import React from 'react';

export interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
      padding: '12px 16px',
      background: active ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)' : 'transparent',
      border: 'none',
      borderLeft: active ? '3px solid #6366f1' : '3px solid transparent',
      color: active ? '#6366f1' : 'var(--text-muted, #888)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '0.9rem',
      fontWeight: active ? '500' : '400',
      textAlign: 'left'
    }}
  >
    <Icon size={18} />
    {label}
  </button>
);
