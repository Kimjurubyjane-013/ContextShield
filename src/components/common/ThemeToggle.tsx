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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[#159FB5]/10 text-[var(--text-main)] border border-[var(--border-card)] transition-colors cursor-pointer"
        aria-label={isDark ? 'Dark Mode active. Switch to Light Mode' : 'Light Mode active. Switch to Dark Mode'}
        title={isDark ? 'Dark Mode active (Click for Light Mode)' : 'Light Mode active (Click for Dark Mode)'}
      >
        {isDark ? (
          <>
            <Moon className="w-4 h-4 text-[#35C6D9]" />
            <span className="hidden sm:inline text-xs font-semibold text-[#EAF3F4]">Dark</span>
          </>
        ) : (
          <>
            <Sun className="w-4 h-4 text-[#159FB5]" />
            <span className="hidden sm:inline text-xs font-semibold text-[#164E5A]">Light</span>
          </>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-black/20 hover:bg-black/30 border border-[#A6C5C1]/30 text-white text-xs font-medium transition-colors cursor-pointer"
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <span className="flex items-center gap-2 pl-1">
        {isDark ? (
          <Moon className="w-4 h-4 text-[#35C6D9]" />
        ) : (
          <Sun className="w-4 h-4 text-[#D7C4A8]" />
        )}
        <span className="font-semibold">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
      </span>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
          isDark ? 'bg-[#159FB5]' : 'bg-white/25'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            isDark ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  )
}
