import React from 'react'
import type { ScanStatus } from '@/types'

export interface BadgeProps {
  status?: ScanStatus | 'ai' | 'neutral'
  children: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  status = 'neutral',
  children,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium',
  }

  const statusStyles = {
    // Natural Green for safe
    safe: 'bg-[#2E8B57]/15 text-[#216740] dark:bg-[#2E8B57]/25 dark:text-[#67D59A] border border-[#2E8B57]/30',
    // Soft Orange for suspicious
    suspicious: 'bg-[#E07A5F]/15 text-[#B8573D] dark:bg-[#E07A5F]/25 dark:text-[#F3A58E] border border-[#E07A5F]/30',
    // Threat
    threat: 'bg-[#D9383A]/15 text-[#B32426] dark:bg-[#D9383A]/25 dark:text-[#FFA4A6] border border-[#D9383A]/30',
    // Bright Cyan for AI badge
    ai: 'bg-[#159FB5]/15 text-[#117B8C] dark:bg-[#35C6D9]/20 dark:text-[#35C6D9] border border-[#159FB5]/30',
    // Soft Coastal / Neutral
    neutral: 'bg-[#A6C5C1]/25 text-[#164E5A] dark:bg-[#A6C5C1]/15 dark:text-[#A6C5C1] border border-[#A6C5C1]/40',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeStyles[size]} ${statusStyles[status]} ${className}`}>
      {status === 'safe' && <span className="w-1.5 h-1.5 rounded-full bg-[#2E8B57]" />}
      {status === 'suspicious' && <span className="w-1.5 h-1.5 rounded-full bg-[#E07A5F]" />}
      {status === 'threat' && <span className="w-1.5 h-1.5 rounded-full bg-[#D9383A]" />}
      {status === 'ai' && <span className="w-1.5 h-1.5 rounded-full bg-[#35C6D9] animate-pulse" />}
      {children}
    </span>
  )
}
