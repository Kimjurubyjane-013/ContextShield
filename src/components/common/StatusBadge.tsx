import React from 'react'

export type StatusBadgeVariant =
  | 'safe'
  | 'suspicious'
  | 'threat'
  | 'ai'
  | 'local'
  | 'info'
  | 'warning'
  | 'neutral'

export interface StatusBadgeProps {
  variant?: StatusBadgeVariant
  children: React.ReactNode
  icon?: React.ReactNode
  dot?: boolean
  pulse?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const VARIANT_STYLES: Record<StatusBadgeVariant, { container: string; dot: string }> = {
  safe: {
    container:
      'bg-[#22C55E]/12 text-[#15803D] border-[#22C55E]/35 dark:bg-[#22C55E]/15 dark:text-[#4ADE80] dark:border-[#22C55E]/35',
    dot: 'bg-[#22C55E]',
  },
  suspicious: {
    container:
      'bg-[#F59E0B]/12 text-[#B45309] border-[#F59E0B]/35 dark:bg-[#F59E0B]/15 dark:text-[#FBBF24] dark:border-[#F59E0B]/35',
    dot: 'bg-[#F59E0B]',
  },
  warning: {
    container:
      'bg-[#F59E0B]/12 text-[#B45309] border-[#F59E0B]/35 dark:bg-[#F59E0B]/15 dark:text-[#FBBF24] dark:border-[#F59E0B]/35',
    dot: 'bg-[#F59E0B]',
  },
  threat: {
    container:
      'bg-[#EF4444]/12 text-[#B91C1C] border-[#EF4444]/35 dark:bg-[#EF4444]/15 dark:text-[#F87171] dark:border-[#EF4444]/35',
    dot: 'bg-[#EF4444]',
  },
  ai: {
    container:
      'bg-[#0D5663]/10 text-[#0E7490] border-[#0D5663]/30 dark:bg-[#22D3EE]/12 dark:text-[#22D3EE] dark:border-[#22D3EE]/35',
    dot: 'bg-[#22D3EE]',
  },
  local: {
    container:
      'bg-[#0D5663]/12 text-[#0D5663] border-[#0D5663]/30 dark:bg-[#0D5663]/45 dark:text-[#67E8F9] dark:border-[#22D3EE]/25',
    dot: 'bg-[#0D5663] dark:bg-[#22D3EE]',
  },
  info: {
    container:
      'bg-[#0EA5E9]/10 text-[#0369A1] border-[#0EA5E9]/30 dark:bg-[#22D3EE]/10 dark:text-[#7DD3FC] dark:border-[#22D3EE]/30',
    dot: 'bg-[#22D3EE]',
  },
  neutral: {
    container:
      'bg-[#64748B]/10 text-[#334155] border-[#64748B]/25 dark:bg-[#0F3142] dark:text-[#94B8C7] dark:border-[#164E63]',
    dot: 'bg-[#64748B] dark:bg-[#94B8C7]',
  },
}

const SIZE_STYLES: Record<'sm' | 'md', string> = {
  sm: 'min-h-[24px] px-2.5 py-0.5 text-[11px]',
  md: 'min-h-[26px] px-2.5 py-1 text-[11px]',
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  dot = false,
  pulse = false,
  size = 'md',
  className = '',
}) => {
  const styles = VARIANT_STYLES[variant]

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-semibold leading-none border shrink-0 whitespace-nowrap select-none ${SIZE_STYLES[size]} ${styles.container} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot} ${pulse ? 'animate-pulse' : ''}`}
          aria-hidden="true"
        />
      )}
      {icon && (
        <span className="inline-flex items-center justify-center shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="leading-none">{children}</span>
    </span>
  )
}
