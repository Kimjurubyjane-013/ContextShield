import React, { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cloud,
  FileCode,
  Lock,
  RotateCcw,
  Shield,
  Sparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { StatusBadge } from '@/components/common/StatusBadge'
import {
  CLOUD_REQUEST_TIMEOUT_MS,
  abortCloudAiAnalysis,
  runCloudAiAnalysis,
} from '@/services/cloudAi'
import { runLocalRuleBasedAnalysis } from '@/services/localSecurityEngine'
import { toAnalysisErrorState } from '@/services/errorUtils'
import { getFirebaseConfigStatus } from '@/services/firebaseConfig'
import { getRiskLevelBadgeProps } from './analysisUtils'
import { CloudConsentModal } from './CloudConsentModal'
import type {
  AnalysisErrorState,
  AnalysisRecord,
  CloudConsentState,
} from './types'

interface CloudAnalysisCardProps {
  protectedMessage: string
  analysis: AnalysisRecord | null
  consentState: CloudConsentState
  onConsentChange: (state: CloudConsentState) => void
  onAnalysisComplete: (result: AnalysisRecord) => void
  onRunLocalFallback?: (result: AnalysisRecord) => void
}

function createTimestamp(): string {
  return new Date().toISOString()
}

const TIMEOUT_SECONDS = Math.round(CLOUD_REQUEST_TIMEOUT_MS / 1000)

export const CloudAnalysisCard: React.FC<CloudAnalysisCardProps> = ({
  protectedMessage,
  analysis,
  consentState,
  onConsentChange,
  onAnalysisComplete,
  onRunLocalFallback,
}) => {
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [errorState, setErrorState] = useState<AnalysisErrorState | null>(null)

  const trimmed = protectedMessage.trim()
  const activeRequestIdRef = useRef(0)
  const latestTrimmedRef = useRef(trimmed)

  useEffect(() => {
    latestTrimmedRef.current = trimmed
  }, [trimmed])

  // Track elapsed seconds during active inference without synchronous setState inside effect body
  useEffect(() => {
    if (!isAnalyzing) return
    const timer = setInterval(() => {
      setElapsedSeconds(s => s + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isAnalyzing])

  // Abort in-flight cloud calls immediately if protected text changes
  useEffect(() => {
    return () => {
      activeRequestIdRef.current += 1
      abortCloudAiAnalysis('CONSENT_REVOKED')
    }
  }, [trimmed])

  const fbStatus = getFirebaseConfigStatus()
  const isConsentValid =
    consentState.hasConsented &&
    consentState.consentedMessageSnapshot === trimmed

  const handleOpenConsentModal = () => {
    setErrorState(null)
    setIsConsentModalOpen(true)
  }

  const handleConfirmConsent = () => {
    setIsConsentModalOpen(false)
    const newConsent: CloudConsentState = {
      hasConsented: true,
      consentedAt: createTimestamp(),
      consentedMessageSnapshot: trimmed,
    }
    onConsentChange(newConsent)
    executeCloudAnalysis(newConsent)
  }

  const executeCloudAnalysis = async (activeConsent: CloudConsentState) => {
    const requestId = activeRequestIdRef.current + 1
    activeRequestIdRef.current = requestId
    const snapshotAtStart = trimmed

    setErrorState(null)
    setElapsedSeconds(0)
    setIsAnalyzing(true)

    try {
      const result = await runCloudAiAnalysis(snapshotAtStart, activeConsent)
      if (
        activeRequestIdRef.current !== requestId ||
        latestTrimmedRef.current !== snapshotAtStart
      ) {
        return
      }
      onAnalysisComplete(result)
    } catch (err) {
      if (
        activeRequestIdRef.current !== requestId ||
        latestTrimmedRef.current !== snapshotAtStart
      ) {
        return
      }
      setErrorState(
        toAnalysisErrorState(err, 'Cloud Analysis Failed', 'Failed to complete cloud analysis.')
      )
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsAnalyzing(false)
        setElapsedSeconds(0)
      }
    }
  }

  const handleCancelCloud = (runLocalAfter: boolean) => {
    activeRequestIdRef.current += 1
    abortCloudAiAnalysis('USER_CANCELLED')
    setIsAnalyzing(false)
    setElapsedSeconds(0)
    setErrorState({
      code: 'CANCELLED',
      title: 'Cloud Analysis Cancelled',
      message: runLocalAfter
        ? 'Cloud inference was cancelled and locks were cleared. Deterministic local analysis was executed instead.'
        : 'Cloud inference was cancelled immediately. You can retry or run local rules at any time.',
      retryable: false,
    })

    if (runLocalAfter && onRunLocalFallback && trimmed) {
      const localRecord = runLocalRuleBasedAnalysis(trimmed)
      onRunLocalFallback(localRecord)
    }
  }

  const handleRevokeConsent = () => {
    activeRequestIdRef.current += 1
    abortCloudAiAnalysis('CONSENT_REVOKED')
    setIsAnalyzing(false)
    setElapsedSeconds(0)
    setErrorState(null)
    onConsentChange({
      hasConsented: false,
      consentedAt: null,
      consentedMessageSnapshot: null,
    })
  }

  const badgeProps = analysis ? getRiskLevelBadgeProps(analysis.riskLevel) : null
  const progressPct = Math.min(95, Math.max(4, Math.round((elapsedSeconds / TIMEOUT_SECONDS) * 100)))

  return (
    <Card className="p-5 sm:p-6 border border-[var(--border-card)] flex flex-col justify-between">
      <div>
        {/* Card Header with Aligned Badges */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--border-card)]">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-[#0D5663]/15 dark:bg-[#22D3EE]/12 text-[#0D5663] dark:text-[#22D3EE] border border-[#22D3EE]/25 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <h3 className="text-base font-bold text-[var(--text-heading)] leading-tight">
                Enhanced Cloud Analysis
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Contextual social engineering inspection &bull; Explicit consent required
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <StatusBadge variant="ai" size="sm" dot pulse={isAnalyzing}>
                  Gemini 3.8 Flash
                </StatusBadge>
                <StatusBadge
                  variant={isConsentValid ? 'safe' : 'warning'}
                  size="sm"
                >
                  {isConsentValid ? 'Consent Granted' : 'Consent Gated'}
                </StatusBadge>
              </div>
            </div>
          </div>

          {analysis && badgeProps && (
            <StatusBadge variant={badgeProps.variant} size="md" dot>
              {badgeProps.label}
            </StatusBadge>
          )}
        </div>

        {/* Consent Status Panel */}
        <div className="mt-4 p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)] text-xs space-y-2">
          {isConsentValid ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[#15803D] dark:text-[#4ADE80] font-semibold">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Explicit consent active for this exact masked snapshot</span>
              </span>
              <button
                type="button"
                onClick={handleRevokeConsent}
                className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[#EF4444] underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60 rounded px-1"
              >
                Revoke Consent
              </button>
            </div>
          ) : consentState.hasConsented && consentState.consentedMessageSnapshot !== trimmed ? (
            <div className="flex items-start gap-2 text-[#B45309] dark:text-[#FBBF24]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Protected text was modified after consent was granted. Previous consent was automatically invalidated.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-[var(--text-muted)]">
              <Lock className="w-4 h-4 text-[var(--text-accent)] shrink-0 mt-0.5" />
              <span>
                Cloud AI is locked. Masked text will only be sent to Gemini Cloud after you approve the consent dialog.
              </span>
            </div>
          )}
        </div>

        {/* Active Request Progress Indicator */}
        {isAnalyzing && (
          <div className="mt-4 p-4 rounded-xl bg-[#0D5663]/12 dark:bg-[#0D5663]/35 border border-[#22D3EE]/35 space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2 font-semibold text-[var(--text-heading)]">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#22D3EE] animate-spin" />
                Communicating with Gemini 3.8 Flash...
              </span>
              <span className="font-mono text-[#22D3EE]">
                {elapsedSeconds}s / {TIMEOUT_SECONDS}s
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[var(--bg-main)] overflow-hidden">
              <div
                className="h-full bg-[#22D3EE] transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Protected by a bounded {TIMEOUT_SECONDS}s request deadline. You can cancel anytime without losing your local scan.
            </p>
          </div>
        )}

        {/* Missing Firebase Config Notice */}
        {!fbStatus.isConfigured && (
          <div className="mt-4 p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/35 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-[var(--text-heading)]">
              <FileCode className="w-4 h-4 text-[var(--text-accent)]" />
              <span>Firebase Credentials Required for Cloud AI</span>
            </div>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Define Firebase AI Logic credentials in{' '}
              <code className="font-mono text-[var(--text-heading)]">.env.local</code> to enable cloud inspection.
            </p>
            <div className="p-2 rounded bg-[var(--bg-card)] font-mono text-[10px] text-[var(--text-muted)] overflow-x-auto">
              Missing: {fbStatus.missingKeys.join(', ')}
            </div>
          </div>
        )}

        {/* Error Display */}
        {errorState && (
          <div
            className={`mt-4 p-4 rounded-xl border space-y-2.5 text-xs ${
              errorState.code === 'CANCELLED'
                ? 'bg-[var(--bg-card-subtle)] border-[var(--border-card)]'
                : 'bg-[#EF4444]/10 border-[#EF4444]/35'
            }`}
          >
            <div
              className={`flex items-center gap-2 font-bold ${
                errorState.code === 'CANCELLED'
                  ? 'text-[var(--text-heading)]'
                  : 'text-[#B91C1C] dark:text-[#F87171]'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorState.title}</span>
            </div>
            <p className="text-[var(--text-muted)] leading-relaxed">{errorState.message}</p>
            {errorState.retryDelayText && (
              <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] font-mono text-[11px] text-[var(--text-heading)] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[var(--text-accent)] shrink-0" />
                <span>
                  Provider Reset Window: <strong>{errorState.retryDelayText}</strong>
                </span>
              </div>
            )}
            {errorState.technicalDetails && (
              <p className="text-[10px] font-mono text-[var(--text-muted)] break-all">
                {errorState.technicalDetails}
              </p>
            )}
            <div className="pt-1.5 flex flex-wrap items-center gap-2">
              {errorState.retryable &&
                errorState.code !== 'DAILY_QUOTA_EXCEEDED' &&
                isConsentValid && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isAnalyzing}
                    onClick={() => executeCloudAnalysis(consentState)}
                    icon={<RotateCcw className="w-3.5 h-3.5 text-[var(--text-accent)]" />}
                  >
                    Retry Cloud AI
                  </Button>
                )}
              {onRunLocalFallback && (
                <Button
                  type="button"
                  variant={errorState.code === 'DAILY_QUOTA_EXCEEDED' ? 'primary' : 'outline'}
                  size="sm"
                  disabled={!trimmed}
                  onClick={() => {
                    const localRecord = runLocalRuleBasedAnalysis(trimmed)
                    onRunLocalFallback(localRecord)
                  }}
                  icon={<Shield className="w-3.5 h-3.5" />}
                >
                  Run Local Security Analysis
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Analysis Results Display */}
        {analysis && (
          <div className="mt-5 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Cloud Context Assessment
              </p>
              <p className="text-sm font-semibold text-[var(--text-heading)] leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {analysis.suspiciousIndicators.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Cloud Detected Indicators ({analysis.suspiciousIndicators.length})
                </p>
                <ul className="space-y-1.5">
                  {analysis.suspiciousIndicators.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-card)] flex items-start gap-2 text-[var(--text-main)]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.manipulationTactics.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Psychological &amp; Social Engineering Tactics
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.manipulationTactics.map((item, idx) => (
                    <StatusBadge key={idx} variant="warning" size="sm">
                      {item}
                    </StatusBadge>
                  ))}
                </div>
              </div>
            )}

            {analysis.evidence.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Supporting Evidence from Protected Text
                </p>
                <ul className="space-y-1.5">
                  {analysis.evidence.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-lg bg-[var(--bg-card-subtle)] font-mono text-[11px] text-[var(--text-muted)]"
                    >
                      &quot;{item}&quot;
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.recommendedActions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Recommended Protective Actions
                </p>
                <ul className="space-y-1.5">
                  {analysis.recommendedActions.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/25 flex items-start gap-2 text-[var(--text-heading)]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-[11px] text-[var(--text-muted)] space-y-1 pt-2 border-t border-[var(--border-card)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>Model: {analysis.modelName}</span>
                <span className="font-mono font-semibold text-[var(--text-heading)]">
                  Total: {analysis.latencyMs ?? 0}ms
                </span>
              </div>
              {analysis.latencyBreakdown && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] opacity-80 font-mono">
                  <span>Init: {analysis.latencyBreakdown.initMs}ms</span>
                  <span>&bull;</span>
                  <span>Gen: {analysis.latencyBreakdown.generationMs}ms</span>
                  <span>&bull;</span>
                  <span>Synth: {analysis.latencyBreakdown.synthesisMs}ms</span>
                  {analysis.latencyBreakdown.retryAttempts ? (
                    <>
                      <span>&bull;</span>
                      <span className="text-[#F59E0B]">
                        Retries: {analysis.latencyBreakdown.retryAttempts}
                      </span>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Consistent Bottom Action Footer */}
      <div className="mt-6 pt-4 border-t border-[var(--border-card)] flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-[var(--text-muted)]">
          {errorState?.code === 'DAILY_QUOTA_EXCEEDED'
            ? 'Cloud AI unavailable • Daily quota reached'
            : isAnalyzing
            ? `In progress (${elapsedSeconds}s) • ${TIMEOUT_SECONDS}s bounded timeout`
            : analysis
            ? 'Transmitted only masked text'
            : isConsentValid
            ? 'Consent verified for snapshot'
            : 'Explicit consent required'}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {isAnalyzing && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCancelCloud(false)}
                icon={<X className="w-3.5 h-3.5 text-[#EF4444]" />}
              >
                Cancel
              </Button>
              {onRunLocalFallback && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancelCloud(true)}
                  icon={<Shield className="w-3.5 h-3.5 text-[#22D3EE]" />}
                >
                  Cancel &amp; Run Local
                </Button>
              )}
            </>
          )}

          {isConsentValid ? (
            <Button
              type="button"
              variant={errorState?.code === 'DAILY_QUOTA_EXCEEDED' ? 'outline' : 'primary'}
              size="sm"
              disabled={isAnalyzing || errorState?.code === 'DAILY_QUOTA_EXCEEDED'}
              onClick={() => executeCloudAnalysis(consentState)}
              icon={
                isAnalyzing ? (
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )
              }
            >
              {isAnalyzing
                ? `Analyzing (${elapsedSeconds}s)...`
                : errorState?.code === 'DAILY_QUOTA_EXCEEDED'
                ? 'Daily Quota Reached'
                : analysis
                ? 'Re-run Cloud Analysis'
                : 'Run Cloud Analysis'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={errorState?.code === 'DAILY_QUOTA_EXCEEDED'}
              onClick={handleOpenConsentModal}
              icon={<Shield className="w-3.5 h-3.5" />}
            >
              {errorState?.code === 'DAILY_QUOTA_EXCEEDED'
                ? 'Daily Quota Reached'
                : 'Review Consent & Analyze'}
            </Button>
          )}
        </div>
      </div>

      {/* Cloud Consent Modal */}
      <CloudConsentModal
        isOpen={isConsentModalOpen}
        protectedMessage={trimmed}
        onClose={() => setIsConsentModalOpen(false)}
        onConfirmConsent={handleConfirmConsent}
      />
    </Card>
  )
}
