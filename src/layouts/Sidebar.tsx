import React from 'react'
import {
  FileText,
  FlaskConical,
  HelpCircle,
  LayoutDashboard,
  Search,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { ContextShieldLogo } from '@/components/common/ContextShieldLogo'
import { useNavigation } from '@/context/NavigationContext'
import type { PageId } from '@/types'

interface NavItem {
  id: PageId
  label: string
  icon: React.FC<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scanner', label: 'New Analysis', icon: Search },
  { id: 'history', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'privacy', label: 'Help & Support', icon: HelpCircle },
]

export const Sidebar: React.FC<{ onCloseMobile?: () => void }> = ({ onCloseMobile }) => {
  const { currentPage, setCurrentPage } = useNavigation()

  const handleNavClick = (id: PageId) => {
    setCurrentPage(id)
    if (onCloseMobile) onCloseMobile()
  }

  return (
    <aside className="w-[262px] h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-card)] text-[var(--text-main)] flex flex-col justify-between shrink-0 select-none overflow-y-auto transition-colors duration-250">
      {/* Top Branding & Main Navigation */}
      <div className="p-5">
        {/* Brand Logo & Tagline */}
        <button
          type="button"
          onClick={() => handleNavClick('dashboard')}
          className="w-full text-left flex items-center px-1 py-1 mb-8 rounded-xl cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60"
        >
          <ContextShieldLogo
            size="md"
            showWordmark
            subtitle="Analyze • Verify • Stay Safe"
            className="transition-transform group-hover:scale-[1.02]"
          />
        </button>

        {/* Navigation Section */}
        <nav className="space-y-2" aria-label="Main Navigation">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive =
              currentPage === id ||
              (id === 'scanner' && currentPage === 'scanner') ||
              (id === 'history' && currentPage === 'history') ||
              (id === 'privacy' && currentPage === 'privacy')

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNavClick(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full min-h-[46px] flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#087BFF] to-[#087BFF]/35 text-white font-semibold shadow-[0_4px_18px_rgba(8,123,255,0.35)] border border-[#00D9FF]/40'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[#087BFF]/10 dark:hover:bg-[#07152B] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-[#00D9FF]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-heading)]'
                    }`}
                  />
                  <span>{label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shadow-[0_0_8px_#00D9FF]" />
                )}
              </button>
            )
          })}

          {/* DEV-Only Hybrid AI Test Bench Shortcut */}
          {import.meta.env.DEV && (
            <div className="pt-3 mt-3 border-t border-[var(--border-card)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block px-2 mb-1.5">
                Developer Bench
              </span>
              <button
                type="button"
                onClick={() => handleNavClick('hybrid-test')}
                className={`w-full min-h-[40px] flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60 ${
                  currentPage === 'hybrid-test'
                    ? 'bg-[#00D9FF] text-[#030B1B] font-bold shadow-sm'
                    : 'text-[#00D9FF] hover:bg-[#087BFF]/10 border border-[#00D9FF]/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" />
                  <span>Hybrid AI Test</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-white font-mono">
                  DEV
                </span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Section: Privacy Priority Card & Version */}
      <div className="p-4 space-y-4">
        {/* "Your Privacy Our Priority" Glowing Card */}
        <button
          type="button"
          onClick={() => handleNavClick('privacy')}
          className="w-full text-left relative overflow-hidden p-4 rounded-3xl bg-gradient-to-br from-[#0B2447] via-[#071830] to-[#040E20] border border-[#00D9FF]/30 shadow-[0_6px_24px_rgba(0,217,255,0.12)] cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60 transition-all hover:border-[#00D9FF]/60"
        >
          {/* Fluid Wave SVG Background Graphic */}
          <div className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity">
            <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path
                d="M -10 90 Q 50 30 110 80 T 220 50 L 220 130 L -10 130 Z"
                fill="url(#sidebarWaveGrad)"
              />
              <path
                d="M -10 70 Q 60 100 130 50 T 220 90"
                stroke="#00D9FF"
                strokeWidth="1.2"
                strokeDasharray="2 3"
                opacity="0.7"
              />
              <defs>
                <linearGradient id="sidebarWaveGrad" x1="0" y1="0" x2="200" y2="120" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#087BFF" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#00D6B2]/20 border border-[#00D6B2]/40 flex items-center justify-center text-[#00D6B2] shadow-[0_0_12px_rgba(0,214,178,0.3)]">
              <ShieldCheck className="w-4 h-4" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white tracking-tight leading-tight">
                Your Privacy Our Priority
              </h4>
              <p className="text-[11px] text-[#A7B8D4] leading-relaxed">
                On-device analysis keeps your data local.
              </p>
            </div>
          </div>
        </button>

        {/* Version Footer */}
        <div className="text-center">
          <p className="text-[11px] font-mono text-[var(--text-muted)] opacity-75">
            ContextShield v1.0.0
          </p>
        </div>
      </div>
    </aside>
  )
}
