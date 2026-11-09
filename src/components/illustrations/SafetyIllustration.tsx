import React from 'react'

export const SafetyIllustration: React.FC<{ className?: string }> = ({
  className = 'w-36 h-36 sm:w-44 sm:h-44',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Soft Background Warm Halo */}
        <circle cx="90" cy="90" r="75" fill="#A6C5C1" fillOpacity="0.18" />
        <circle cx="90" cy="90" r="58" fill="#F8F5EE" fillOpacity="0.85" />

        {/* Natural Leaves */}
        <path d="M 40 70 C 32 55 48 42 62 48 C 66 62 52 75 40 70 Z" fill="#A6C5C1" opacity="0.8" />
        <path d="M 140 115 C 148 130 132 142 118 138 C 114 124 128 110 140 115 Z" fill="#D7C4A8" opacity="0.85" />

        {/* Smartphone Device Outline with Deep Teal */}
        <rect x="62" y="38" width="56" height="104" rx="12" fill="#164E5A" stroke="#35C6D9" strokeWidth="2" />
        {/* Screen Area */}
        <rect x="68" y="48" width="44" height="76" rx="6" fill="#F8F5EE" />

        {/* Shield icon on phone screen */}
        <path
          d="M 90 60 C 100 60 104 64 104 74 C 104 88 94 96 90 99 C 86 96 76 88 76 74 C 76 64 80 60 90 60 Z"
          fill="#159FB5"
        />
        <circle cx="90" cy="77" r="4" fill="#F8F5EE" />
        <path d="M 88 80 L 87 87 H 93 L 92 80 Z" fill="#F8F5EE" />

        {/* Floating Sparkle / AI Node */}
        <circle cx="128" cy="62" r="3.5" fill="#35C6D9" />
        <circle cx="48" cy="112" r="3" fill="#159FB5" />
      </svg>
    </div>
  )
}
