import React from 'react';
import { motion } from 'framer-motion';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend, onClick }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    onClick={onClick}
    style={{
       background: 'rgba(255, 255, 255, 0.03)',
       backdropFilter: 'blur(12px)',
       WebkitBackdropFilter: 'blur(12px)',
       border: '1px solid rgba(255, 255, 255, 0.1)',
       borderRadius: '16px',
       padding: '24px',
       cursor: onClick ? 'pointer' : 'default'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.875rem', marginBottom: '4px' }}>{title}</p>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)' }}>{value}</h3>
        {trend && (
          <p style={{ color: trend.startsWith('+') ? '#10b981' : '#ef4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: '600' }}>
            {trend} from last month
          </p>
        )}
      </div>
      <div style={{ padding: '12px', borderRadius: '12px', background: `${color}20`, color }}>
        <Icon size={24} />
      </div>
    </div>
  </motion.div>
);
