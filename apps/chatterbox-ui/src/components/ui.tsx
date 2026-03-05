import React from 'react';

// ── Page shell ─────────────────────────────────────────────────────────────────

interface PageShellProps {
  title:    string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageShell({ title, subtitle, actions, children }: PageShellProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{subtitle}</p>
          )}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label:   string;
  value:   string | number;
  sub?:    string;
  accent?: string;
  icon?:   React.ReactNode;
}

export function StatCard({ label, value, sub, accent = 'var(--accent)', icon }: StatCardProps) {
  return (
    <div style={{
      background:   'var(--bg-surface)',
      border:       '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding:      '20px 24px',
      display:      'flex',
      flexDirection:'column',
      gap:          6,
      position:     'relative',
      overflow:     'hidden',
    }}>
      {/* glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        opacity: 0.6,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          {label}
        </span>
        {icon && <span style={{ color: accent, opacity: 0.7 }}>{icon}</span>}
      </div>

      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
        {value}
      </div>

      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────

interface CardProps {
  children:  React.ReactNode;
  style?:    React.CSSProperties;
  title?:    string;
  actions?:  React.ReactNode;
}

export function Card({ children, style, title, actions }: CardProps) {
  return (
    <div style={{
      background:   'var(--bg-surface)',
      border:       '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      overflow:     'hidden',
      ...style,
    }}>
      {(title || actions) && (
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '14px 20px',
          borderBottom:   '1px solid var(--border)',
        }}>
          {title && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {title}
            </span>
          )}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Button ─────────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?:    'sm' | 'md';
  loading?: boolean;
  icon?:    React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, icon, children, style, ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    border:         'none',
    cursor:         rest.disabled || loading ? 'not-allowed' : 'pointer',
    fontFamily:     'inherit',
    fontWeight:     600,
    letterSpacing:  '-0.01em',
    transition:     'all 0.15s',
    borderRadius:   8,
    padding:        size === 'sm' ? '6px 12px' : '9px 18px',
    fontSize:       size === 'sm' ? 12 : 13,
    opacity:        rest.disabled || loading ? 0.5 : 1,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)',    color: '#fff' },
    ghost:   { background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    danger:  { background: 'var(--red-dim)',   color: 'var(--red)',            border: '1px solid rgba(239,68,68,0.3)' },
  };

  return (
    <button style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {loading ? <Spinner size={14} /> : icon}
      {children}
    </button>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────────

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div style={{
      width:  size,
      height: size,
      border: `2px solid var(--border)`,
      borderTopColor: 'var(--accent)',
      borderRadius:   '50%',
      animation:      'spin 0.7s linear infinite',
      flexShrink:     0,
    }} />
  );
}

// ── Input ──────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, style, ...rest }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
      <input
        style={{
          background:   'var(--bg-raised)',
          border:       '1px solid var(--border)',
          borderRadius: 8,
          padding:      '9px 12px',
          fontSize:     13,
          color:        'var(--text-primary)',
          outline:      'none',
          fontFamily:   'inherit',
          transition:   'border-color 0.15s',
          width:        '100%',
          ...style,
        }}
        onFocus={e  => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
        onBlur={e   => (e.currentTarget.style.borderColor = 'var(--border)')}
        {...rest}
      />
    </div>
  );
}

// ── Hash chip ─────────────────────────────────────────────────────────────────

export function HashChip({ hash, label }: { hash: string; label?: string }) {
  const short = `${hash.slice(0, 8)}…${hash.slice(-4)}`;
  return (
    <span title={hash} style={{
      fontFamily:   'JetBrains Mono, monospace',
      fontSize:     11,
      background:   'var(--bg-raised)',
      color:        'var(--accent)',
      border:       '1px solid rgba(59,130,246,0.2)',
      borderRadius: 4,
      padding:      '2px 7px',
      display:      'inline-flex',
      alignItems:   'center',
      gap:          5,
    }}>
      {label && <span style={{ color: 'var(--text-muted)', fontFamily: 'inherit' }}>{label}: </span>}
      {short}
    </span>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────────

interface BadgeProps { label: string; color?: string; bg?: string; }

export function Badge({ label, color = 'var(--green)', bg = 'var(--green-dim)' }: BadgeProps) {
  return (
    <span style={{
      fontSize:     10,
      fontWeight:   700,
      textTransform:'uppercase',
      letterSpacing:'0.06em',
      color,
      background:   bg,
      borderRadius: 4,
      padding:      '2px 7px',
    }}>
      {label}
    </span>
  );
}

// ── Global keyframes ───────────────────────────────────────────────────────────

const style = document.createElement('style');
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
