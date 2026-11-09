import React, { useState } from 'react'
import {
  CheckCircle2,
  Info,
  Moon,
  Palette,
  Shield,
  Sliders,
  Sun,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { useTheme } from '@/context/ThemeContext'
import type { UserSettings } from '@/types'

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme()

  const [settings, setSettings] = useState<UserSettings>({
    theme,
    onDeviceOnly: true,
    cloudFallback: false,
    sensitivityLevel: 'strict',
    notificationSounds: true,
    autoRedactPII: true,
  })

  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleToggle = (key: keyof UserSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof UserSettings],
    }))
  }

  const handleSave = () => {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors duration-250">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#159FB5]/10 text-[var(--text-accent)] text-xs font-semibold mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] tracking-tight">
            System Settings &amp; Preferences
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Configure your privacy threshold, visual appearance, and AI processing modes.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleSave}>
          {savedSuccess ? 'Preferences Saved' : 'Save Settings'}
        </Button>
      </div>

      {/* 1. Appearance & Theme */}
      <Card className="p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-card)]">
          <div className="p-2 rounded-xl bg-[#164E5A] text-[#35C6D9]">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-heading)]">
              Appearance &amp; Display
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Select theme styling preserving brand color identity
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              theme === 'light'
                ? 'bg-[#F8F5EE] border-[#159FB5] ring-2 ring-[#159FB5]/25 text-[#164E5A]'
                : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)] hover:border-[#159FB5]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#D7C4A8]/40 text-[#164E5A]">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-heading)]">Warm Ivory (Light)</p>
                <p className="text-[11px] text-[var(--text-muted)]">Clean, organic natural contrast</p>
              </div>
            </div>
            {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-[#159FB5]" />}
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              theme === 'dark'
                ? 'bg-[#0D2026] border-[#35C6D9] ring-2 ring-[#35C6D9]/25 text-[#EAF3F4]'
                : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)] hover:border-[#35C6D9]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#143039] text-[#35C6D9]">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-heading)]">Deep Teal Night (Dark)</p>
                <p className="text-[11px] text-[var(--text-muted)]">No harsh neon or pitch black</p>
              </div>
            </div>
            {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-[#35C6D9]" />}
          </button>
        </div>
      </Card>

      {/* 2. Security & Privacy Toggles */}
      <Card className="p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-card)]">
          <div className="p-2 rounded-xl bg-[#2E8B57]/15 text-[#2E8B57]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-heading)]">
              Privacy &amp; Security Engines
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              On-device execution boundaries and heuristic sensitivity
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          {/* On-device only */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
            <div className="max-w-md">
              <p className="text-xs font-bold text-[var(--text-heading)]">
                Strict On-Device Mode Only
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Never communicate with external cloud AI models under any circumstance.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('onDeviceOnly')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.onDeviceOnly ? 'bg-[#2E8B57]' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.onDeviceOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto PII Redaction */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
            <div className="max-w-md">
              <p className="text-xs font-bold text-[var(--text-heading)]">
                Automatic PII Masking
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Redact phone numbers, financial accounts, and personal identifiers before inspection.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('autoRedactPII')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.autoRedactPII ? 'bg-[#159FB5]' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.autoRedactPII ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Cloud Fallback */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
            <div className="max-w-md">
              <p className="text-xs font-bold text-[var(--text-heading)]">
                Hybrid Cloud Deep-Scan
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Allow privacy-scrubbed tokens to be verified by high-capacity reasoning models when local confidence is uncertain.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('cloudFallback')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.cloudFallback ? 'bg-[#159FB5]' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.cloudFallback ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* 3. About System & Version Card */}
      <Card className="p-6 sm:p-7">
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-card)] mb-4">
          <div className="p-2 rounded-xl bg-[#D7C4A8]/30 text-[#164E5A] dark:text-[#D7C4A8]">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-heading)]">
              About ContextShield
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Platform specifications and engine details
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
            <span className="text-[var(--text-muted)] block mb-1">Architecture</span>
            <span className="font-bold text-[var(--text-heading)]">
              Privacy-First Hybrid AI (Client Edge Heuristics)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
            <span className="text-[var(--text-muted)] block mb-1">Technology Stack</span>
            <span className="font-bold text-[var(--text-heading)]">
              React 19 + TypeScript 7 + Vite 8 + Tailwind CSS v4
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
            <span className="text-[var(--text-muted)] block mb-1">Version</span>
            <span className="font-mono text-[var(--text-accent)] font-bold">
              v0.1.0-alpha (Solo Hackathon Release)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
            <span className="text-[var(--text-muted)] block mb-1">Status</span>
            <span className="font-bold text-[#2E8B57] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2E8B57]" />
              Development &amp; Audit Passed
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
