import React from 'react'

export const EmptyIllustration: React.FC<{ className?: string }> = ({
  className = 'w-32 h-32',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="60" cy="60" r="48" fill="#A6C5C1" fillOpacity="0.15" />
        <circle cx="60" cy="60" r="34" fill="#F8F5EE" fillOpacity="0.8" />
        <path
          d="M 60 38 C 69 38 74 42 74 50 C 74 62 65 68 60 71 C 55 68 46 62 46 50 C 46 42 51 38 60 38 Z"
          fill="#164E5A"
          opacity="0.25"
        />
        <circle cx="60" cy="54" r="4" fill="#164E5A" opacity="0.4" />
        <path d="M 52 82 Q 60 86 68 82" stroke="#159FB5" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}
