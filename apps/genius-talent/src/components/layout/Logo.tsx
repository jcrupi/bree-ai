interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  variant?: 'light' | 'dark'
}

export default function Logo({ size = 'md', className = '', variant = 'dark' }: LogoProps) {
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className={`font-extrabold tracking-tight ${sizes[size] === 'h-10' ? 'text-2xl' : 'text-xl'}`}>
        <span className="text-brand-orange">genius</span>
        <span className={variant === 'dark' ? 'text-dark-900' : 'text-white'}>talent</span>
      </span>
    </div>
  )
}
