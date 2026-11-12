import React, { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cloud,
  Cpu,
  MessageSquareWarning,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { ScanDetailModal } from '@/components/common/ScanDetailModal'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyIllustration } from '@/components/illustrations/EmptyIllustration'
import { SafetyIllustration } from '@/components/illustrations/SafetyIllustration'
import { ShieldIllustration } from '@/components/illustrations/ShieldIllustration'
import { useNavigation } from '@/context/NavigationContext'
import { useSecurity } from '@/context/SecurityContext'
import { ScannerWidget } from '@/features/scanner/ScannerWidget'
import { getFirebaseConfigStatus } from '@/services/firebaseConfig'
import { getSynchronousReadiness } from '@/services/onDeviceAi'
import type { ScanResult } from '@/types'

export const DashboardPage: React.FC = () => {
  const { setCurrentPage } = useNavigation()
  const { scans, stats } = useSecurity()
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null)

  const nanoReadiness = useMemo(() => getSynchronousReadiness(), [])
  const firebaseStatus = useMemo(() => getFirebaseConfigStatus(), [])
  const recentScans = scans.slice(0, 5)

  const distribution = useMemo(() => {
    const total = scans.length
    if (total === 0) {
      return { total: 0, safePct: 0, suspiciousPct: 0, threatPct: 0 }
    }
    const safeCount = scans.filter(s => s.status === 'safe').length
    const suspiciousCount = scans.filter(s => s.status === 'suspicious').length
    const threatCount = scans.filter(s => s.status === 'threat').length
    return {
      total,
      safePct: Math.round((safeCount / total) * 100),
      suspiciousPct: Math.round((suspiciousCount / total) * 100),
      threatPct: Math.round((threatCount / total) * 100),
    }
  }, [scans])

  return (
    <div className="space-y-8">
      {/* 1. Hero Command Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] p-6 sm:p-9 lg:p-11 shadow-[var(--shadow-card)] transition-colors duration-200">
        <div
          className="absolute -top-28 -right-28 w-96 h-96 rounded-full bg-gradient-to-br from-[#22D3EE]/15 via-[#0D5663]/20 to-transparent blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant="ai" dot icon={<Sparkles className="w-3 h-3" />}>
                Zero Cloud Leakage
              </StatusBadge>
              <StatusBadge variant="safe" dot>
                Client-Side PII Shield
              </StatusBadge>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text-heading)] tracking-tight leading-[1.12]">
              Inspect before you trust.
            </h1>

            <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-xl leading-relaxed">
              ContextShield screens suspicious messages and links for phishing and social engineering—masking sensitive PII locally before any AI analysis runs.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setCurrentPage('scanner')}
                icon={<MessageSquareWarning className="w-5 h-5" />}
              >
                Open Message Scanner
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentPage('privacy')}
                icon={<ShieldCheck className="w-5 h-5" />}
              >
                Privacy Architecture
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center items-center">
            <ShieldIllustration />
          </div>
        </div>
      </section>

      {/* 2. Quick Local Message Scanner Widget */}
      <section id="scanner-widget">
        <ScannerWidget />
      </section>

      {/* 3. Defense Readiness & Real Session Telemetry */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0D5663]/15 dark:bg-[#0D5663]/50 text-[#0D5663] dark:text-[#22D3EE] border border-[#22D3EE]/25">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-heading)]">
                Security Operations Overview
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Live engine availability and verified local session metrics
              </p>
            </div>
          </div>

          <StatusBadge variant="neutral">
            {stats.totalScans === 0
              ? 'Session Telemetry Ready'
              : `${stats.totalScans} Recorded Scan${stats.totalScans === 1 ? '' : 's'}`}
          </StatusBadge>
        </div>

        {/* 4 System Status Cards (Honest Runtime State) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Privacy Shield */}
          <Card className="p-5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#22C55E]/12 text-[#22C55E] border border-[#22C55E]/25 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Privacy Masking
              </p>
              <p className="text-sm font-bold text-[var(--text-heading)]">
                Active &amp; Enforced
              </p>
              <StatusBadge variant="safe" size="sm" dot>
                100% Client-Side
              </StatusBadge>
            </div>
          </Card>

          {/* Local Security Engine */}
          <Card className="p-5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#0D5663]/15 dark:bg-[#0D5663]/45 text-[#0D5663] dark:text-[#22D3EE] border border-[#22D3EE]/25 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Local Rule Engine
              </p>
              <p className="text-sm font-bold text-[var(--text-heading)]">
                Deterministic Ready
              </p>
              <StatusBadge variant="local" size="sm" dot>
                Zero Network
              </StatusBadge>
            </div>
          </Card>

          {/* On-Device Gemini Nano */}
          <Card className="p-5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#0D5663]/12 dark:bg-[#0F3244] text-[#0D5663] dark:text-[#22D3EE] border border-[var(--border-card)] shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Gemini Nano
              </p>
              <p className="text-sm font-bold text-[var(--text-heading)]">
                {nanoReadiness?.status === 'readily'
                  ? 'Browser API Ready'
                  : 'On-device analysis unavailable'}
              </p>
              <StatusBadge
                variant={nanoReadiness?.status === 'readily' ? 'safe' : 'neutral'}
                size="sm"
                dot
              >
                {nanoReadiness?.status === 'readily'
                  ? 'Prompt API Detected'
                  : 'Prompt API Not Detected'}
              </StatusBadge>
            </div>
          </Card>

          {/* Cloud AI */}
          <Card className="p-5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#0D5663]/12 dark:bg-[#0F3244] text-[#0D5663] dark:text-[#22D3EE] border border-[var(--border-card)] shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Cloud AI (Flash)
              </p>
              <p className="text-sm font-bold text-[var(--text-heading)]">
                {firebaseStatus.isConfigured ? 'Standby (Gated)' : 'Not Configured'}
              </p>
              <StatusBadge
                variant={firebaseStatus.isConfigured ? 'ai' : 'neutral'}
                size="sm"
                dot
              >
                {firebaseStatus.isConfigured ? 'Consent Required' : 'Missing Config'}
              </StatusBadge>
            </div>
          </Card>
        </div>

        {/* 4 Real Metrics & Real Verdict Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-5">
              <p className="text-xs font-medium text-[var(--text-muted)]">Total Scans</p>
              <p className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] mt-1.5">
                {stats.totalScans}
              </p>
              <span className="text-[11px] text-[var(--text-accent)] font-semibold mt-1 inline-block">
                Stored locally only
              </span>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-medium text-[var(--text-muted)]">High-Risk Threats</p>
              <p className="text-2xl sm:text-3xl font-black text-[#EF4444] mt-1.5">
                {stats.threatsBlocked}
              </p>
              <span className="text-[11px] text-[#EF4444] font-semibold mt-1 inline-block">
                Flagged in session
              </span>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-medium text-[var(--text-muted)]">PII Tokens Masked</p>
              <p className="text-2xl sm:text-3xl font-black text-[var(--text-accent)] mt-1.5">
                {stats.piiProtected}
              </p>
              <span className="text-[11px] text-[var(--text-accent)] font-semibold mt-1 inline-block">
                Stripped before scan
              </span>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-medium text-[var(--text-muted)]">Safe Rate</p>
              <p className="text-2xl sm:text-3xl font-black text-[#22C55E] mt-1.5">
                {stats.totalScans === 0 ? '—' : `${stats.safeRatio}%`}
              </p>
              <span className="text-[11px] text-[#22C55E] font-semibold mt-1 inline-block">
                {stats.totalScans === 0 ? 'Awaiting first scan' : 'Verified low risk'}
              </span>
            </Card>
          </div>

          {/* Session Verdict Distribution */}
          <Card className="lg:col-span-4 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
                  Session Distribution
                </span>
                <StatusBadge variant="neutral" size="sm">
                  {distribution.total === 0 ? 'Empty' : `${distribution.total} Total`}
                </StatusBadge>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                {distribution.total === 0
                  ? 'Run a scan to visualize real threat vs. safe verdict ratios.'
                  : 'Calculated directly from your saved local scans'}
              </p>
            </div>

            {distribution.total > 0 ? (
              <div className="space-y-3">
                <div className="h-3.5 w-full bg-[var(--bg-main)] border border-[var(--border-card)] rounded-full overflow-hidden flex">
                  {distribution.safePct > 0 && (
                    <div
                      style={{ width: `${distribution.safePct}%` }}
                      className="bg-[#22C55E] h-full"
                      title={`Safe: ${distribution.safePct}%`}
                    />
                  )}
                  {distribution.suspiciousPct > 0 && (
                    <div
                      style={{ width: `${distribution.suspiciousPct}%` }}
                      className="bg-[#F59E0B] h-full"
                      title={`Suspicious: ${distribution.suspiciousPct}%`}
                    />
                  )}
                  {distribution.threatPct > 0 && (
                    <div
                      style={{ width: `${distribution.threatPct}%` }}
                      className="bg-[#EF4444] h-full"
                      title={`Threat: ${distribution.threatPct}%`}
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="flex items-center gap-1.5 font-medium text-[#22C55E]">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    Safe ({distribution.safePct}%)
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-[#F59E0B]">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    Suspicious ({distribution.suspiciousPct}%)
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-[#EF4444]">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                    Threat ({distribution.threatPct}%)
                  </span>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <div className="h-3 w-full bg-[var(--bg-main)] border border-[var(--border-card)] rounded-full" />
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* 4. Recent Security Scans */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0D5663] text-[#22D3EE] border border-[#22D3EE]/30">
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
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-accent)] hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60 rounded px-1.5 py-1"
            >
              <span>View All History</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {recentScans.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center max-w-md mx-auto space-y-3">
              <EmptyIllustration />
              <h3 className="text-sm font-bold text-[var(--text-heading)]">
                No scans recorded yet
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                ContextShield does not populate fake scan logs. Inspect a message in the Quick Scanner above or open the full Message Scanner to begin.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage('scanner')}
                icon={<MessageSquareWarning className="w-3.5 h-3.5" />}
              >
                Launch Full Scanner
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentScans.map(item => (
              <Card
                key={item.id}
                variant="interactive"
                onClick={() => setSelectedScan(item)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 border ${
                      item.status === 'safe'
                        ? 'bg-[#22C55E]/12 text-[#22C55E] border-[#22C55E]/30'
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
                      <span className="text-[11px] text-[var(--text-muted)]">
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
                          ? 'text-[#22C55E]'
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

      {/* 5. Privacy-First Architecture Panel */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#071827] via-[#0B2735] to-[#0D5663]/70 text-[#EAF4F8] p-6 sm:p-8 border border-[#22D3EE]/25 shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <StatusBadge variant="ai" icon={<Shield className="w-3.5 h-3.5" />}>
              Strict Privacy Boundaries
            </StatusBadge>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#EAF4F8]">
              Deterministic Local Defense + Consent-Gated Cloud AI
            </h3>
            <p className="text-xs sm:text-sm text-[#8EB2C2] leading-relaxed">
              Local heuristic checks operate offline with zero network calls. Enhanced Cloud AI runs only after client-side PII redaction and explicit per-message consent.
            </p>
            <div className="pt-1">
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentPage('privacy')}
              >
                Explore Privacy Controls
              </Button>
            </div>
          </div>

          <div className="shrink-0 flex justify-center">
            <SafetyIllustration />
          </div>
        </div>
      </section>

      {/* Scan Detail Modal */}
      <ScanDetailModal
        scan={selectedScan}
        onClose={() => setSelectedScan(null)}
      />
    </div>
  )
}
