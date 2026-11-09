import React, { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Lock,
  MessageSquareWarning,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { ScanDetailModal } from '@/components/common/ScanDetailModal'
import { SafetyIllustration } from '@/components/illustrations/SafetyIllustration'
import { ShieldIllustration } from '@/components/illustrations/ShieldIllustration'
import { useNavigation } from '@/context/NavigationContext'
import { useSecurity } from '@/context/SecurityContext'
import { ScannerWidget } from '@/features/scanner/ScannerWidget'
import type { ScanResult } from '@/types'

export const DashboardPage: React.FC = () => {
  const { setCurrentPage } = useNavigation()
  const { scans, stats } = useSecurity()
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null)

  const recentScans = scans.slice(0, 4)

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] p-6 sm:p-10 lg:p-12 shadow-[var(--shadow-card)] transition-colors duration-250">
        {/* Soft natural background ambient warmth */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#A6C5C1]/20 via-[#159FB5]/10 to-[#D7C4A8]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#159FB5]/10 text-[var(--text-accent)] border border-[#159FB5]/25 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zero Cloud Leakage</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text-heading)] tracking-tight leading-tight">
              Understand before you trust.
            </h1>

            <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-xl leading-relaxed">
              ContextShield inspects incoming messages, links, and screenshots for deceptive social engineering, phishing, and scams—keeping your private data completely on-device.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setCurrentPage('scanner')}
                icon={<MessageSquareWarning className="w-5 h-5" />}
              >
                Scan a Message
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentPage('privacy')}
                icon={<ShieldCheck className="w-5 h-5" />}
              >
                Explore Protection
              </Button>
            </div>
          </div>

          {/* Right Illustration Column */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <ShieldIllustration />
          </div>
        </div>
      </section>

      {/* 2. Message Security Scanner Widget */}
      <section id="scanner-widget">
        <ScannerWidget />
      </section>

      {/* 3. Security Overview Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#164E5A] dark:bg-[#159FB5]/25 text-white dark:text-[#35C6D9]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-heading)]">
              Security Overview
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#A6C5C1]/20 text-[var(--text-muted)] border border-[#A6C5C1]/30">
            Sample Metrics
          </span>
        </div>

        {/* 3 Status Cards (Privacy Shield, On-Device AI, Cloud AI) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Privacy Shield */}
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#2E8B57]/15 text-[#2E8B57] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Privacy Shield
              </p>
              <p className="text-sm font-bold text-[var(--text-heading)] mt-0.5">
                Active &amp; Protecting
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] text-[#2E8B57] font-medium mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E8B57]" />
                100% Client-Side
              </span>
            </div>
          </Card>

          {/* On-Device AI */}
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#159FB5]/15 text-[var(--text-accent)] shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                On-Device AI
              </p>
              <p className="text-sm font-bold text-[var(--text-heading)] mt-0.5">
                Local Model Ready
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-accent)] font-medium mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#35C6D9] animate-pulse" />
                Local Heuristics
              </span>
            </div>
          </Card>

          {/* Cloud AI Status */}
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#D7C4A8]/30 text-[#164E5A] dark:text-[#D7C4A8] shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Cloud AI
              </p>
              <p className="text-sm font-bold text-[var(--text-heading)] mt-0.5">
                Standby (Hybrid)
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] font-medium mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D7C4A8]" />
                Zero Unmasked Calls
              </span>
            </div>
          </Card>
        </div>

        {/* 4 Statistics Metrics & Simple Visual Distribution Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Stats Cards (8 cols on lg) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Scans */}
            <Card className="p-4 sm:p-5 text-center sm:text-left">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Total Scans
              </p>
              <p className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] mt-1.5">
                {stats.totalScans}
              </p>
              <span className="text-[10px] text-[var(--text-accent)] font-semibold mt-1 inline-block">
                All-time inspected
              </span>
            </Card>

            {/* Threats Blocked */}
            <Card className="p-4 sm:p-5 text-center sm:text-left">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Threats Blocked
              </p>
              <p className="text-2xl sm:text-3xl font-black text-[#D9383A] mt-1.5">
                {stats.threatsBlocked}
              </p>
              <span className="text-[10px] text-[#D9383A] font-semibold mt-1 inline-block">
                Flagged &amp; alerted
              </span>
            </Card>

            {/* PII Protected */}
            <Card className="p-4 sm:p-5 text-center sm:text-left">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                PII Protected
              </p>
              <p className="text-2xl sm:text-3xl font-black text-[var(--text-accent)] mt-1.5">
                {stats.piiProtected}
              </p>
              <span className="text-[10px] text-[var(--text-accent)] font-semibold mt-1 inline-block">
                Tokens masked
              </span>
            </Card>

            {/* Safe Ratio */}
            <Card className="p-4 sm:p-5 text-center sm:text-left">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Safe Ratio
              </p>
              <p className="text-2xl sm:text-3xl font-black text-[#2E8B57] mt-1.5">
                {stats.safeRatio}%
              </p>
              <span className="text-[10px] text-[#2E8B57] font-semibold mt-1 inline-block">
                Verified genuine
              </span>
            </Card>
          </div>

          {/* Simple Visual Distribution Chart (4 cols on lg) */}
          <Card className="lg:col-span-4 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
                  Weekly Scan Distribution
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">Distribution</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Recent threat vs safe message ratio
              </p>
            </div>

            {/* SVG Visual Horizontal Ratio Bar */}
            <div className="space-y-3">
              <div className="h-4 w-full bg-[var(--bg-main)] border border-[var(--border-card)] rounded-full overflow-hidden flex">
                <div style={{ width: '68%' }} className="bg-[#2E8B57] h-full" title="Safe: 68%" />
                <div style={{ width: '18%' }} className="bg-[#E07A5F] h-full" title="Suspicious: 18%" />
                <div style={{ width: '14%' }} className="bg-[#D9383A] h-full" title="Threats: 14%" />
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="flex items-center gap-1.5 font-medium text-[#2E8B57]">
                  <span className="w-2 h-2 rounded-full bg-[#2E8B57]" />
                  Safe (68%)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-[#E07A5F]">
                  <span className="w-2 h-2 rounded-full bg-[#E07A5F]" />
                  Suspicious (18%)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-[#D9383A]">
                  <span className="w-2 h-2 rounded-full bg-[#D9383A]" />
                  Threat (14%)
                </span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 4. Recent Activity Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#159FB5] text-white">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-heading)]">
              Recent Security Scans
            </h2>
          </div>
          <button
            onClick={() => setCurrentPage('history')}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--text-accent)] hover:underline cursor-pointer"
          >
            <span>View All History</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* List of Recent Items */}
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
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 sm:mt-0 ${
                    item.status === 'safe'
                      ? 'bg-[#2E8B57]/15 text-[#2E8B57]'
                      : item.status === 'suspicious'
                      ? 'bg-[#E07A5F]/15 text-[#E07A5F]'
                      : 'bg-[#D9383A]/15 text-[#D9383A]'
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

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge status={item.status} size="sm">
                      {item.status === 'safe'
                        ? 'Safe Message'
                        : item.status === 'suspicious'
                        ? 'Suspicious Warning'
                        : 'High-Risk Threat'}
                    </Badge>
                    <span className="text-xs font-bold text-[var(--text-heading)] truncate max-w-[200px]">
                      {item.sender}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      &bull; {item.timestamp}
                    </span>
                    {item.isDemo && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#A6C5C1]/20 text-[var(--text-muted)] font-mono">
                        DEMO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-1 font-mono">
                    {item.messageText}
                  </p>
                </div>
              </div>

              {/* Threat Score and Arrow */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:border-l sm:border-[var(--border-card)] sm:pl-4">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                    Score
                  </span>
                  <span
                    className={`text-sm font-black ${
                      item.status === 'safe'
                        ? 'text-[#2E8B57]'
                        : item.status === 'suspicious'
                        ? 'text-[#E07A5F]'
                        : 'text-[#D9383A]'
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
      </section>

      {/* 5. Promotional Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#164E5A] to-[#123E48] text-white p-6 sm:p-8 border border-[#35C6D9]/25 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#35C6D9] text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              Community Digital Safety
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Keep Your Digital Life Safe
            </h3>
            <p className="text-xs sm:text-sm text-[#A6C5C1] leading-relaxed">
              Learn how social engineering and deceptive link scams work in Southeast Asia, and how local AI safeguards your finances.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentPage('privacy')}
              >
                Learn More
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
