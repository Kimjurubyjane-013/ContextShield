import React from 'react'
import type { ScanStatus } from '@/types'
import { StatusBadge, type StatusBadgeVariant } from './StatusBadge'

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
  const variant = status as StatusBadgeVariant
  const showDot = status !== 'neutral'

  return (
    <StatusBadge
      variant={variant}
      size={size}
      dot={showDot}
      pulse={status === 'ai'}
      className={className}
    >
      {children}
    </StatusBadge>
  )
}
