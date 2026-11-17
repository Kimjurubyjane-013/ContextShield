import React from 'react'

export const SafetyIllustration: React.FC<{ className?: string }> = ({
  className = 'w-36 h-36 sm:w-44 sm:h-44',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#087BFF]/20 via-[#00D9FF]/25 to-transparent blur-2xl pointer-events-none"
        aria-hidden="true"
      />
      <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10">
        <circle cx="90" cy="90" r="76" stroke="#087BFF" strokeWidth="1" strokeDasharray="4 4" opacity="0.35" />
        <circle cx="90" cy="90" r="60" fill="var(--bg-card)" stroke="#00D9FF" strokeWidth="1.5" strokeOpacity="0.6" />

        {/* Shield Frame */}
        <path
          d="M 90 48 C 112 48 124 58 124 82 C 124 110 102 126 90 134 C 78 126 56 110 56 82 C 56 58 68 48 90 48 Z"
          fill="#087BFF"
          fillOpacity="0.12"
          stroke="#00D9FF"
          strokeWidth="2.5"
        />

        {/* Inner Lock Node */}
        <path
          d="M 80 82 V 74 C 80 68 84 64 90 64 C 96 64 100 68 100 74 V 82"
          stroke="#00D6B2"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="76" y="82" width="28" height="24" rx="6" fill="#07152B" stroke="#00D6B2" strokeWidth="2" />
        <circle cx="90" cy="93" r="2.5" fill="#00D9FF" />

        {/* Orbit Nodes */}
        <circle cx="140" cy="65" r="3.5" fill="#00D9FF" />
        <circle cx="44" cy="115" r="3" fill="#00D6B2" />
      </svg>
    </div>
  )
}
