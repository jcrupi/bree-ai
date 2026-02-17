import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export default function Card({
  children,
  className = '',
  hover = false,
  glow = false,
  padding = 'md',
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={`
        bg-dark-800 rounded-xl border border-dark-700
        ${paddingStyles[padding]}
        ${hover ? 'hover:border-dark-600 hover:bg-dark-700/50 transition-all duration-200 cursor-pointer' : ''}
        ${glow ? 'hover:shadow-lg hover:shadow-brand-orange/10' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-dark-100 ${className}`}>
      {children}
    </h3>
  )
}

interface CardDescriptionProps {
  children: ReactNode
  className?: string
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-dark-400 mt-1 ${className}`}>
      {children}
    </p>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-dark-700 ${className}`}>
      {children}
    </div>
  )
}
