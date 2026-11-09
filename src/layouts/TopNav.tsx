import React, { useState } from 'react'
import {
  Bell,
  Menu,
  Search,
  X,
} from 'lucide-react'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useNavigation } from '@/context/NavigationContext'

export const TopNav: React.FC = () => {
  const { searchQuery, setSearchQuery, setMobileMenuOpen, setCurrentPage } = useNavigation()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const sampleNotifications = [
    {
      id: 1,
      title: 'Local Privacy Shield active',
      desc: 'All 4 heuristic patterns verified on-device.',
      time: 'Just now',
      unread: true,
    },
    {
      id: 2,
      title: 'Sample threat scan blocked',
      desc: 'Credential harvesting SMS quarantined.',
      time: '15m ago',
      unread: true,
    },
  ]

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setCurrentPage('history')
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-card)] px-4 sm:px-6 flex items-center justify-between transition-colors duration-250">
      {/* Left: Mobile hamburger & search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-lg">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-xl text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search messages, threats, or history..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-input)] border border-[var(--border-card)] text-[var(--text-main)] placeholder-[var(--text-muted)]/70 focus:outline-none focus:ring-2 focus:ring-[#159FB5]/40 focus:border-[#159FB5] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Right: Theme Switcher, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 pl-3">
        {/* Compact Theme Switcher */}
        <ThemeToggle compact />

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen)
              setProfileOpen(false)
            }}
            className="relative p-2 rounded-xl text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E07A5F] ring-2 ring-[var(--bg-main)]" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-card)] shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-card)] px-2">
                <span className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
                  Security Alerts
                </span>
                <span className="text-[10px] text-[var(--text-accent)] font-semibold">2 new</span>
              </div>
              <div className="space-y-1.5">
                {sampleNotifications.map(n => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-left"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-heading)] mb-0.5">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen)
              setNotificationsOpen(false)
            }}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[#159FB5]/50 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#164E5A] text-[#35C6D9] flex items-center justify-center font-bold text-xs">
              CS
            </div>
            <div className="hidden md:block text-left pr-1">
              <p className="text-xs font-bold text-[var(--text-heading)] leading-none">
                Hackathon Solo
              </p>
              <p className="text-[10px] text-[#2E8B57] font-medium leading-none mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E8B57]" />
                Security Guard
              </p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-card)] shadow-xl p-3 z-50">
              <div className="p-2 border-b border-[var(--border-card)] mb-2">
                <p className="text-xs font-bold text-[var(--text-heading)]">Solo Engineer</p>
                <p className="text-[11px] text-[var(--text-muted)]">contextshield-solo@local.dev</p>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setCurrentPage('settings')
                    setProfileOpen(false)
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-main)] hover:bg-[#159FB5]/10 transition-colors cursor-pointer"
                >
                  Preferences & Thresholds
                </button>
                <button
                  onClick={() => {
                    setCurrentPage('privacy')
                    setProfileOpen(false)
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-main)] hover:bg-[#159FB5]/10 transition-colors cursor-pointer"
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
