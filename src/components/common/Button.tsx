import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold leading-none whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const sizeStyles = {
    sm: 'min-h-[36px] text-xs px-3.5 py-1.5 rounded-xl gap-1.5',
    md: 'min-h-[42px] text-sm px-4.5 py-2.5 rounded-2xl gap-2',
    lg: 'min-h-[48px] text-base px-6 py-3 rounded-full gap-2.5',
  }

  const variantStyles = {
    primary:
      'bg-[#087BFF] text-white border border-[#087BFF] hover:bg-[#1A87FF] active:bg-[#006DE6] shadow-[0_4px_16px_rgba(8,123,255,0.3)] hover:shadow-[0_6px_22px_rgba(8,123,255,0.45)]',
    gradient:
      'bg-gradient-to-r from-[#087BFF] via-[#4868FF] to-[#7957FF] text-white border border-[#00D9FF]/40 shadow-[0_4px_20px_rgba(121,87,255,0.35)] hover:shadow-[0_6px_28px_rgba(0,217,255,0.45)] hover:scale-[1.02] active:scale-[0.99]',
    secondary:
      'bg-[#07152B] text-white border border-[var(--border-card)] hover:bg-[#0B2447] hover:border-[#00D9FF]/40 active:bg-[#040E20] shadow-sm',
    outline:
      'border border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-[#00D9FF]/60 hover:bg-[#087BFF]/10 active:bg-[#087BFF]/15',
    ghost:
      'text-[var(--text-main)] hover:bg-[#087BFF]/10 active:bg-[#087BFF]/15',
    danger:
      'bg-[#EF4444] text-white border border-[#EF4444] hover:bg-[#DC2626] active:bg-[#B91C1C] shadow-sm hover:shadow-[0_4px_14px_rgba(239,68,68,0.3)]',
  }

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="inline-flex items-center shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}
