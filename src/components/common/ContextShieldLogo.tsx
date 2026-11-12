import React from 'react'

export interface ContextShieldLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  subtitle?: string
  className?: string
}

const ICON_SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
}

/**
 * Official ContextShield geometric shield emblem.
 * Designed for crisp rendering across dark/light surfaces without heavy gradients or blur filters.
 */
export const ContextShieldLogo: React.FC<ContextShieldLogoProps> = ({
  size = 'md',
  showWordmark = false,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${ICON_SIZES[size]} shrink-0`}
        aria-hidden="true"
      >
        {/* Outer Shield Frame */}
        <path
          d="M20 3L34 8.75V19.25C34 27.95 28.05 34.9 20 37.5C11.95 34.9 6 27.95 6 19.25V8.75L20 3Z"
          fill="#071827"
          stroke="#22D3EE"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Inner Defense Core */}
        <path
          d="M20 7.25L30 11.4V19.15C30 25.65 25.7 30.85 20 33.1C14.3 30.85 10 25.65 10 19.15V11.4L20 7.25Z"
          fill="#0D5663"
          fillOpacity="0.45"
          stroke="#159FB5"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        {/* Verification Check / Signal Circuit */}
        <path
          d="M15.25 20.25L18.5 23.5L25.25 16.5"
          stroke="#22D3EE"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Top Telemetry Node */}
        <circle cx="20" cy="11.5" r="1.4" fill="#22D3EE" />
      </svg>

      {showWordmark && (
        <div className="min-w-0">
          <div className="font-extrabold text-lg tracking-tight leading-none text-[#EAF4F8]">
            Context<span className="text-[#22D3EE]">Shield</span>
          </div>
          {subtitle && (
            <p className="text-[10px] text-[#8EB2C2] font-semibold leading-tight tracking-wider uppercase mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
