import React from 'react'

export const EmptyIllustration: React.FC<{ className?: string }> = ({
  className = 'w-32 h-32',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#087BFF]/15 to-[#00D9FF]/20 blur-xl pointer-events-none"
        aria-hidden="true"
      />
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10">
        <circle cx="60" cy="60" r="48" stroke="#087BFF" strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />
        <circle cx="60" cy="60" r="36" fill="var(--bg-card)" stroke="#00D9FF" strokeWidth="1.5" strokeOpacity="0.5" />
        <path
          d="M 60 40 C 70 40 76 44 76 54 C 76 66 66 73 60 76 C 54 73 44 66 44 54 C 44 44 50 40 60 40 Z"
          fill="#087BFF"
          fillOpacity="0.15"
          stroke="#00D9FF"
          strokeWidth="1.5"
        />
        <circle cx="60" cy="56" r="3.5" fill="#00D9FF" />
        <path d="M 50 86 Q 60 90 70 86" stroke="#00D6B2" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}
