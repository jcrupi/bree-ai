import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, style, ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginBottom: '16px' }}>
      {label && <label style={{ fontSize: '0.875rem', color: 'var(--text-muted, #94a3b8)', fontWeight: '500' }}>{label}</label>}
      <input
        style={{
          width: '100%',
          background: 'var(--bg-dark, #0f172a)',
          border: error ? '1px solid #ef4444' : '1px solid var(--border, #334155)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          outline: 'none',
          fontSize: '0.95rem',
          transition: 'border-color 0.2s',
          ...style,
        }}
        onFocus={(e) => {
          if (!error) e.currentTarget.style.borderColor = 'var(--primary, #6366f1)';
        }}
        onBlur={(e) => {
          if (!error) e.currentTarget.style.borderColor = 'var(--border, #334155)';
        }}
        {...props}
      />
      {error && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
    </div>
  );
};

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, style, ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginBottom: '16px' }}>
      {label && <label style={{ fontSize: '0.875rem', color: 'var(--text-muted, #94a3b8)', fontWeight: '500' }}>{label}</label>}
      <textarea
        style={{
          width: '100%',
          background: 'var(--bg-dark, #0f172a)',
          border: error ? '1px solid #ef4444' : '1px solid var(--border, #334155)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          outline: 'none',
          fontSize: '0.95rem',
          minHeight: '80px',
          resize: 'vertical',
          transition: 'border-color 0.2s',
          ...style,
        }}
        onFocus={(e) => {
          if (!error) e.currentTarget.style.borderColor = 'var(--primary, #6366f1)';
        }}
        onBlur={(e) => {
          if (!error) e.currentTarget.style.borderColor = 'var(--border, #334155)';
        }}
        {...props}
      />
      {error && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
    </div>
  );
};
