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
 * ContextShield 3D Cyber Defense Logo
 */
export const ContextShieldLogo: React.FC<ContextShieldLogoProps> = ({
  size = 'md',
  showWordmark = false,
  subtitle = 'Analyze • Verify • Stay Safe',
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div className={`relative ${ICON_SIZES[size]} shrink-0 flex items-center justify-center`}>
        <div
          className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#087BFF]/30 to-[#00D9FF]/40 blur-md pointer-events-none"
          aria-hidden="true"
        />
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="navLogoGrad" x1="6" y1="4" x2="38" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00D9FF" />
              <stop offset="50%" stopColor="#087BFF" />
              <stop offset="100%" stopColor="#00D6B2" />
            </linearGradient>
            <linearGradient id="navLogoFace" x1="10" y1="6" x2="34" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0D2E5C" />
              <stop offset="100%" stopColor="#061326" />
            </linearGradient>
          </defs>

          {/* Shield Outer Shell */}
          <path
            d="M 22 5 C 31 5 37 9 37 19 C 37 30 27 37 22 39.5 C 17 37 7 30 7 19 C 7 9 13 5 22 5 Z"
            fill="url(#navLogoFace)"
            stroke="url(#navLogoGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Shield Inner Face */}
          <path
            d="M 22 9 C 28 9 33 12 33 19 C 33 27 26 33 22 35 C 18 33 11 27 11 19 C 11 12 16 9 22 9 Z"
            fill="#061426"
            stroke="#00D9FF"
            strokeWidth="1.2"
            strokeOpacity="0.75"
          />

          {/* Checkmark */}
          <path
            d="M 17 21 L 21 25 L 28 17"
            stroke="#00D9FF"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 17 21 L 21 25 L 28 17"
            stroke="#FFFFFF"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showWordmark && (
        <div className="min-w-0 text-left">
          <div className="font-extrabold text-lg tracking-tight leading-none text-[var(--text-heading)]">
            Context<span className="text-[#00D9FF]">Shield</span>
          </div>
          {subtitle && (
            <p className="text-[10px] text-[var(--text-muted)] font-medium leading-tight tracking-wider mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
