import { clsx } from 'clsx'
import type { ReactNode } from 'react'

// ── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode
  className?: string
  elevated?: boolean
  onClick?: () => void
}

export function Card({ children, className, elevated, onClick }: CardProps) {
  return (
    <div
      className={clsx(elevated ? 'glass-elevated' : 'glass', 'p-5', className)}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'accent' | 'success' | 'warn' | 'gold'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const styles: Record<string, string> = {
    default: 'bg-white/5 text-th-text-secondary',
    accent: 'bg-th-accent/20 text-th-accent',
    success: 'bg-emerald-500/20 text-emerald-400',
    warn: 'bg-red-500/20 text-red-400',
    gold: 'bg-yellow-500/10 text-yellow-400',
  }

  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium font-mono',
      styles[variant]
    )}>
      {children}
    </span>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  loading?: boolean
  className?: string
  type?: 'button' | 'submit'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  children, onClick, variant = 'primary',
  disabled, loading, className, type = 'button', size = 'md'
}: ButtonProps) {
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'th-btn',
        `th-btn-${variant}`,
        sizes[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  label?: string
  error?: string
  disabled?: boolean
}

export function Input({ value, onChange, placeholder, type = 'text', label, error, disabled }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-th-text-secondary uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx('th-input', error && 'border-red-500')}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}

// ── Token Balance Display ──────────────────────────────────────────────────────

interface TokenBalanceProps {
  balance: number
  size?: 'sm' | 'md' | 'lg'
}

export function TokenBalance({ balance, size = 'md' }: TokenBalanceProps) {
  const formatted = balance.toLocaleString()
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  return (
    <div className="flex items-baseline gap-1.5">
      <span className={clsx(sizes[size], 'font-mono font-light text-gradient token-count')}>
        {formatted}
      </span>
      <span className="text-xs text-th-text-muted font-mono uppercase tracking-wider">tokens</span>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      style={{ width: size, height: size }}
      className="animate-spin text-th-accent"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="border-t border-th-border my-4" />

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 border-t border-th-border" />
      <span className="text-xs text-th-text-muted">{label}</span>
      <div className="flex-1 border-t border-th-border" />
    </div>
  )
}
