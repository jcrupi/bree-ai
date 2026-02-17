interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function Avatar({
  src,
  alt = '',
  name,
  size = 'md',
  className = '',
}: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={`rounded-full object-cover ${sizes[size]} ${className}`}
      />
    )
  }

  return (
    <div
      className={`
        rounded-full bg-gradient-to-br from-brand-orange to-brand-orange-dark
        flex items-center justify-center font-semibold text-white
        ${sizes[size]}
        ${className}
      `}
    >
      {name ? getInitials(name) : '?'}
    </div>
  )
}
