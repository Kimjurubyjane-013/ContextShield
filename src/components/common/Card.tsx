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
      'bg-[var(--bg-card)] border-2 border-[#159FB5]/40 dark:border-[#35C6D9]/45 shadow-[0_8px_20px_rgba(21,159,181,0.1)] text-[var(--text-main)]',
    interactive:
      'bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[#159FB5]/60 dark:hover:border-[#35C6D9]/60 hover:shadow-md hover:translate-y-[-1px] cursor-pointer text-[var(--text-main)]',
  }

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
}
