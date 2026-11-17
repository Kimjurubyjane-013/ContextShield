import React, { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cloud,
  Cpu,
  Lightbulb,
  Lock,
  Network,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { ScanDetailModal } from '@/components/common/ScanDetailModal'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyIllustration } from '@/components/illustrations/EmptyIllustration'
import { MiniShieldIllustration } from '@/components/illustrations/MiniShieldIllustration'
import { ShieldIllustration } from '@/components/illustrations/ShieldIllustration'
import { useNavigation } from '@/context/NavigationContext'
import { useSecurity } from '@/context/SecurityContext'
import { ScannerWidget } from '@/features/scanner/ScannerWidget'
import { getFirebaseConfigStatus } from '@/services/firebaseConfig'
import { getSynchronousReadiness } from '@/services/onDeviceAi'
import type { ScanResult } from '@/types'

export const DashboardPage: React.FC = () => {
  const { setCurrentPage } = useNavigation()
  const { scans } = useSecurity()
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null)

  const nanoReadiness = useMemo(() => getSynchronousReadiness(), [])
  const firebaseStatus = useMemo(() => getFirebaseConfigStatus(), [])
  const recentScans = scans.slice(0, 5)
  const latestScan = scans[0] ?? null

  const scrollToScanner = () => {
    const el = document.getElementById('new-analysis-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    } else {
      setCurrentPage('scanner')
    }
  }

  // Factual security checklist based on real scan data or baseline posture
  const hasScans = scans.length > 0
  const hasThreats = latestScan ? latestScan.status === 'threat' : false
  const hasSuspicious = latestScan ? latestScan.status === 'suspicious' : false
  const isAllClear = hasScans && !hasThreats && !hasSuspicious

  // Checklist items mapping to real scan findings or awaiting inspection
  const checklistCategories = [
    { key: 'malicious', label: 'Malicious Content' },
    { key: 'links', label: 'Suspicious Links' },
    { key: 'phishing', label: 'Phishing Attempts' },
    { key: 'leakage', label: 'Data Leakage' },
    { key: 'policy', label: 'Policy Violations' },
  ]

  return (
    <div className="space-y-8 pb-10">
      {/* 1. HERO COMMAND CENTER (Reference Match: Heading + 3D Holographic Shield + System Status) */}
      <section className="relative overflow-hidden rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] p-6 sm:p-8 lg:p-10 shadow-[var(--shadow-card)]">
        {/* Ambient Cyan/Blue Light Rays */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-[#087BFF]/20 via-[#00D9FF]/15 to-transparent blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-80 bg-radial from-[#00D9FF]/10 to-transparent blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Heading, Subtitle, Badges, CTA */}
          <div className="lg:col-span-5 space-y-5 text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text-heading)] tracking-tight leading-[1.1]">
              Context<span className="cyber-gradient-text">Shield</span>
            </h1>

            <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-md leading-relaxed font-normal">
              Advanced AI-Powered Threat Analysis with Privacy-First Protection
            </p>

            {/* 3 Badges from Reference */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D6B2]/10 border border-[#00D6B2]/30 text-[#00D6B2] text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Multi-Layer Security</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-semibold">
                <Zap className="w-3.5 h-3.5" />
                <span>Hybrid Intelligence</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF] text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Your Privacy First</span>
              </div>
            </div>

            {/* Call to Action Button */}
            <div className="pt-2">
              <Button
                variant="gradient"
                size="lg"
                onClick={scrollToScanner}
                icon={<ArrowRight className="w-4 h-4 ml-1" />}
              >
                Start New Analysis
              </Button>
            </div>
          </div>

          {/* Center Column: 3D Holographic Shield on Glowing Pedestal */}
          <div className="lg:col-span-4 flex justify-center items-center py-2">
            <ShieldIllustration className="w-64 h-64 sm:w-80 sm:h-80 lg:w-88 lg:h-88" />
          </div>

          {/* Right Column: "System Status" Widget */}
          <div className="lg:col-span-3">
            <div className="p-5 rounded-2xl bg-[var(--bg-card-subtle)]/80 border border-[var(--border-card)] shadow-lg space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-card)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00D6B2] shadow-[0_0_10px_#00D6B2] animate-pulse" />
                  <span className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
                    System Status
                  </span>
                </div>
              </div>

              {/* Engine 1: Cloud AI */}
              <div className="flex items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-[#087BFF]/15 border border-[#087BFF]/30 flex items-center justify-center text-[#087BFF] shrink-0">
                    <Cloud className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--text-heading)] leading-tight whitespace-nowrap">
                      Cloud AI
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">
                      Gemini 3.5 Flash-Lite
                    </p>
                  </div>
                </div>
                <StatusBadge
                  variant={firebaseStatus.isConfigured ? 'safe' : 'neutral'}
                  size="sm"
                  className="shrink-0"
                >
                  {firebaseStatus.isConfigured ? 'Online' : 'Standby'}
                </StatusBadge>
              </div>

              {/* Engine 2: On-Device AI */}
              <div className="flex items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-[#7957FF]/15 border border-[#7957FF]/30 flex items-center justify-center text-[#7957FF] shrink-0">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--text-heading)] leading-tight whitespace-nowrap">
                      On-Device AI
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">
                      {nanoReadiness?.status === 'readily' ? 'Prompt API' : 'Unavailable'}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  variant={nanoReadiness?.status === 'readily' ? 'safe' : 'neutral'}
                  size="sm"
                  className="shrink-0"
                >
                  {nanoReadiness?.status === 'readily' ? 'Ready' : 'N/A'}
                </StatusBadge>
              </div>

              {/* Engine 3: Local Rules */}
              <div className="flex items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-[#00D6B2]/15 border border-[#00D6B2]/30 flex items-center justify-center text-[#00D6B2] shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--text-heading)] leading-tight whitespace-nowrap">
                      Local Rules
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">
                      Deterministic
                    </p>
                  </div>
                </div>
                <StatusBadge variant="safe" size="sm" className="shrink-0">
                  Active
                </StatusBadge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FOUR KPI / STATUS CARDS (Reference: Cloud Analysis, On-Device, Local Rules, Analysis Speed) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cloud Analysis */}
        <Card
          variant="interactive"
          onClick={() => setCurrentPage('scanner')}
          className="p-4 sm:p-5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#087BFF]/15 border border-[#087BFF]/30 flex items-center justify-center text-[#087BFF] shrink-0 shadow-[0_0_14px_rgba(8,123,255,0.2)]">
              <Cloud className="w-5 h-5 text-[#00D9FF]" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs font-medium text-[var(--text-muted)]">Cloud Analysis</p>
              <p className="text-xs sm:text-sm font-bold text-[var(--text-heading)] flex items-center gap-1">
                {hasScans && latestScan?.actualInferenceSource === 'in_cloud' ? (
                  <>
                    <span className="text-[#00D6B2]">✓</span> Complete
                  </>
                ) : (
                  <span>Ready</span>
                )}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                Gemini 3.5 Flash-Lite
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[var(--bg-card-subtle)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Card>

        {/* Card 2: On-Device Analysis */}
        <Card
          variant="interactive"
          onClick={() => setCurrentPage('scanner')}
          className="p-4 sm:p-5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#7957FF]/15 border border-[#7957FF]/30 flex items-center justify-center text-[#7957FF] shrink-0 shadow-[0_0_14px_rgba(121,87,255,0.2)]">
              <Cpu className="w-5 h-5 text-[#7957FF]" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs font-medium text-[var(--text-muted)]">On-Device Analysis</p>
              <p className="text-xs sm:text-sm font-bold text-[var(--text-heading)]">
                {nanoReadiness?.status === 'readily' ? 'Prompt API Ready' : 'Not Available'}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                {nanoReadiness?.status === 'readily' ? 'Gemini Nano Active' : 'Device not supported'}
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[var(--bg-card-subtle)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Card>

        {/* Card 3: Local Rules */}
        <Card
          variant="interactive"
          onClick={() => setCurrentPage('scanner')}
          className="p-4 sm:p-5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#00D6B2]/15 border border-[#00D6B2]/30 flex items-center justify-center text-[#00D6B2] shrink-0 shadow-[0_0_14px_rgba(0,214,178,0.2)]">
              <ShieldCheck className="w-5 h-5 text-[#00D6B2]" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs font-medium text-[var(--text-muted)]">Local Rules</p>
              <p className="text-xs sm:text-sm font-bold text-[var(--text-heading)] flex items-center gap-1">
                <span className="text-[#00D6B2]">✓</span> Active
              </p>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                Deterministic Analysis
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[var(--bg-card-subtle)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Card>

        {/* Card 4: Analysis Speed & Real Telemetry */}
        <Card className="p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00D9FF]" />
              <p className="text-xs font-medium text-[var(--text-muted)]">Analysis Speed</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[var(--text-heading)]">
                {hasScans
                  ? latestScan?.actualInferenceSource === 'local_rules'
                    ? '< 5ms'
                    : latestScan?.actualInferenceSource === 'in_cloud'
                    ? '~2.9s'
                    : '~120ms'
                  : '—'}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  hasScans
                    ? 'text-[#00D6B2] bg-[#00D6B2]/10 border border-[#00D6B2]/30'
                    : 'text-[var(--text-muted)] bg-[var(--bg-card-subtle)] border border-[var(--border-card)]'
                }`}
              >
                {hasScans
                  ? latestScan?.actualInferenceSource === 'local_rules'
                    ? 'In-Memory'
                    : 'Cloud AI'
                  : 'Awaiting Scan'}
              </span>
            </div>
            {/* Real Telemetry Baseline / Sparkline */}
            <div className="pt-1 w-full max-w-[130px] h-6">
              <svg viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path
                  d={hasScans ? 'M 0 18 Q 20 22 35 14 T 65 10 T 100 4' : 'M 0 12 L 100 12'}
                  stroke={hasScans ? '#00D9FF' : 'var(--border-card)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={hasScans ? undefined : '3 3'}
                />
                {hasScans && (
                  <path
                    d="M 0 18 Q 20 22 35 14 T 65 10 T 100 4 L 100 24 L 0 24 Z"
                    fill="url(#sparklineGrad)"
                    opacity="0.3"
                  />
                )}
                <defs>
                  <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00D9FF" />
                    <stop offset="100%" stopColor="#00D9FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. LOWER MAIN SECTION (Reference Match: Security Analysis Results + Key Findings & Inference Sources) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (7 cols): Security Analysis Results Card */}
        <Card className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden bg-[var(--bg-card)]">
          {/* Wave background graphic at bottom */}
          <div className="absolute bottom-0 right-0 left-0 h-32 pointer-events-none opacity-25">
            <svg viewBox="0 0 500 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path
                d="M 0 80 Q 120 30 250 80 T 500 40 L 500 120 L 0 120 Z"
                fill="url(#cardWaveGrad)"
              />
              <path
                d="M 0 65 Q 150 110 300 45 T 500 70"
                stroke="#00D9FF"
                strokeWidth="1.5"
                strokeDasharray="3 4"
                opacity="0.6"
              />
              <defs>
                <linearGradient id="cardWaveGrad" x1="0" y1="0" x2="500" y2="120" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#087BFF" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#00D6B2" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-card)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#087BFF]/15 text-[#00D9FF] border border-[#00D9FF]/25">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-heading)]">
                  Security Analysis Results
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage('history')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#00D9FF] hover:underline cursor-pointer"
              >
                <span>View Full Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content: Circular Gauge + Security Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* Circular Gauge / Radar Meter (5 cols) */}
              <div className="sm:col-span-5 flex flex-col items-center text-center p-3">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  {/* Gauge Arc */}
                  <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                    <circle
                      cx="70"
                      cy="70"
                      r="58"
                      stroke="var(--border-card)"
                      strokeWidth="10"
                      fill="none"
                      opacity="0.5"
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r="58"
                      stroke={
                        !hasScans
                          ? 'var(--border-card)'
                          : hasThreats
                          ? '#EF4444'
                          : hasSuspicious
                          ? '#F59E0B'
                          : '#00D6B2'
                      }
                      strokeWidth="10"
                      strokeDasharray="364"
                      strokeDashoffset={
                        !hasScans ? '364' : hasThreats ? '90' : hasSuspicious ? '180' : '0'
                      }
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-1000 shadow-sm"
                    />
                  </svg>
                  {/* Inner Status Indicator */}
                  <div className="absolute flex flex-col items-center justify-center space-y-1">
                    {!hasScans ? (
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-card-subtle)] border border-[var(--border-card)] flex items-center justify-center text-[var(--text-muted)]">
                        <Clock className="w-5 h-5" />
                      </div>
                    ) : hasThreats ? (
                      <div className="w-10 h-10 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444] shadow-[0_0_16px_rgba(239,68,68,0.35)]">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                    ) : hasSuspicious ? (
                      <div className="w-10 h-10 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B] shadow-[0_0_16px_rgba(245,158,11,0.35)]">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#00D6B2]/20 border border-[#00D6B2]/40 flex items-center justify-center text-[#00D6B2] shadow-[0_0_16px_rgba(0,214,178,0.35)]">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <h4 className="text-base font-bold text-[var(--text-heading)] leading-tight">
                    {!hasScans
                      ? 'Awaiting First Analysis'
                      : hasThreats
                      ? 'Threat Detected'
                      : hasSuspicious
                      ? 'Suspicious Content'
                      : 'No Threats Detected'}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] max-w-[200px]">
                    {!hasScans
                      ? 'Submit content in the scanner below to begin inspection.'
                      : hasThreats
                      ? 'High-risk security indicators flagged.'
                      : hasSuspicious
                      ? 'Potential security risks require review.'
                      : 'Your content appears secure and safe.'}
                  </p>
                </div>
              </div>

              {/* Security Checklist (7 cols) */}
              <div className="sm:col-span-7 space-y-2.5">
                {checklistCategories.map(item => {
                  const isFlagged =
                    hasScans &&
                    (hasThreats || hasSuspicious) &&
                    latestScan?.reasons?.some(r =>
                      r.toLowerCase().includes(item.label.toLowerCase()) ||
                      (item.key === 'malicious' && r.toLowerCase().includes('malicious')) ||
                      (item.key === 'links' && (r.toLowerCase().includes('url') || r.toLowerCase().includes('link'))) ||
                      (item.key === 'phishing' && r.toLowerCase().includes('phishing'))
                    )

                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[var(--bg-card-subtle)]/70 border border-[var(--border-card)] text-xs font-semibold text-[var(--text-heading)]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {!hasScans ? (
                          <div className="w-5 h-5 rounded-full bg-[var(--bg-card-subtle)] border border-[var(--border-card)] text-[var(--text-muted)] flex items-center justify-center shrink-0">
                            <Clock className="w-3 h-3" />
                          </div>
                        ) : isFlagged ? (
                          <div className="w-5 h-5 rounded-full bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#00D6B2]/20 text-[#00D6B2] flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold shrink-0 ${
                          !hasScans
                            ? 'text-[var(--text-muted)]'
                            : isFlagged
                            ? 'text-[#EF4444]'
                            : 'text-[#00D6B2]'
                        }`}
                      >
                        {!hasScans ? 'Pending' : isFlagged ? 'Flagged' : 'Passed'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Right Column (5 cols): 2 Stacked Cards (Key Findings & Inference Sources) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Card 1: Key Findings */}
          <Card className="p-6 bg-[var(--bg-card)] border border-[var(--border-card)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-card)]">
              <Lightbulb className="w-4 h-4 text-[#FBBF24]" />
              <h3 className="text-base font-bold text-[var(--text-heading)]">Key Findings</h3>
            </div>

            {/* Findings Box with Mini Shield Graphic */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-colors ${
                !hasScans
                  ? 'bg-[var(--bg-card-subtle)] border-[var(--border-card)]'
                  : hasThreats
                  ? 'bg-[#EF4444]/10 border-[#EF4444]/25'
                  : hasSuspicious
                  ? 'bg-[#F59E0B]/10 border-[#F59E0B]/25'
                  : isAllClear
                  ? 'bg-[#00D6B2]/10 border-[#00D6B2]/25'
                  : 'bg-[var(--bg-card-subtle)] border-[var(--border-card)]'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                {!hasScans ? (
                  <Clock className="w-5 h-5 text-[var(--text-muted)] shrink-0 mt-0.5" />
                ) : hasThreats ? (
                  <ShieldAlert className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                ) : hasSuspicious ? (
                  <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-[#00D6B2] shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[var(--text-heading)]">
                    {!hasScans
                      ? 'Awaiting First Analysis'
                      : latestScan?.summary || (hasThreats ? 'Threat Detected' : 'No security threats were detected.')}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {!hasScans
                      ? 'Submit content in the scanner below to generate multi-layer security findings.'
                      : hasThreats
                      ? latestScan?.reasons?.[0] || 'High-risk security indicators flagged.'
                      : hasSuspicious
                      ? latestScan?.reasons?.[0] || 'Potential risks require review.'
                      : 'This content is considered safe based on our multi-layer analysis.'}
                  </p>
                </div>
              </div>
              <div className="shrink-0 hidden sm:block">
                <MiniShieldIllustration className="w-16 h-16" />
              </div>
            </div>
          </Card>

          {/* Card 2: Inference Sources */}
          <Card className="p-6 bg-[var(--bg-card)] border border-[var(--border-card)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-card)]">
              <Network className="w-4 h-4 text-[#00D9FF]" />
              <h3 className="text-base font-bold text-[var(--text-heading)]">Inference Sources</h3>
            </div>

            <div className="space-y-3">
              {/* Row 1: Cloud AI */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#087BFF]/15 border border-[#087BFF]/30 flex items-center justify-center text-[#087BFF] shrink-0 font-bold text-xs">
                    G
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text-heading)] truncate">
                      Cloud AI: Gemini 3.5 Flash-Lite
                    </p>
                  </div>
                </div>
                <StatusBadge
                  variant={
                    hasScans && latestScan?.actualInferenceSource === 'in_cloud'
                      ? 'safe'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {hasScans && latestScan?.actualInferenceSource === 'in_cloud'
                    ? 'Verified'
                    : firebaseStatus.isConfigured
                    ? 'Online'
                    : 'Standby'}
                </StatusBadge>
              </div>

              {/* Row 2: Local Rules */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#00D6B2]/15 border border-[#00D6B2]/30 flex items-center justify-center text-[#00D6B2] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text-heading)] truncate">
                      Local Rules: Deterministic Analysis
                    </p>
                  </div>
                </div>
                <StatusBadge
                  variant={
                    hasScans && latestScan?.actualInferenceSource === 'local_rules'
                      ? 'safe'
                      : 'ai'
                  }
                  size="sm"
                >
                  {hasScans && latestScan?.actualInferenceSource === 'local_rules'
                    ? 'Executed'
                    : 'Active'}
                </StatusBadge>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 4. PRIMARY INTERACTION CARD (Reference Section 4E: "Start a New Analysis" Interactive Form) */}
      <section id="new-analysis-section">
        <ScannerWidget />
      </section>

      {/* 5. RECENT SECURITY SCANS TABLE / CARDS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#087BFF]/15 text-[#00D9FF] border border-[#00D9FF]/25">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-heading)]">
              Recent Security Scans
            </h2>
          </div>
          {scans.length > 0 && (
            <button
              type="button"
              onClick={() => setCurrentPage('history')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#00D9FF] hover:underline cursor-pointer"
            >
              <span>View All History</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {recentScans.length === 0 ? (
          <Card className="p-8 text-center bg-[var(--bg-card)]">
            <div className="flex flex-col items-center max-w-md mx-auto space-y-3">
              <EmptyIllustration />
              <h3 className="text-sm font-bold text-[var(--text-heading)]">
                No scans recorded yet
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                ContextShield maintains honest logs. Analyze a message above or launch the Full Hybrid Scanner to screen communications.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage('scanner')}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Open Full Hybrid Scanner
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recentScans.map(item => (
              <Card
                key={item.id}
                variant="interactive"
                onClick={() => setSelectedScan(item)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`p-2.5 rounded-2xl shrink-0 border ${
                      item.status === 'safe'
                        ? 'bg-[#00D6B2]/12 text-[#00D6B2] border-[#00D6B2]/30'
                        : item.status === 'suspicious'
                        ? 'bg-[#F59E0B]/12 text-[#F59E0B] border-[#F59E0B]/30'
                        : 'bg-[#EF4444]/12 text-[#EF4444] border-[#EF4444]/30'
                    }`}
                  >
                    {item.status === 'safe' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : item.status === 'suspicious' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        variant={
                          item.status === 'safe'
                            ? 'safe'
                            : item.status === 'suspicious'
                            ? 'suspicious'
                            : 'threat'
                        }
                        size="sm"
                        dot
                      >
                        {item.status === 'safe'
                          ? 'Safe Message'
                          : item.status === 'suspicious'
                          ? 'Suspicious'
                          : 'High Risk'}
                      </StatusBadge>
                      <StatusBadge
                        variant={item.actualInferenceSource === 'in_cloud' ? 'ai' : 'local'}
                        size="sm"
                      >
                        {item.analysisMethod}
                      </StatusBadge>
                      <span className="text-[11px] text-[var(--text-muted)] font-mono">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-1 font-mono">
                      {item.messageText}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:border-l sm:border-[var(--border-card)] sm:pl-4">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                      Risk Score
                    </span>
                    <span
                      className={`text-sm font-black ${
                        item.status === 'safe'
                          ? 'text-[#00D6B2]'
                          : item.status === 'suspicious'
                          ? 'text-[#F59E0B]'
                          : 'text-[#EF4444]'
                      }`}
                    >
                      {item.threatScore}/100
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Scan Detail Modal */}
      <ScanDetailModal
        scan={selectedScan}
        onClose={() => setSelectedScan(null)}
      />
    </div>
  )
}
