import React from 'react'
import {
  FlaskConical,
  History as HistoryIcon,
  LayoutDashboard,
  Lock,
  MessageSquareWarning,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
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
    <aside className="w-64 h-full bg-[var(--bg-sidebar)] border-r border-white/10 text-white flex flex-col justify-between shrink-0 select-none overflow-y-auto transition-colors duration-250">
      {/* Top Branding & Main Nav */}
      <div className="p-5">
        {/* Brand Logo & Title */}
        <div
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 px-2 py-2 mb-6 cursor-pointer group"
        >
          <div className="relative p-2 rounded-xl bg-white/10 border border-[#35C6D9]/40 text-[#35C6D9] shadow-sm transition-transform group-hover:scale-105">
            <Shield className="w-6 h-6 fill-[#159FB5]/30" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#35C6D9] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white">
                Context<span className="text-[#35C6D9]">Shield</span>
              </span>
            </div>
            <p className="text-[10px] text-[#A6C5C1] font-medium leading-tight tracking-wider uppercase">
              Hybrid AI Security
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = currentPage === id
            return (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#159FB5] text-white shadow-sm font-semibold'
                    : 'text-[#A6C5C1] hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-[#A6C5C1] group-hover:text-white'
                    }`}
                  />
                  <span>{label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                )}
              </button>
            )
          })}

          {/* DEV-Only Hybrid AI Test Bench Shortcut */}
          {import.meta.env.DEV && (
            <div className="pt-3 mt-3 border-t border-white/10">
              <span className="text-[10px] font-bold text-[#A6C5C1]/70 uppercase tracking-wider block px-2 mb-1.5">
                Developer Bench
              </span>
              <button
                onClick={() => handleNavClick('hybrid-test')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentPage === 'hybrid-test'
                    ? 'bg-[#35C6D9] text-[#164E5A] font-bold shadow-sm'
                    : 'text-[#35C6D9] hover:bg-white/10 border border-[#35C6D9]/30'
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
        {/* Privacy Promotional Card */}
        <div
          onClick={() => handleNavClick('privacy')}
          className="p-3.5 rounded-2xl bg-white/8 border border-[#A6C5C1]/30 hover:border-[#35C6D9]/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2 mb-2 text-[#35C6D9]">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-white">
              On-Device Privacy First
            </span>
          </div>
          <p className="text-[11px] text-[#A6C5C1] leading-relaxed mb-2.5">
            All sensitive PII is redacted locally on your device before any AI analysis occurs.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#35C6D9] group-hover:underline">
            <Sparkles className="w-3 h-3" />
            <span>Zero Cloud Leakage</span>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[#A6C5C1] uppercase tracking-wider pl-1">
            Theme
          </label>
          <ThemeToggle />
        </div>

        {/* Small Bottom Status */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#A6C5C1]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2E8B57]" />
            On-Device Engine
          </span>
          <span className="text-[10px] opacity-75">v0.1.0</span>
        </div>
      </div>
    </aside>
  )
}
