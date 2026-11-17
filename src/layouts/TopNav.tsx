import React, { useState } from 'react'
import { ChevronDown, Lock, Menu, Moon, Sun } from 'lucide-react'
import { ContextShieldLogo } from '@/components/common/ContextShieldLogo'
import { useNavigation } from '@/context/NavigationContext'
import { useTheme } from '@/context/ThemeContext'

export const TopNav: React.FC = () => {
  const { setMobileMenuOpen, setCurrentPage } = useNavigation()
  const { theme, toggleTheme } = useTheme()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-card)] px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors duration-250">
      {/* Left: Mobile menu trigger & "Secure & Private" Badge */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-xl text-[var(--text-main)] hover:bg-[#087BFF]/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentPage('dashboard')}
          className="lg:hidden shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60 rounded-lg"
          aria-label="ContextShield Dashboard"
        >
          <ContextShieldLogo size="sm" />
        </button>

        {/* Reference Screenshot Top-Left Pill: "Secure & Private" */}
        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#00D6B2]/10 border border-[#00D6B2]/30 text-[#00D6B2] text-xs font-semibold shadow-[0_0_12px_rgba(0,214,178,0.15)] shrink-0">
          <Lock className="w-3.5 h-3.5 text-[#00D6B2]" />
          <span className="hidden sm:inline">Secure &amp; Private</span>
          <span className="sm:hidden text-[10px]">Secure</span>
        </div>
      </div>

      {/* Right: Theme Switcher & User Avatar Pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 sm:p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-main)] hover:text-[#00D9FF] hover:border-[#00D9FF]/40 transition-all cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#FBBF24]" />
          ) : (
            <Moon className="w-4 h-4 text-[#087BFF]" />
          )}
        </button>

        {/* User Pill as shown in reference: circle with 'U', 'User', dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserDropdownOpen(prev => !prev)}
            aria-expanded={userDropdownOpen}
            className="flex items-center gap-2 pl-1 pr-2.5 sm:pl-1.5 sm:pr-3 py-1 sm:py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[#00D9FF]/40 transition-all cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-[#7957FF] to-[#087BFF] text-white flex items-center justify-center text-[11px] sm:text-xs font-bold shadow-sm">
              U
            </div>
            <span className="text-xs font-semibold text-[var(--text-main)] hidden xs:inline">User</span>
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--text-muted)]" />
          </button>

          {userDropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-card)] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="px-3 py-2 border-b border-[var(--border-card)] mb-1">
                <p className="text-xs font-bold text-[var(--text-heading)]">Local Security User</p>
                <p className="text-[10px] text-[var(--text-muted)]">Privacy Mode Active</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCurrentPage('privacy')
                  setUserDropdownOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl hover:bg-[#087BFF]/10 text-[var(--text-main)] transition-colors cursor-pointer"
              >
                Privacy Center
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentPage('settings')
                  setUserDropdownOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl hover:bg-[#087BFF]/10 text-[var(--text-main)] transition-colors cursor-pointer"
              >
                Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
