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
    <div className="space-y-8 max-w-4xl mx-auto">
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
          <div className="p-2 rounded-xl bg-[#0D5663] text-[#22D3EE]">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-heading)]">
              Appearance &amp; Display
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Select Cybersecurity Defense Center display mode
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              theme === 'light'
                ? 'bg-[#F4F8FB] border-[#0D9488] ring-2 ring-[#0D9488]/25 text-[#0F172A]'
                : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)] hover:border-[#0D9488]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#E2ECF4] text-[#0D5663]">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-heading)]">Clean Defense (Light)</p>
                <p className="text-[11px] text-[var(--text-muted)]">High-clarity daylight contrast</p>
              </div>
            </div>
            {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />}
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              theme === 'dark'
                ? 'bg-[#0B2735] border-[#22D3EE] ring-2 ring-[#22D3EE]/25 text-[#EAF4F8]'
                : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)] hover:border-[#22D3EE]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#05121E] text-[#22D3EE]">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-heading)]">SOC Command (Dark)</p>
                <p className="text-[11px] text-[var(--text-muted)]">Primary Cybersecurity navy/cyan</p>
              </div>
            </div>
            {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-[#22D3EE]" />}
          </button>
        </div>
      </Card>

      {/* 2. Security & Privacy Toggles */}
      <Card className="p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-card)]">
          <div className="p-2 rounded-xl bg-[#22C55E]/15 text-[#22C55E]">
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
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
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
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${
                settings.onDeviceOnly ? 'bg-[#22C55E]' : 'bg-slate-400 dark:bg-slate-700'
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
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
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
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${
                settings.autoRedactPII ? 'bg-[#0D9488] dark:bg-[#22D3EE]' : 'bg-slate-400 dark:bg-slate-700'
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
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
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
              role="switch"
              aria-checked={settings.cloudFallback}
              aria-label="Hybrid Cloud Deep-Scan"
              onClick={() => handleToggle('cloudFallback')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${
                settings.cloudFallback ? 'bg-[#0D9488] dark:bg-[#22D3EE]' : 'bg-slate-400 dark:bg-slate-700'
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
              Defense Console v1.0
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
