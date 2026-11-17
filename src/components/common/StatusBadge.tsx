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
      'bg-[#00D6B2]/12 text-[#00A88B] border-[#00D6B2]/30 dark:bg-[#00D6B2]/15 dark:text-[#00D6B2] dark:border-[#00D6B2]/40',
    dot: 'bg-[#00D6B2] shadow-[0_0_8px_#00D6B2]',
  },
  suspicious: {
    container:
      'bg-[#F59E0B]/12 text-[#D97706] border-[#F59E0B]/30 dark:bg-[#F59E0B]/15 dark:text-[#FBBF24] dark:border-[#F59E0B]/40',
    dot: 'bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]',
  },
  warning: {
    container:
      'bg-[#F59E0B]/12 text-[#D97706] border-[#F59E0B]/30 dark:bg-[#F59E0B]/15 dark:text-[#FBBF24] dark:border-[#F59E0B]/40',
    dot: 'bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]',
  },
  threat: {
    container:
      'bg-[#EF4444]/12 text-[#DC2626] border-[#EF4444]/30 dark:bg-[#EF4444]/15 dark:text-[#F87171] dark:border-[#EF4444]/40',
    dot: 'bg-[#EF4444] shadow-[0_0_8px_#EF4444]',
  },
  ai: {
    container:
      'bg-[#087BFF]/12 text-[#087BFF] border-[#087BFF]/30 dark:bg-[#00D9FF]/15 dark:text-[#00D9FF] dark:border-[#00D9FF]/40',
    dot: 'bg-[#00D9FF] shadow-[0_0_8px_#00D9FF]',
  },
  local: {
    container:
      'bg-[#087BFF]/10 text-[#087BFF] border-[#087BFF]/25 dark:bg-[#087BFF]/20 dark:text-[#38BDF8] dark:border-[#087BFF]/40',
    dot: 'bg-[#087BFF] dark:bg-[#38BDF8] shadow-[0_0_8px_#087BFF]',
  },
  info: {
    container:
      'bg-[#00D9FF]/10 text-[#0891B2] border-[#00D9FF]/30 dark:bg-[#00D9FF]/15 dark:text-[#00D9FF] dark:border-[#00D9FF]/40',
    dot: 'bg-[#00D9FF] shadow-[0_0_8px_#00D9FF]',
  },
  neutral: {
    container:
      'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border-[var(--border-card)]',
    dot: 'bg-[var(--text-muted)]',
  },
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

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 rounded-full gap-1.5',
    md: 'text-xs px-3 py-1 rounded-full gap-2',
  }

  return (
    <span
      className={`inline-flex items-center font-semibold leading-none border transition-colors select-none ${styles.container} ${sizeClasses[size]} ${className}`}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${styles.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dot}`} />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  )
}
