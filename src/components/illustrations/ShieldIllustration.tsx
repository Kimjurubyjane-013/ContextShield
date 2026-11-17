import React from 'react'

export const ShieldIllustration: React.FC<{ className?: string }> = ({
  className = 'w-72 h-72 sm:w-88 sm:h-88 lg:w-96 lg:h-96',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Ambient Radial Cybernetic Glow Background */}
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#087BFF]/20 via-[#00D9FF]/25 to-[#7957FF]/15 blur-3xl transform scale-110 pointer-events-none"
        aria-hidden="true"
      />

      <svg
        viewBox="0 0 420 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_16px_36px_rgba(0,217,255,0.22)] transition-transform duration-700 hover:scale-[1.02]"
        aria-label="3D Holographic Cyber Defense Shield"
      >
        <defs>
          {/* Neon Gradients */}
          <linearGradient id="shield3dBevel" x1="130" y1="50" x2="290" y2="290" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00D9FF" />
            <stop offset="35%" stopColor="#087BFF" />
            <stop offset="70%" stopColor="#102448" />
            <stop offset="100%" stopColor="#00D6B2" />
          </linearGradient>

          <linearGradient id="shield3dFace" x1="140" y1="65" x2="280" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0D2E5C" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#07152B" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#051020" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="shield3dInnerGlow" x1="160" y1="80" x2="260" y2="260" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#087BFF" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="checkGlow" x1="170" y1="150" x2="250" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#00D9FF" />
            <stop offset="100%" stopColor="#00D6B2" />
          </linearGradient>

          <linearGradient id="pedestalGrad" x1="60" y1="320" x2="360" y2="380" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#087BFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#00D9FF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7957FF" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="discSurface" x1="80" y1="310" x2="340" y2="350" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0C2347" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#081830" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#07152B" stopOpacity="0.9" />
          </linearGradient>

          <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="12" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* 1. Holographic Floor Perspective Grid & Circular Waves */}
        <g opacity="0.6">
          <ellipse cx="210" cy="345" rx="160" ry="42" stroke="#087BFF" strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />
          <ellipse cx="210" cy="345" rx="135" ry="35" stroke="#00D9FF" strokeWidth="1.2" opacity="0.5" />
          <ellipse cx="210" cy="345" rx="110" ry="28" stroke="#00D6B2" strokeWidth="1.5" opacity="0.6" />

          {/* Perspective Radial Ray Accents */}
          <line x1="70" y1="345" x2="130" y2="345" stroke="#00D9FF" strokeWidth="1" opacity="0.4" />
          <line x1="290" y1="345" x2="350" y2="345" stroke="#00D9FF" strokeWidth="1" opacity="0.4" />
          <line x1="120" y1="325" x2="160" y2="335" stroke="#00D9FF" strokeWidth="1" opacity="0.3" />
          <line x1="300" y1="325" x2="260" y2="335" stroke="#00D9FF" strokeWidth="1" opacity="0.3" />
          <line x1="120" y1="365" x2="160" y2="355" stroke="#00D9FF" strokeWidth="1" opacity="0.3" />
          <line x1="300" y1="365" x2="260" y2="355" stroke="#00D9FF" strokeWidth="1" opacity="0.3" />
        </g>

        {/* 2. Multi-Stepped Cylindrical Platform / Pedestal */}
        {/* Base Cylinder Layer 1 */}
        <g filter="url(#neonBlur)">
          <ellipse cx="210" cy="355" rx="100" ry="24" fill="#030B1B" stroke="#087BFF" strokeWidth="2" opacity="0.7" />
          <path d="M 110 345 C 110 357 155 367 210 367 C 265 367 310 357 310 345 L 310 354 C 310 366 265 376 210 376 C 155 376 110 366 110 354 Z" fill="url(#pedestalGrad)" opacity="0.75" />
        </g>

        {/* Top Pedestal Disc Surface */}
        <ellipse cx="210" cy="340" rx="92" ry="22" fill="url(#discSurface)" stroke="#00D9FF" strokeWidth="2.5" />
        <ellipse cx="210" cy="340" rx="80" ry="18" stroke="#00D9FF" strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
        <ellipse cx="210" cy="340" rx="60" ry="13" fill="#00D9FF" fillOpacity="0.18" />

        {/* 3. Floating 3D Holographic Wireframe Cubes */}
        {/* Left Floating Cube */}
        <g className="animate-cyber-float" style={{ animationDelay: '0s' }}>
          {/* Top Face */}
          <polygon points="75,210 95,200 115,210 95,220" fill="#0B274A" fillOpacity="0.7" stroke="#00D9FF" strokeWidth="1.4" />
          {/* Left Face */}
          <polygon points="75,210 95,220 95,245 75,235" fill="#071830" fillOpacity="0.8" stroke="#087BFF" strokeWidth="1.4" />
          {/* Right Face */}
          <polygon points="95,220 115,210 115,235 95,245" fill="#0D3563" fillOpacity="0.8" stroke="#00D9FF" strokeWidth="1.4" />
          {/* Vertices */}
          <circle cx="95" cy="220" r="2" fill="#00D9FF" />
          <circle cx="75" cy="210" r="1.5" fill="#00D9FF" />
          <circle cx="115" cy="210" r="1.5" fill="#00D9FF" />
        </g>

        {/* Right Floating Cube */}
        <g className="animate-cyber-float" style={{ animationDelay: '1.5s' }}>
          {/* Top Face */}
          <polygon points="315,190 335,180 355,190 335,200" fill="#0B274A" fillOpacity="0.7" stroke="#00D9FF" strokeWidth="1.4" />
          {/* Left Face */}
          <polygon points="315,190 335,200 335,225 315,215" fill="#071830" fillOpacity="0.8" stroke="#087BFF" strokeWidth="1.4" />
          {/* Right Face */}
          <polygon points="335,200 355,190 355,215 335,225" fill="#0D3563" fillOpacity="0.8" stroke="#00D9FF" strokeWidth="1.4" />
          {/* Vertices */}
          <circle cx="335" cy="200" r="2" fill="#00D9FF" />
          <circle cx="315" cy="190" r="1.5" fill="#00D9FF" />
          <circle cx="355" cy="190" r="1.5" fill="#00D9FF" />
        </g>

        {/* Mini Ambient Cube Top-Left */}
        <g className="animate-cyber-float" style={{ animationDelay: '3s' }} opacity="0.6">
          <polygon points="120,120 132,114 144,120 132,126" fill="#0B274A" stroke="#00D9FF" strokeWidth="1" />
          <polygon points="120,120 132,126 132,140 120,134" fill="#071830" stroke="#087BFF" strokeWidth="1" />
          <polygon points="132,126 144,120 144,134 132,140" fill="#0D3563" stroke="#00D9FF" strokeWidth="1" />
        </g>

        {/* 4. Glowing 3D Shield (Centerpiece) */}
        <g className="animate-cyber-float" style={{ animationDelay: '0.5s' }}>
          {/* Outer Shield Neon Glow Filter */}
          <path
            d="M 210 65 C 275 65 305 92 305 160 C 305 240 240 292 210 310 C 180 292 115 240 115 160 C 115 92 145 65 210 65 Z"
            fill="none"
            stroke="#00D9FF"
            strokeWidth="8"
            opacity="0.35"
            filter="url(#neonBlur)"
          />

          {/* Outer 3D Beveled Rim */}
          <path
            d="M 210 70 C 270 70 298 96 298 160 C 298 235 236 284 210 302 C 184 284 122 235 122 160 C 122 96 150 70 210 70 Z"
            fill="url(#shield3dFace)"
            stroke="url(#shield3dBevel)"
            strokeWidth="5"
          />

          {/* Inner Recessed Face with Cyan Highlight Border */}
          <path
            d="M 210 88 C 255 88 278 110 278 162 C 278 222 230 262 210 276 C 190 262 142 222 142 162 C 142 110 165 88 210 88 Z"
            fill="url(#shield3dFace)"
            stroke="url(#shield3dInnerGlow)"
            strokeWidth="2.5"
          />

          {/* Subtle Cyber Grid Lines on Shield Face */}
          <g opacity="0.2">
            <line x1="160" y1="160" x2="260" y2="160" stroke="#00D9FF" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="175" y1="200" x2="245" y2="200" stroke="#00D9FF" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="210" y1="100" x2="210" y2="260" stroke="#00D9FF" strokeWidth="1" strokeDasharray="4 4" />
          </g>

          {/* Central 3D Glowing Checkmark */}
          <path
            d="M 180 182 L 202 205 L 246 155"
            stroke="url(#checkGlow)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#softGlow)"
          />
          <path
            d="M 180 182 L 202 205 L 246 155"
            stroke="#FFFFFF"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* 5. Particle Nodes & Energy Sparks */}
        <circle cx="210" cy="50" r="3" fill="#00D9FF" filter="url(#neonBlur)" />
        <circle cx="150" cy="90" r="2" fill="#00D6B2" />
        <circle cx="270" cy="85" r="2.5" fill="#087BFF" />
        <circle cx="100" cy="270" r="2" fill="#00D9FF" />
        <circle cx="320" cy="265" r="2.5" fill="#00D6B2" />
        <circle cx="210" cy="380" r="2" fill="#7957FF" />
      </svg>
    </div>
  )
}
