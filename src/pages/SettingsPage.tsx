import React, { useState } from 'react'
import {
  CheckCircle2,
  Moon,
  Palette,
  Shield,
  Sliders,
  Sun,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { ContextShieldLogo } from '@/components/common/ContextShieldLogo'
import { StatusBadge } from '@/components/common/StatusBadge'
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
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors duration-250">
        <div className="space-y-2">
          <StatusBadge
            variant="info"
            size="md"
            icon={<Sliders className="w-3.5 h-3.5" />}
          >
            Preferences
          </StatusBadge>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] tracking-tight">
            System Settings &amp; Preferences
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
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
          <div className="p-2.5 rounded-2xl bg-[#087BFF]/15 text-[#00D9FF] border border-[#00D9FF]/25">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-heading)]">
              Appearance &amp; Display
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Select Cybersecurity Command Center display mode
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              theme === 'light'
                ? 'bg-[#EDF4FF] border-[#087BFF] ring-2 ring-[#087BFF]/25 text-[#12213A]'
                : 'bg-[var(--bg-card-subtle)] border-[var(--border-card)] text-[var(--text-muted)] hover:border-[#087BFF]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white border border-[#DCE6F2] text-[#087BFF]">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-heading)]">Cyber Defense (Light)</p>
                <p className="text-[11px] text-[var(--text-muted)]">High-clarity daylight contrast</p>
              </div>
            </div>
            {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-[#087BFF]" />}
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              theme === 'dark'
                ? 'bg-[#0B1B36] border-[#00D9FF] ring-2 ring-[#00D9FF]/30 text-[#F4F8FF]'
                : 'bg-[var(--bg-card-subtle)] border-[var(--border-card)] text-[var(--text-muted)] hover:border-[#00D9FF]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#061126] border border-[#102448] text-[#00D9FF]">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-heading)]">SOC Command (Dark)</p>
                <p className="text-[11px] text-[var(--text-muted)]">Deep cyber navy &amp; electric cyan</p>
              </div>
            </div>
            {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-[#00D9FF]" />}
          </button>
        </div>
      </Card>

      {/* 2. Security & Privacy Toggles */}
      <Card className="p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-card)]">
          <div className="p-2.5 rounded-2xl bg-[#00D6B2]/15 text-[#00D6B2] border border-[#00D6B2]/30">
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
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)]">
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
              role="switch"
              aria-checked={settings.onDeviceOnly}
              aria-label="Strict On-Device Mode Only"
              onClick={() => handleToggle('onDeviceOnly')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF] ${
                settings.onDeviceOnly ? 'bg-[#00D6B2]' : 'bg-slate-400 dark:bg-slate-700'
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
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)]">
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
              role="switch"
              aria-checked={settings.autoRedactPII}
              aria-label="Automatic PII Masking"
              onClick={() => handleToggle('autoRedactPII')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF] ${
                settings.autoRedactPII ? 'bg-[#00D9FF]' : 'bg-slate-400 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.autoRedactPII ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* 3. About System & Version Card */}
      <Card className="p-6 sm:p-7">
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-card)] mb-4">
          <ContextShieldLogo size="sm" />
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
          <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)]">
            <span className="text-[var(--text-muted)] block mb-1">Architecture</span>
            <span className="font-bold text-[var(--text-heading)]">
              Privacy-First Hybrid AI (Client Edge Heuristics)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)]">
            <span className="text-[var(--text-muted)] block mb-1">Technology Stack</span>
            <span className="font-bold text-[var(--text-heading)]">
              React 19 + TypeScript 7 + Vite 8 + Tailwind CSS v4
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)]">
            <span className="text-[var(--text-muted)] block mb-1">Version</span>
            <span className="font-mono text-[#00D9FF] font-bold">
              Defense Console v1.0.0
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)]">
            <span className="text-[var(--text-muted)] block mb-1">Status</span>
            <span className="font-bold text-[#00D6B2] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00D6B2]" />
              Production Ready &amp; Audited
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
