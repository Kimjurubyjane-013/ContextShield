import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[#087BFF]/10 text-[var(--text-main)] border border-[var(--border-card)] hover:border-[#00D9FF]/50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60"
        aria-label={isDark ? 'Dark Mode active. Switch to Light Mode' : 'Light Mode active. Switch to Dark Mode'}
        title={isDark ? 'Dark Mode active (Click for Light Mode)' : 'Light Mode active (Click for Dark Mode)'}
      >
        {isDark ? (
          <>
            <Moon className="w-4 h-4 text-[#00D9FF]" />
            <span className="hidden sm:inline text-xs font-semibold text-white">Dark</span>
          </>
        ) : (
          <>
            <Sun className="w-4 h-4 text-[#087BFF]" />
            <span className="hidden sm:inline text-xs font-semibold text-[#12213A]">Light</span>
          </>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-full min-h-[42px] flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-card-subtle)] hover:bg-[#087BFF]/10 border border-[var(--border-card)] text-[var(--text-main)] text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60"
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <span className="flex items-center gap-2.5 pl-1">
        {isDark ? (
          <Moon className="w-4 h-4 text-[#00D9FF]" />
        ) : (
          <Sun className="w-4 h-4 text-[#F59E0B]" />
        )}
        <span className="font-semibold">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
      </span>
      <span
        className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border border-transparent transition-colors duration-200 ease-in-out ${
          isDark ? 'bg-[#087BFF] border-[#00D9FF]/40' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-sm ring-0 transition duration-200 ease-in-out ${
            isDark ? 'translate-x-5 bg-white shadow-[0_0_8px_#00D9FF]' : 'translate-x-0.5 bg-white'
          }`}
        />
      </span>
    </button>
  )
}
