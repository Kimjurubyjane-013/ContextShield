import React, { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { runCloudAiAnalysis } from '@/services/cloudAi'
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
  const [errorState, setErrorState] = useState<AnalysisErrorState | null>(null)

  const fbStatus = getFirebaseConfigStatus()
  const trimmed = protectedMessage.trim()

  // Check if consent has been invalidated by text modification
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
    // Automatically trigger cloud analysis after confirmed consent
    executeCloudAnalysis(newConsent)
  }

  const executeCloudAnalysis = async (activeConsent: CloudConsentState) => {
    setErrorState(null)
    setIsAnalyzing(true)

    try {
      const result = await runCloudAiAnalysis(trimmed, activeConsent)
      onAnalysisComplete(result)
    } catch (err) {
      setErrorState(
        toAnalysisErrorState(err, 'Cloud Analysis Error', 'Failed to complete cloud analysis.')
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const badgeProps = analysis ? getRiskLevelBadgeProps(analysis.riskLevel) : null

  return (
    <Card className="p-6 border border-[var(--border-card)] flex flex-col justify-between">
      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--border-card)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#35C6D9]/15 text-[#159FB5] shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--text-heading)]">
                  Enhanced Cloud Analysis
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#159FB5]/15 text-[var(--text-accent)]">
                  Gemini Cloud
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Deeper context evaluation &bull; Requires explicit opt-in
              </p>
            </div>
          </div>

          {analysis && badgeProps && (
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${badgeProps.bgClass} ${badgeProps.textClass} ${badgeProps.borderClass}`}
            >
              {badgeProps.label}
            </span>
          )}
        </div>

        {/* Consent Status Indicator */}
        <div className="mt-4 p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs space-y-2">
          {isConsentValid ? (
            <div className="flex items-center justify-between text-[#2E8B57] dark:text-[#67D59A] font-semibold">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Explicit consent granted for this message snapshot
              </span>
              <button
                type="button"
                onClick={() =>
                  onConsentChange({
                    hasConsented: false,
                    consentedAt: null,
                    consentedMessageSnapshot: null,
                  })
                }
                className="text-[11px] text-[var(--text-muted)] hover:text-[#E07A5F] underline cursor-pointer"
              >
                Revoke
              </button>
            </div>
          ) : consentState.hasConsented && consentState.consentedMessageSnapshot !== trimmed ? (
            <div className="flex items-start gap-2 text-[#E07A5F]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Protected text was modified after consent was granted. To protect your privacy, previous consent was invalidated.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-[var(--text-muted)]">
              <Lock className="w-4 h-4 text-[var(--text-accent)] shrink-0 mt-0.5" />
              <span>
                Cloud analysis is inactive. Your protected text will not be transmitted without your explicit consent.
              </span>
            </div>
          )}
        </div>

        {/* Missing Firebase Config Notice */}
        {!fbStatus.isConfigured && (
          <div className="mt-4 p-4 rounded-xl bg-[#D7C4A8]/20 border border-[#D7C4A8]/50 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-[var(--text-heading)]">
              <FileCode className="w-4 h-4 text-[var(--text-accent)]" />
              <span>Firebase Credentials Required for Cloud AI</span>
            </div>
            <p className="text-[var(--text-muted)] leading-relaxed">
              To send requests to Gemini Cloud via Firebase AI Logic, define your project keys in <code className="font-mono text-[var(--text-heading)]">.env.local</code>.
            </p>
            <div className="p-2 rounded bg-[var(--bg-card)] font-mono text-[10px] text-[var(--text-muted)] overflow-x-auto">
              Missing: {fbStatus.missingKeys.join(', ')} (See .env.example)
            </div>
          </div>
        )}

        {/* Error Display */}
        {errorState && (
          <div className="mt-4 p-4 rounded-xl bg-[#E07A5F]/15 border border-[#E07A5F]/30 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#E07A5F]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorState.title}</span>
            </div>
            <p className="text-[var(--text-muted)] leading-relaxed">{errorState.message}</p>
            {errorState.retryDelayText && (
              <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] font-mono text-[11px] text-[var(--text-heading)] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[var(--text-accent)] shrink-0" />
                <span>Provider Reset Window: <strong>{errorState.retryDelayText}</strong></span>
              </div>
            )}
            {errorState.technicalDetails && (
              <p className="text-[10px] font-mono opacity-80">{errorState.technicalDetails}</p>
            )}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {errorState.retryable && errorState.code !== 'DAILY_QUOTA_EXCEEDED' && isConsentValid && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isAnalyzing}
                  onClick={() => executeCloudAnalysis(consentState)}
                  icon={<RotateCcw className="w-3.5 h-3.5 text-[var(--text-accent)]" />}
                >
                  {isAnalyzing ? 'Retrying in Cloud...' : 'Retry Cloud AI'}
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
            {/* Summary */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Cloud Context Assessment
              </p>
              <p className="text-sm font-semibold text-[var(--text-heading)] leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {/* Suspicious Indicators */}
            {analysis.suspiciousIndicators.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Cloud Detected Indicators ({analysis.suspiciousIndicators.length})
                </p>
                <ul className="space-y-1">
                  {analysis.suspiciousIndicators.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-card)] flex items-start gap-2 text-[var(--text-main)]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#159FB5] shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Manipulation Tactics */}
            {analysis.manipulationTactics.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Psychological &amp; Social Engineering Tactics
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.manipulationTactics.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-[#E07A5F]/10 border border-[#E07A5F]/20 text-[11px] font-medium text-[#B8573D] dark:text-[#F3A58E]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence */}
            {analysis.evidence.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Supporting Evidence from Protected Text
                </p>
                <ul className="space-y-1">
                  {analysis.evidence.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-2 rounded-lg bg-[var(--bg-card-subtle)] font-mono text-[11px] text-[var(--text-muted)]"
                    >
                      &quot;{item}&quot;
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Actions */}
            {analysis.recommendedActions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Recommended Protective Actions
                </p>
                <ul className="space-y-1">
                  {analysis.recommendedActions.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-2 rounded-lg bg-[#2E8B57]/10 border border-[#2E8B57]/20 flex items-start gap-2 text-[var(--text-heading)]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8B57] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-[10px] text-[var(--text-muted)] space-y-1 pt-2 border-t border-[var(--border-card)]">
              <div className="flex items-center justify-between">
                <span>Model: {analysis.modelName}</span>
                <span className="font-semibold text-[var(--text-heading)]">Total: {analysis.latencyMs ?? 0}ms</span>
              </div>
              {analysis.latencyBreakdown && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] opacity-80 font-mono">
                  <span>Init: {analysis.latencyBreakdown.initMs}ms</span>
                  <span>&bull;</span>
                  <span>Gen: {analysis.latencyBreakdown.generationMs}ms</span>
                  <span>&bull;</span>
                  <span>Synth: {analysis.latencyBreakdown.synthesisMs}ms</span>
                  {analysis.latencyBreakdown.retryAttempts ? (
                    <>
                      <span>&bull;</span>
                      <span className="text-[#E07A5F]">Retries: {analysis.latencyBreakdown.retryAttempts}</span>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-[var(--border-card)] flex items-center justify-between gap-3">
        <span className="text-[11px] text-[var(--text-muted)]">
          {errorState?.code === 'DAILY_QUOTA_EXCEEDED'
            ? 'Cloud AI unavailable &bull; Daily quota reached'
            : analysis
            ? 'Transmitted only masked text'
            : isConsentValid
            ? 'Consent ready'
            : 'Explicit consent required'}
        </span>

        {isConsentValid ? (
          <Button
            type="button"
            variant={errorState?.code === 'DAILY_QUOTA_EXCEEDED' ? 'outline' : 'primary'}
            size="sm"
            disabled={isAnalyzing || errorState?.code === 'DAILY_QUOTA_EXCEEDED'}
            onClick={() => executeCloudAnalysis(consentState)}
            icon={
              isAnalyzing ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )
            }
          >
            {isAnalyzing
              ? 'Analyzing in Cloud...'
              : errorState?.code === 'DAILY_QUOTA_EXCEEDED'
              ? 'Daily Quota Reached'
              : analysis
              ? 'Re-run Cloud Analysis'
              : 'Run Cloud Analysis'}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={errorState?.code === 'DAILY_QUOTA_EXCEEDED'}
            onClick={handleOpenConsentModal}
            icon={<Shield className="w-4 h-4 text-[var(--text-accent)]" />}
          >
            {errorState?.code === 'DAILY_QUOTA_EXCEEDED' ? 'Daily Quota Reached' : 'Review Consent & Analyze'}
          </Button>
        )}
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
