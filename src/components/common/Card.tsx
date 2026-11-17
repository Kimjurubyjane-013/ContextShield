import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'elevated' | 'interactive' | 'glass'
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-3xl transition-all duration-250 overflow-hidden relative'

  const variantStyles = {
    default:
      'bg-[var(--bg-card)] border border-[var(--border-card)] shadow-[var(--shadow-card)] text-[var(--text-main)]',
    subtle:
      'bg-[var(--bg-card-subtle)] border border-[var(--border-card)] text-[var(--text-main)]',
    elevated:
      'bg-[var(--bg-elevated)] border border-[var(--border-card)] shadow-xl text-[var(--text-main)]',
    glass:
      'bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-card)] shadow-[var(--shadow-card)] text-[var(--text-main)]',
    interactive:
      'bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[#00D9FF]/50 hover:shadow-[0_8px_28px_rgba(0,217,255,0.14)] hover:translate-y-[-2px] cursor-pointer text-[var(--text-main)]',
  }

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
}
