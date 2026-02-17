interface ProgressProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient'
  className?: string
}

export default function Progress({
  value,
  max = 100,
  size = 'md',
  showLabel = false,
  variant = 'default',
  className = '',
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  const variants = {
    default: 'bg-brand-orange',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    gradient: 'bg-gradient-to-r from-brand-orange to-brand-orange-light',
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-dark-300">Progress</span>
          <span className="text-dark-100 font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-dark-700 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${sizes[size]} ${variants[variant]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
