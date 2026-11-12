import React, { useEffect, useState } from 'react'
import { Bell, Menu, Search, ShieldCheck, X } from 'lucide-react'
import { ContextShieldLogo } from '@/components/common/ContextShieldLogo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useNavigation } from '@/context/NavigationContext'
import { useSecurity } from '@/context/SecurityContext'

export const TopNav: React.FC = () => {
  const { searchQuery, setSearchQuery, setMobileMenuOpen, setCurrentPage } = useNavigation()
  const { scans, stats } = useSecurity()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotificationsOpen(false)
        setProfileOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const recentThreatScans = scans.filter(s => s.status !== 'safe').slice(0, 3)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setCurrentPage('history')
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-card)] px-4 sm:px-6 flex items-center justify-between transition-colors duration-200">
      {/* Left: Mobile hamburger & search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-lg">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-xl text-[var(--text-main)] hover:bg-[#0D5663]/15 dark:hover:bg-[#0D5663]/35 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentPage('dashboard')}
          className="lg:hidden shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60 rounded-lg"
          aria-label="ContextShield Dashboard"
        >
          <ContextShieldLogo size="sm" />
        </button>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search messages, indicators, or scan history..."
            aria-label="Search scan history"
            className="w-full min-h-[38px] pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-input)] border border-[var(--border-card)] text-[var(--text-main)] placeholder-[var(--text-muted)]/75 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/45 focus:border-[#22D3EE] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Right: Theme Switcher, Security Alerts, Session Badge */}
      <div className="flex items-center gap-2 sm:gap-3 pl-3">
        <ThemeToggle compact />

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(prev => !prev)
              setProfileOpen(false)
            }}
            aria-expanded={notificationsOpen}
            aria-haspopup="menu"
            className="relative min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-xl text-[var(--text-main)] hover:bg-[#0D5663]/15 dark:hover:bg-[#0D5663]/35 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60"
            aria-label="Security Alerts"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {recentThreatScans.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-[var(--bg-main)]" />
            )}
          </button>

          {notificationsOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-72 sm:w-80 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-card)] shadow-2xl p-3 z-50"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-card)] px-2">
                <span className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
                  Security Telemetry
                </span>
                <span className="text-[10px] text-[var(--text-accent)] font-semibold">
                  {recentThreatScans.length > 0
                    ? `${recentThreatScans.length} flagged`
                    : `${stats.totalScans} scans`}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)] text-left">
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-heading)] mb-0.5">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                      Local PII Redaction Active
                    </span>
                    <span className="text-[10px] text-[#22C55E] font-semibold">On-Device</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Sensitive identifiers are masked in memory prior to inference.
                  </p>
                </div>

                {recentThreatScans.map(scan => (
                  <button
                    key={scan.id}
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false)
                      setCurrentPage('history')
                    }}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] hover:border-[#22D3EE]/40 border border-[var(--border-card)] text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-heading)] mb-0.5">
                      <span className="truncate pr-2">
                        {scan.status === 'threat' ? 'High Risk Scan' : 'Suspicious Scan'} ·{' '}
                        {scan.threatScore}/100
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                        {scan.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                      {scan.summary}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Session & Privacy Vault Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen(prev => !prev)
              setNotificationsOpen(false)
            }}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="min-h-[36px] flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[#22D3EE]/50 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60"
          >
            <div className="w-7 h-7 rounded-lg bg-[#0D5663] text-[#22D3EE] flex items-center justify-center font-bold text-xs border border-[#22D3EE]/30">
              CS
            </div>
            <div className="hidden md:block text-left pr-1">
              <p className="text-xs font-bold text-[var(--text-heading)] leading-none">
                Local Vault
              </p>
              <p className="text-[10px] text-[#22C55E] font-medium leading-none mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                Shield Ready
              </p>
            </div>
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-card)] shadow-2xl p-3 z-50"
            >
              <div className="p-2 border-b border-[var(--border-card)] mb-2">
                <p className="text-xs font-bold text-[var(--text-heading)]">Browser Defense Vault</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Client-side only · Consent required for cloud
                </p>
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage('settings')
                    setProfileOpen(false)
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-[var(--text-main)] hover:bg-[#0D5663]/15 dark:hover:bg-[#0D5663]/35 transition-colors cursor-pointer"
                >
                  Preferences &amp; Thresholds
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage('privacy')
                    setProfileOpen(false)
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-[var(--text-main)] hover:bg-[#0D5663]/15 dark:hover:bg-[#0D5663]/35 transition-colors cursor-pointer"
                >
                  Privacy Vault Status
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
