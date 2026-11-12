import React, { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cloud,
  Copy,
  Cpu,
  Layers,
  Lock,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatReportAsText } from '@/services/hybridReportEngine'
import { getRiskLevelBadgeProps } from './analysisUtils'
import type { FindingSeverity, FindingSource, UnifiedReport } from './types'

interface UnifiedSecurityReportCardProps {
  report: UnifiedReport
  onAnalyzeAgain: () => void
  onClearReport: () => void
  onBackToScanner: () => void
}

export const UnifiedSecurityReportCard: React.FC<UnifiedSecurityReportCardProps> = ({
  report,
  onAnalyzeAgain,
  onClearReport,
  onBackToScanner,
}) => {
  const [copied, setCopied] = useState(false)
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null)
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false)
  const [showFullRawExcerpt, setShowFullRawExcerpt] = useState(false)

  const badge = getRiskLevelBadgeProps(report.assessment.overallRisk)

  const handleCopyReport = async () => {
    try {
      const text = formatReportAsText(report)
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback textarea copy
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy report to clipboard:', err)
    }
  }

  const toggleEvidence = (id: string) => {
    setExpandedEvidenceId(prev => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. REPORT HERO & OVERALL ASSESSMENT */}
      <Card className="p-6 sm:p-8 border-2 border-[var(--border-card)] shadow-lg bg-[var(--bg-card)]">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-card)]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onBackToScanner}
              className="inline-flex items-center gap-1.5 min-h-[34px] text-xs font-semibold px-3 py-1.5 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[#22D3EE]/12 text-[var(--text-main)] border border-[var(--border-card)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Scanner</span>
            </button>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              ID: {report.id}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyReport}
              icon={
                copied ? (
                  <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                )
              }
            >
              {copied ? 'Copied to Clipboard' : 'Copy Report'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirmModal(true)}
              icon={<Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />}
            >
              Clear Report
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onAnalyzeAgain}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Analyze Again
            </Button>
          </div>
        </div>

        {/* Overall Assessment Main Banner */}
        <div className="mt-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                variant={badge.variant}
                size="md"
                icon={
                  report.assessment.overallRisk === 'HIGH' ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : report.assessment.overallRisk === 'LOW' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )
                }
                className="uppercase tracking-wider"
              >
                Overall Risk: {badge.label}
              </StatusBadge>

              <StatusBadge
                variant={
                  report.completionStatus === 'local_only'
                    ? 'local'
                    : report.completionStatus === 'cloud_only' || report.completionStatus === 'cloud_and_local'
                    ? 'ai'
                    : report.completionStatus === 'both_completed' || report.completionStatus === 'on_device_only'
                    ? 'safe'
                    : 'neutral'
                }
                size="md"
              >
                Status:{' '}
                {report.completionStatus === 'both_completed'
                  ? 'Dual-AI Model Consensus'
                  : report.completionStatus === 'cloud_and_local'
                  ? 'Cloud AI + Local Rules'
                  : report.completionStatus === 'local_only'
                  ? 'Local Rule-Based Analysis Only'
                  : report.completionStatus === 'on_device_only'
                  ? 'On-Device Gemini Nano AI Only'
                  : report.completionStatus === 'cloud_only'
                  ? 'Cloud AI Evaluation Only'
                  : 'Incomplete'}
              </StatusBadge>

              <span className="text-[11px] text-[var(--text-muted)]">
                {new Date(report.generatedAt).toLocaleString()}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-heading)] tracking-tight">
              {report.assessment.summary}
            </h2>

            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-1.5 text-xs sm:text-sm">
              <p className="font-bold text-[var(--text-heading)]">Assessment Rationale:</p>
              <p className="text-[var(--text-main)] leading-relaxed">
                {report.assessment.rationale}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] pt-1 italic">
                {report.assessment.confidenceNote}
              </p>
            </div>
          </div>

          {/* Protected Message Snippet Pill */}
          <div className="w-full lg:w-72 shrink-0 p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--text-heading)] uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#22C55E]" />
                Analyzed Payload
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {report.protectedMessageLength} chars
              </span>
            </div>
            <p className="font-mono text-[11px] text-[var(--text-muted)] leading-relaxed break-words line-clamp-3">
              {report.protectedMessageSnippet}
            </p>
            <button
              type="button"
              onClick={() => setShowFullRawExcerpt(!showFullRawExcerpt)}
              className="text-[11px] text-[var(--text-accent)] font-semibold hover:underline cursor-pointer"
            >
              {showFullRawExcerpt ? 'Hide Snippet' : 'View Masked Excerpt'}
            </button>
          </div>
        </div>

        {/* Collapsible Masked Excerpt View */}
        {showFullRawExcerpt && (
          <div className="mt-4 p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs font-mono leading-relaxed select-text break-words">
            {report.protectedMessageSnippet}
          </div>
        )}
      </Card>

      {/* 2. CONFLICT / MODEL DIVERGENCE BANNER (If Models Disagree) */}
      {report.conflictingFindings.length > 0 && (
        <Card className="p-6 border-2 border-[#F59E0B]/50 bg-[#F59E0B]/10">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#F59E0B]/20 text-[#F59E0B] shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-[#B45309] dark:text-[#FBBF24]">
                  Model Divergence &amp; Discrepancy Notice
                </h3>
                <StatusBadge variant="warning" size="sm">
                  Human Review Advised
                </StatusBadge>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
                The Local/On-Device and Cloud AI evaluations returned differing conclusions. ContextShield displays both perspectives transparently rather than averaging or discarding either assessment.
              </p>

              <div className="space-y-2 pt-2">
                {report.conflictingFindings.map(conflict => (
                  <div
                    key={conflict.id}
                    className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[#F59E0B]/30 text-xs space-y-1.5"
                  >
                    <p className="font-bold text-[var(--text-heading)]">{conflict.title}</p>
                    <p className="text-[var(--text-muted)]">{conflict.description}</p>
                    {conflict.conflictReason && (
                      <p className="text-[11px] font-semibold text-[#B45309] dark:text-[#FBBF24]">
                        {conflict.conflictReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 3. ENGINE COMPARISON GRID (Local/On-Device vs Cloud AI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Local / On-Device Card */}
        <Card className="p-6 border border-[var(--border-card)] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-[var(--border-card)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-[#F59E0B]/15 text-[#D97706] dark:text-[#FBBF24]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">
                    Local / On-Device Engine
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Zero Network Transmission
                  </p>
                </div>
              </div>

              <StatusBadge
                variant={
                  report.onDeviceSummary.status === 'completed'
                    ? 'safe'
                    : report.onDeviceSummary.status === 'failed'
                    ? 'threat'
                    : 'neutral'
                }
                size="sm"
              >
                {report.onDeviceSummary.status.toUpperCase()}
              </StatusBadge>
            </div>

            {report.onDeviceSummary.status === 'completed' ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Threat Classification:</span>
                  <span className="font-bold text-[var(--text-heading)]">
                    {report.onDeviceSummary.riskLevel ?? 'UNKNOWN'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Observed Indicators:</span>
                  <span className="font-bold text-[var(--text-heading)]">
                    {report.onDeviceSummary.findings.length}
                  </span>
                </div>

                <div className="pt-2 border-t border-[var(--border-card)]">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Key Local Findings:
                  </p>
                  <ul className="space-y-1">
                    {report.onDeviceSummary.findings.slice(0, 3).map((f, i) => (
                      <li
                        key={i}
                        className="p-1.5 rounded-md bg-[var(--bg-main)] text-[11px] text-[var(--text-main)] flex items-start gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0 mt-1" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[var(--bg-main)] text-xs text-[var(--text-muted)] space-y-1">
                <p className="font-semibold text-[var(--text-heading)]">Analysis Unavailable</p>
                <p>
                  {report.onDeviceSummary.errorMessage ||
                    'On-device Gemini Nano or local rules were not executed on this payload.'}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-card)] text-[10px] text-[var(--text-muted)] flex items-center justify-between">
            <span>Engine: {report.onDeviceSummary.modelName}</span>
            <span>Local Memory Only</span>
          </div>
        </Card>

        {/* Cloud AI Card */}
        <Card className="p-6 border border-[var(--border-card)] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-[var(--border-card)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-[#22D3EE]/15 text-[#0891B2] dark:text-[#22D3EE]">
                  <Cloud className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">
                    Gemini Cloud AI
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Deep Context (Explicit Consent)
                  </p>
                </div>
              </div>

              <StatusBadge
                variant={
                  report.cloudSummary.status === 'completed'
                    ? 'ai'
                    : report.cloudSummary.status === 'failed'
                    ? 'threat'
                    : 'neutral'
                }
                size="sm"
              >
                {report.cloudSummary.status.toUpperCase()}
              </StatusBadge>
            </div>

            {report.cloudSummary.status === 'completed' ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Threat Classification:</span>
                  <span className="font-bold text-[var(--text-heading)]">
                    {report.cloudSummary.riskLevel ?? 'UNKNOWN'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Contextual Indicators:</span>
                  <span className="font-bold text-[var(--text-heading)]">
                    {report.cloudSummary.findings.length}
                  </span>
                </div>

                <div className="pt-2 border-t border-[var(--border-card)]">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Key Cloud Findings:
                  </p>
                  <ul className="space-y-1">
                    {report.cloudSummary.findings.slice(0, 3).map((f, i) => (
                      <li
                        key={i}
                        className="p-1.5 rounded-md bg-[var(--bg-main)] text-[11px] text-[var(--text-main)] flex items-start gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] shrink-0 mt-1" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[var(--bg-main)] text-xs text-[var(--text-muted)] space-y-1">
                <p className="font-semibold text-[var(--text-heading)]">Analysis Inactive</p>
                <p>
                  {report.cloudSummary.errorMessage ||
                    'Cloud analysis was not initiated or consent was not granted for this payload.'}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-card)] text-[10px] text-[var(--text-muted)] flex items-center justify-between">
            <span>Model: {report.cloudSummary.modelName}</span>
            <span>Masked Text Only</span>
          </div>
        </Card>
      </div>

      {/* 4. CORROBORATED COMMON FINDINGS */}
      {(report.completionStatus === 'both_completed' ||
        report.completionStatus === 'cloud_and_local') &&
        report.commonFindings.length > 0 && (
        <Card className="p-6 border border-[#22C55E]/30 bg-[#22C55E]/5 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5 pb-3 border-b border-[var(--border-card)]">
            <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
            <h3 className="text-base font-bold text-[var(--text-heading)]">
              Corroborated Common Findings ({report.commonFindings.length})
            </h3>
            {report.completionStatus === 'both_completed' && (
              <StatusBadge variant="safe" size="sm">
                Both AI Models Agree
              </StatusBadge>
            )}
            {report.completionStatus === 'cloud_and_local' && (
              <StatusBadge variant="ai" size="sm">
                Cloud AI + Local Rules Agree
              </StatusBadge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.commonFindings.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-1 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-[var(--text-heading)]">{item.title}</span>
                  <SeverityBadge severity={item.severity} />
                </div>
                <p className="text-[var(--text-muted)] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5. ADDITIONAL / SINGLE-MODEL FINDINGS */}
      {report.additionalFindings.length > 0 && (
        <Card className="p-6 border border-[var(--border-card)] space-y-4">
          <div className="flex flex-wrap items-center gap-2.5 pb-3 border-b border-[var(--border-card)]">
            <Layers className="w-5 h-5 text-[var(--text-accent)]" />
            <h3 className="text-base font-bold text-[var(--text-heading)]">
              {report.completionStatus === 'cloud_only'
                ? `Cloud AI Findings (${report.additionalFindings.length})`
                : report.completionStatus === 'on_device_only'
                ? `On-Device AI Findings (${report.additionalFindings.length})`
                : report.completionStatus === 'local_only'
                ? `Local Rule Findings (${report.additionalFindings.length})`
                : `Distinct Engine Findings (${report.additionalFindings.length})`}
            </h3>
            <StatusBadge variant="neutral" size="sm">
              {report.completionStatus === 'cloud_only'
                ? 'Deep Context Insights'
                : report.completionStatus === 'on_device_only'
                ? 'On-Device AI Insights'
                : report.completionStatus === 'local_only'
                ? 'Deterministic Rule Insights'
                : 'Single Source Insights'}
            </StatusBadge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.additionalFindings.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-1.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-[var(--text-heading)]">{item.title}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <SourceBadge source={item.source} />
                    <SeverityBadge severity={item.severity} />
                  </div>
                </div>
                <p className="text-[var(--text-muted)] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 6. EXPANDABLE EVIDENCE DETAILS */}
      {report.allEvidence.length > 0 && (
        <Card className="p-6 border border-[var(--border-card)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-[var(--text-accent)]" />
              <h3 className="text-base font-bold text-[var(--text-heading)]">
                Evidence Details ({report.allEvidence.length})
              </h3>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              Click item to inspect excerpts
            </span>
          </div>

          <div className="space-y-2">
            {report.allEvidence.map(ev => {
              const isExpanded = expandedEvidenceId === ev.id
              return (
                <div
                  key={ev.id}
                  className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-main)] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleEvidence(ev.id)}
                    className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-[var(--bg-card-subtle)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-bold text-[var(--text-heading)] truncate">
                        {ev.indicator}
                      </span>
                      <SourceBadge source={ev.source} />
                      <SeverityBadge severity={ev.severity} />
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[var(--text-muted)]">
                      {ev.confidenceLabel && (
                        <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-card)]">
                          {ev.confidenceLabel}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-1 border-t border-[var(--border-card)] bg-[var(--bg-card)] text-xs space-y-2.5 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          Explanation:
                        </span>
                        <p className="text-[var(--text-main)] leading-relaxed">
                          {ev.explanation}
                        </p>
                      </div>

                      {ev.excerpt && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            Message Excerpt:
                          </span>
                          <div className="p-2.5 rounded-lg bg-[var(--bg-main)] font-mono text-[11px] text-[var(--text-heading)] border border-[var(--border-card)] select-text break-words">
                            &quot;{ev.excerpt}&quot;
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* 7. RECOMMENDED PROTECTIVE ACTIONS */}
      {report.recommendedActions.length > 0 && (
        <Card className="p-6 border border-[#22C55E]/30 bg-[#22C55E]/5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-card)]">
            <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
            <h3 className="text-base font-bold text-[var(--text-heading)]">
              Recommended Protective Directives
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.recommendedActions.map((action, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[#22C55E]/25 flex items-start gap-2.5 text-xs text-[var(--text-heading)] font-semibold shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                <span>{action}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 8. REPORT LIMITATIONS & DISCLAIMER */}
      <Card className="p-5 bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-muted)] space-y-2">
        <p className="font-bold text-[var(--text-heading)] uppercase tracking-wider text-[10px]">
          Scope &amp; Evaluation Boundaries:
        </p>
        <ul className="space-y-1 list-disc list-inside">
          {report.limitations.map((lim, i) => (
            <li key={i}>{lim}</li>
          ))}
        </ul>
        <p className="text-[11px] pt-1 border-t border-[var(--border-card)] opacity-80">
          {report.privacyNotice}
        </p>
      </Card>

      {/* CLEAR REPORT CONFIRMATION MODAL */}
      {showClearConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#EF4444]">
              <div className="p-2.5 rounded-xl bg-[#EF4444]/15">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-heading)]">
                Clear Security Report?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to clear this report? All local, on-device, and cloud findings for this message will be discarded from session memory.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-card)]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirmModal(false)}
              >
                Keep Report
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  setShowClearConfirmModal(false)
                  onClearReport()
                }}
              >
                Confirm Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SourceBadge({ source }: { source: FindingSource }) {
  if (source === 'both') {
    return (
      <StatusBadge variant="info" size="sm" className="uppercase">
        Both AI
      </StatusBadge>
    )
  }
  if (source === 'cloud') {
    return (
      <StatusBadge variant="ai" size="sm" className="uppercase">
        Cloud AI
      </StatusBadge>
    )
  }
  if (source === 'local_rules') {
    return (
      <StatusBadge variant="local" size="sm" className="uppercase">
        Local Rules
      </StatusBadge>
    )
  }
  return (
    <StatusBadge variant="safe" size="sm" className="uppercase">
      Gemini Nano
    </StatusBadge>
  )
}

function SeverityBadge({ severity }: { severity: FindingSeverity }) {
  switch (severity) {
    case 'high':
      return (
        <StatusBadge variant="threat" size="sm" className="uppercase">
          High
        </StatusBadge>
      )
    case 'medium':
      return (
        <StatusBadge variant="suspicious" size="sm" className="uppercase">
          Med
        </StatusBadge>
      )
    case 'low':
      return (
        <StatusBadge variant="safe" size="sm" className="uppercase">
          Low
        </StatusBadge>
      )
    case 'info':
    default:
      return (
        <StatusBadge variant="neutral" size="sm" className="uppercase">
          Info
        </StatusBadge>
      )
  }
}
