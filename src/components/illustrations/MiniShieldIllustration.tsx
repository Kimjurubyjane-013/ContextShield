import React from 'react'

export const MiniShieldIllustration: React.FC<{ className?: string }> = ({
  className = 'w-20 h-20 sm:w-24 sm:h-24',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#087BFF]/25 via-[#00D9FF]/30 to-transparent blur-xl pointer-events-none"
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_8px_20px_rgba(0,217,255,0.35)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="miniShieldGrad" x1="20" y1="15" x2="100" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00D9FF" />
            <stop offset="50%" stopColor="#087BFF" />
            <stop offset="100%" stopColor="#00D6B2" />
          </linearGradient>
          <linearGradient id="miniShieldFace" x1="30" y1="20" x2="90" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0B274A" />
            <stop offset="100%" stopColor="#051224" />
          </linearGradient>
        </defs>

        {/* Outer Glow Shield */}
        <path
          d="M 60 14 C 84 14 96 26 96 50 C 96 80 72 98 60 105 C 48 98 24 80 24 50 C 24 26 36 14 60 14 Z"
          fill="url(#miniShieldFace)"
          stroke="url(#miniShieldGrad)"
          strokeWidth="3.5"
        />

        {/* Inner Bevel */}
        <path
          d="M 60 24 C 76 24 86 34 86 52 C 86 74 68 87 60 93 C 52 87 34 74 34 52 C 34 34 44 24 60 24 Z"
          fill="#07152B"
          stroke="#00D9FF"
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />

        {/* Center Checkmark */}
        <path
          d="M 47 57 L 56 66 L 75 46"
          stroke="#00D9FF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 47 57 L 56 66 L 75 46"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
