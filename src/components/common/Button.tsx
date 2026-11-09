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
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#159FB5]/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3.5 rounded-xl gap-2.5 font-semibold',
  }

  const variantStyles = {
    primary:
      'bg-[#159FB5] text-white hover:bg-[#118496] active:bg-[#0E6C7B] shadow-sm hover:shadow-md hover:shadow-[#159FB5]/20',
    secondary:
      'bg-[#164E5A] dark:bg-[#1C6170] text-white hover:bg-[#1C6170] dark:hover:bg-[#237486] active:bg-[#123E48] shadow-sm',
    outline:
      'border border-[var(--border-card)] bg-[var(--bg-card)] text-[#164E5A] dark:text-[#EAF3F4] hover:border-[#159FB5] dark:hover:border-[#35C6D9] hover:bg-[#159FB5]/10 active:bg-[#159FB5]/20',
    ghost:
      'text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10',
    danger:
      'bg-[#E07A5F] text-white hover:bg-[#D46B50] active:bg-[#C25A40]',
  }

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
