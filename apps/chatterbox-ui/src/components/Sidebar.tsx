import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, Send, BookOpen, Shield } from 'lucide-react';

const nav = [
  { to: '/',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/turns',  icon: Database,         label: 'Turns'     },
  { to: '/store',  icon: Send,             label: 'Store'     },
  { to: '/design', icon: BookOpen,         label: 'Design'    },
];

const S: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 220,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-deep)',
    borderRight: '1px solid var(--border)',
    padding: '0',
    overflow: 'hidden',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 20px 16px',
    borderBottom: '1px solid var(--border)',
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 0 16px rgba(59,130,246,0.3)',
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandName: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  brandSub: {
    fontSize: 10,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginTop: 1,
  },
  nav: {
    flex: 1,
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  footer: {
    padding: '12px 16px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
};

export function Sidebar() {
  return (
    <nav style={S.sidebar}>
      {/* Brand */}
      <div style={S.brand}>
        <div style={S.logo}>
          <Shield size={16} color="white" />
        </div>
        <div style={S.brandText}>
          <span style={S.brandName}>Chatterbox</span>
          <span style={S.brandSub}>Secure Store</span>
        </div>
      </div>

      {/* Nav links */}
      <div style={S.nav}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.15s',
              color:      isActive ? 'var(--accent)'       : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-glow)'  : 'transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer badge */}
      <div style={S.footer}>
        <div style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.04em',
        }}>
          BLAKE2b-256 · ehash-only
        </div>
      </div>
    </nav>
  );
}
