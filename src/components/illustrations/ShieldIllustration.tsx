import React from 'react'

export const ShieldIllustration: React.FC<{ className?: string }> = ({
  className = 'w-64 h-64 sm:w-80 sm:h-80',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Soft Ambient Radial Background Halo (Natural warm ivory / soft coastal, NO harsh neon) */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#A6C5C1]/30 via-[#159FB5]/15 to-[#D7C4A8]/25 blur-2xl transform scale-95 pointer-events-none" />

      {/* Main Illustration SVG */}
      <svg
        viewBox="0 0 320 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_12px_28px_rgba(22,78,90,0.15)] transition-transform duration-500 hover:scale-[1.02]"
      >
        <defs>
          {/* Natural Shield Gradients */}
          <linearGradient id="shieldOuterGrad" x1="60" y1="40" x2="260" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E6777" />
            <stop offset="100%" stopColor="#164E5A" />
          </linearGradient>

          <linearGradient id="shieldInnerGrad" x1="90" y1="70" x2="230" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#159FB5" />
            <stop offset="100%" stopColor="#117B8C" />
          </linearGradient>

          <linearGradient id="lockGrad" x1="120" y1="120" x2="200" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F8F5EE" />
            <stop offset="100%" stopColor="#E5DFD3" />
          </linearGradient>

          <linearGradient id="leafGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A6C5C1" />
            <stop offset="100%" stopColor="#7EAAA4" />
          </linearGradient>

          <linearGradient id="sandGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E6D7C2" />
            <stop offset="100%" stopColor="#D7C4A8" />
          </linearGradient>
        </defs>

        {/* Decorative Natural Leaves / Foliage Accents */}
        <g opacity="0.85">
          {/* Top-right organic leaf */}
          <path
            d="M 235 60 C 265 45 285 70 270 95 C 255 120 220 90 235 60 Z"
            fill="url(#leafGrad1)"
          />
          <path d="M 240 68 Q 255 85 260 100" stroke="#164E5A" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />

          {/* Bottom-left natural leaf */}
          <path
            d="M 85 240 C 55 255 45 225 65 200 C 85 175 110 215 85 240 Z"
            fill="url(#sandGlow)"
          />
          <path d="M 80 230 Q 70 215 65 205" stroke="#164E5A" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />

          {/* Small orbital dots / seed nodes */}
          <circle cx="265" cy="140" r="4.5" fill="#35C6D9" opacity="0.75" />
          <circle cx="55" cy="125" r="3.5" fill="#D7C4A8" opacity="0.8" />
          <circle cx="240" cy="225" r="3" fill="#A6C5C1" opacity="0.7" />
        </g>

        {/* Outer Shield Shell */}
        <path
          d="M 160 45 C 220 45 245 70 245 130 C 245 205 185 255 160 270 C 135 255 75 205 75 130 C 75 70 100 45 160 45 Z"
          fill="url(#shieldOuterGrad)"
          stroke="#35C6D9"
          strokeWidth="2.5"
          strokeOpacity="0.4"
        />

        {/* Inner Shield Cavity */}
        <path
          d="M 160 62 C 208 62 228 82 228 132 C 228 194 180 236 160 249 C 140 236 92 194 92 132 C 92 82 112 62 160 62 Z"
          fill="url(#shieldInnerGrad)"
          opacity="0.95"
        />

        {/* Subtle Inner Contour Highlight */}
        <path
          d="M 160 72 C 196 72 212 88 212 132 C 212 182 174 218 160 230 C 146 218 108 182 108 132 C 108 88 124 72 160 72 Z"
          stroke="#F8F5EE"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeOpacity="0.35"
          fill="none"
        />

        {/* Lock Shackle */}
        <path
          d="M 136 142 V 126 C 136 112 146 102 160 102 C 174 102 184 112 184 126 V 142"
          stroke="#F8F5EE"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />

        {/* Lock Body */}
        <rect
          x="126"
          y="138"
          width="68"
          height="54"
          rx="12"
          fill="url(#lockGrad)"
          stroke="#164E5A"
          strokeWidth="2"
        />

        {/* Keyhole and AI Accent */}
        <circle cx="160" cy="160" r="5.5" fill="#164E5A" />
        <path d="M 157.5 163 L 156 176 H 164 L 162.5 163 Z" fill="#164E5A" />
        <circle cx="160" cy="160" r="2" fill="#35C6D9" />

        {/* Bottom Safety Checkmark Floating Emblem */}
        <g transform="translate(142, 204)">
          <circle cx="18" cy="18" r="16" fill="#164E5A" stroke="#35C6D9" strokeWidth="2" />
          <path
            d="M 11 18 L 16 23 L 26 13"
            stroke="#35C6D9"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  )
}
