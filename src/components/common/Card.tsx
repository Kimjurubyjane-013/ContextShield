import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'featured' | 'interactive'
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-200 overflow-hidden'

  const variantStyles = {
    default:
      'bg-[var(--bg-card)] border border-[var(--border-card)] shadow-[var(--shadow-card)] text-[var(--text-main)]',
    subtle:
      'bg-[var(--bg-card-subtle)] border border-[var(--border-card)] text-[var(--text-main)]',
    featured:
      'bg-[var(--bg-card)] border border-[#0D5663]/55 dark:border-[#22D3EE]/45 shadow-[0_8px_24px_rgba(13,86,99,0.18)] text-[var(--text-main)]',
    interactive:
      'bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[#0D5663]/70 dark:hover:border-[#22D3EE]/60 hover:shadow-[0_8px_22px_rgba(34,211,238,0.1)] hover:translate-y-[-1px] cursor-pointer text-[var(--text-main)]',
  }

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
}
