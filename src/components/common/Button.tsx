import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
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
    'inline-flex items-center justify-center font-medium leading-none whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-main)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const sizeStyles = {
    sm: 'min-h-[34px] text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'min-h-[40px] text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'min-h-[46px] text-base px-6 py-3 rounded-xl gap-2 font-semibold',
  }

  const variantStyles = {
    primary:
      'bg-[#0D5663] text-[#EAF4F8] border border-[#0D5663] hover:bg-[#0F6979] active:bg-[#0A4550] dark:bg-[#22D3EE] dark:text-[#071827] dark:border-[#22D3EE] dark:hover:bg-[#38BDF8] dark:active:bg-[#06B6D4] dark:font-semibold shadow-sm hover:shadow-[0_4px_16px_rgba(34,211,238,0.25)]',
    secondary:
      'bg-[#0B2735] text-[#EAF4F8] border border-[#0D5663] hover:bg-[#0D3547] hover:border-[#22D3EE]/50 active:bg-[#071827] shadow-sm',
    outline:
      'border border-[var(--border-card)] bg-[var(--bg-card-subtle)] text-[var(--text-main)] hover:border-[#0D5663] dark:hover:border-[#22D3EE]/60 hover:bg-[#0D5663]/10 dark:hover:bg-[#0D5663]/35 active:bg-[#0D5663]/20',
    ghost:
      'text-[var(--text-main)] hover:bg-[#0D5663]/10 dark:hover:bg-[#0D5663]/30',
    danger:
      'bg-[#EF4444] text-white border border-[#EF4444] hover:bg-[#DC2626] active:bg-[#B91C1C] shadow-sm',
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
