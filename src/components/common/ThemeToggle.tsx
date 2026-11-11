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
        className="min-h-[36px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[#0D5663]/12 dark:hover:bg-[#0D5663]/35 text-[var(--text-main)] border border-[var(--border-card)] hover:border-[#22D3EE]/50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60"
        aria-label={isDark ? 'Dark Mode active. Switch to Light Mode' : 'Light Mode active. Switch to Dark Mode'}
        title={isDark ? 'Dark Mode active (Click for Light Mode)' : 'Light Mode active (Click for Dark Mode)'}
      >
        {isDark ? (
          <>
            <Moon className="w-4 h-4 text-[#22D3EE]" />
            <span className="hidden sm:inline text-xs font-semibold text-[#EAF4F8]">Dark</span>
          </>
        ) : (
          <>
            <Sun className="w-4 h-4 text-[#0D5663]" />
            <span className="hidden sm:inline text-xs font-semibold text-[#071827]">Light</span>
          </>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-full min-h-[40px] flex items-center justify-between p-2.5 rounded-xl bg-[#0B2735] hover:bg-[#0D3346] border border-[#134857] text-[#EAF4F8] text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60"
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <span className="flex items-center gap-2 pl-1">
        {isDark ? (
          <Moon className="w-4 h-4 text-[#22D3EE]" />
        ) : (
          <Sun className="w-4 h-4 text-[#F59E0B]" />
        )}
        <span className="font-semibold">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
      </span>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
          isDark ? 'bg-[#0D5663] border-[#22D3EE]/40' : 'bg-white/25'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#22D3EE] shadow-sm ring-0 transition duration-200 ease-in-out ${
            isDark ? 'translate-x-4' : 'translate-x-0 bg-white'
          }`}
        />
      </span>
    </button>
  )
}
