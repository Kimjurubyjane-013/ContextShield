import React from 'react'
import {
  FlaskConical,
  History as HistoryIcon,
  LayoutDashboard,
  Lock,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { ContextShieldLogo } from '@/components/common/ContextShieldLogo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useNavigation } from '@/context/NavigationContext'
import type { PageId } from '@/types'

interface NavItem {
  id: PageId
  label: string
  icon: React.FC<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scanner', label: 'Message Scanner', icon: MessageSquareWarning },
  { id: 'privacy', label: 'Privacy Center', icon: Lock },
  { id: 'history', label: 'History', icon: HistoryIcon },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export const Sidebar: React.FC<{ onCloseMobile?: () => void }> = ({ onCloseMobile }) => {
  const { currentPage, setCurrentPage } = useNavigation()

  const handleNavClick = (id: PageId) => {
    setCurrentPage(id)
    if (onCloseMobile) onCloseMobile()
  }

  return (
    <aside className="w-64 h-full bg-[var(--bg-sidebar)] border-r border-[#134857]/80 text-[#EAF4F8] flex flex-col justify-between shrink-0 select-none overflow-y-auto transition-colors duration-200">
      {/* Top Branding & Main Nav */}
      <div className="p-5">
        {/* Brand Logo & Title */}
        <button
          type="button"
          onClick={() => handleNavClick('dashboard')}
          className="w-full text-left flex items-center gap-3 px-2 py-2 mb-6 rounded-xl cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60"
        >
          <ContextShieldLogo
            size="md"
            showWordmark
            subtitle="Defense Center"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </button>

        {/* Navigation Section */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = currentPage === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNavClick(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full min-h-[42px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60 ${
                  isActive
                    ? 'bg-[#0D5663] text-[#EAF4F8] border border-[#22D3EE]/45 font-semibold'
                    : 'text-[#8EB2C2] hover:text-[#EAF4F8] hover:bg-[#0B2735] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#22D3EE]' : 'text-[#8EB2C2] group-hover:text-[#EAF4F8]'
                    }`}
                  />
                  <span>{label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                )}
              </button>
            )
          })}

          {/* DEV-Only Hybrid AI Test Bench Shortcut */}
          {import.meta.env.DEV && (
            <div className="pt-3 mt-3 border-t border-[#134857]/70">
              <span className="text-[10px] font-bold text-[#8EB2C2]/70 uppercase tracking-wider block px-2 mb-1.5">
                Developer Bench
              </span>
              <button
                type="button"
                onClick={() => handleNavClick('hybrid-test')}
                className={`w-full min-h-[38px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60 ${
                  currentPage === 'hybrid-test'
                    ? 'bg-[#22D3EE] text-[#071827] font-bold shadow-sm'
                    : 'text-[#22D3EE] hover:bg-[#0B2735] border border-[#22D3EE]/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Hybrid AI Test</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/30 text-white font-mono">
                  DEV
                </span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Section: Privacy Card, Theme Control */}
      <div className="p-5 space-y-4">
        {/* Privacy Protection Status Card */}
        <button
          type="button"
          onClick={() => handleNavClick('privacy')}
          className="w-full text-left p-3.5 rounded-2xl bg-[#0B2735] border border-[#134857] hover:border-[#22D3EE]/50 transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60"
        >
          <div className="flex items-center gap-2 mb-2 text-[#22D3EE]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#EAF4F8]">
              Zero-Leakage Privacy
            </span>
          </div>
          <p className="text-[11px] text-[#8EB2C2] leading-relaxed mb-2.5">
            PII is masked locally in browser memory before any external AI inspection.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#22D3EE] group-hover:underline">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>Inspect Privacy Rules</span>
          </div>
        </button>

        {/* Theme Toggle */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[#8EB2C2] uppercase tracking-wider pl-1 block">
            Display Mode
          </span>
          <ThemeToggle />
        </div>

        {/* Honest Local Protection Status */}
        <div className="pt-2.5 border-t border-[#134857]/70 flex items-center justify-between text-[11px] text-[#8EB2C2]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" aria-hidden="true" />
            Local Shield Active
          </span>
          <span className="text-[10px] font-mono opacity-80">Zero Net</span>
        </div>
      </div>
    </aside>
  )
}
