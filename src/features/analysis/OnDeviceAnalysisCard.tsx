import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Download,
  Info,
  RotateCcw,
  Shield,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { checkOnDeviceReadiness, getSynchronousReadiness, runOnDeviceAnalysis } from '@/services/onDeviceAi'
import { runLocalRuleBasedAnalysis } from '@/services/localSecurityEngine'
import { toAnalysisErrorState } from '@/services/errorUtils'
import { getRiskLevelBadgeProps } from './analysisUtils'
import type {
  AnalysisErrorState,
  AnalysisRecord,
  OnDeviceModelReadiness,
} from './types'

interface OnDeviceAnalysisCardProps {
  protectedMessage: string
  analysis: AnalysisRecord | null
  onAnalysisComplete: (result: AnalysisRecord) => void
}

export const OnDeviceAnalysisCard: React.FC<OnDeviceAnalysisCardProps> = ({
  protectedMessage,
  analysis,
  onAnalysisComplete,
}) => {
  const initialReadiness = getSynchronousReadiness()
  const isInitiallyUnsupported = initialReadiness?.status === 'unsupported'

  const [readiness, setReadiness] = useState<OnDeviceModelReadiness | null>(initialReadiness)
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(
    !isInitiallyUnsupported && initialReadiness === null
  )
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [errorState, setErrorState] = useState<AnalysisErrorState | null>(null)

  useEffect(() => {
    let isMounted = true
    if (isInitiallyUnsupported) {
      return
    }
    const inspect = async () => {
      setIsCheckingReadiness(true)
      const res = await checkOnDeviceReadiness()
      if (isMounted) {
        setReadiness(res)
        setIsCheckingReadiness(false)
      }
    }
    inspect()
    return () => {
      isMounted = false
    }
  }, [isInitiallyUnsupported])

  const handleStartAnalysis = async () => {
    setErrorState(null)
    setIsAnalyzing(true)
    setDownloadProgress(null)

    try {
      const result = await runOnDeviceAnalysis(protectedMessage, p => {
        setDownloadProgress(p)
      })
      onAnalysisComplete(result)
    } catch (err) {
      setErrorState(
        toAnalysisErrorState(err, 'On-device analysis unavailable', 'Failed to complete on-device analysis.')
      )
    } finally {
      setIsAnalyzing(false)
      setDownloadProgress(null)
    }
  }

  const handleRunLocalRuleBased = () => {
    setErrorState(null)
    setIsAnalyzing(true)
    try {
      const result = runLocalRuleBasedAnalysis(protectedMessage)
      onAnalysisComplete(result)
    } catch (err) {
      setErrorState(
        toAnalysisErrorState(err, 'Local Analysis Error', 'Failed to run local rule-based analysis.')
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const badgeProps = analysis ? getRiskLevelBadgeProps(analysis.riskLevel) : null
  const isLocalRules = analysis?.actualInferenceSource === 'local_rules'

  return (
    <Card className="p-5 sm:p-6 border border-[var(--border-card)] flex flex-col justify-between">
      <div>
        {/* Card Header with Aligned Badge Group */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--border-card)]">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-[#0D5663]/15 dark:bg-[#0D5663]/45 text-[#0D5663] dark:text-[#22D3EE] border border-[#22D3EE]/25 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <h3 className="text-base font-bold text-[var(--text-heading)] leading-tight">
                Local Security Analysis
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {isLocalRules
                  ? 'Heuristic Pattern Engine (Zero AI / Zero ML)'
                  : 'Offline rule engine & Chrome Prompt API (Gemini Nano)'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <StatusBadge variant="safe" size="sm" dot>
                  Zero Network
                </StatusBadge>
                {analysis ? (
                  <StatusBadge variant={isLocalRules ? 'local' : 'ai'} size="sm">
                    {isLocalRules ? 'Deterministic Rule-Based' : 'Gemini Nano On-Device'}
                  </StatusBadge>
                ) : (
                  <StatusBadge
                    variant={readiness?.status === 'readily' ? 'ai' : 'neutral'}
                    size="sm"
                  >
                    {readiness?.status === 'readily' ? 'Gemini Nano Ready' : 'On-device analysis unavailable'}
                  </StatusBadge>
                )}
              </div>
            </div>
          </div>

          {analysis && badgeProps && (
            <StatusBadge variant={badgeProps.variant} size="md" dot>
              {badgeProps.label}
            </StatusBadge>
          )}
        </div>

        {/* Readiness & Isolation Info Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)] text-xs text-[var(--text-muted)] space-y-2">
          <div className="flex items-start gap-2 font-semibold text-[var(--text-heading)]">
            <Info className="w-4 h-4 text-[var(--text-accent)] shrink-0 mt-0.5" />
            <span className="leading-snug">
              {isCheckingReadiness
                ? 'Inspecting on-device Gemini Nano Prompt API readiness...'
                : readiness?.status === 'readily' || readiness?.status === 'after-download'
                ? readiness.statusMessage
                : 'On-device analysis unavailable. Local Rule-Based Analysis runs offline with zero network requests.'}
            </span>
          </div>
          {(readiness?.status === 'unsupported' || readiness?.status === 'no') && (
            <details className="pl-6 text-[11px] text-[var(--text-muted)]">
              <summary className="cursor-pointer select-none font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors">
                Technical Diagnostics
              </summary>
              <p className="mt-1.5 leading-relaxed font-mono text-[10px] opacity-90">
                Code: ON_DEVICE_UNAVAILABLE &mdash; {readiness.statusMessage}
              </p>
            </details>
          )}
        </div>

        {/* Download Progress Bar (when Nano model downloads on supported Chrome builds) */}
        {downloadProgress !== null && (
          <div className="mt-4 p-4 rounded-xl bg-[#0D5663]/15 border border-[#22D3EE]/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-heading)]">
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4 text-[#22D3EE]" />
                Downloading on-device model components...
              </span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--bg-main)] overflow-hidden">
              <div
                className="h-full bg-[#22D3EE] transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error / Unavailable Notice (only shown on explicit user action) */}
        {errorState && (
          <div
            className={`mt-4 p-3.5 rounded-xl border space-y-2 text-xs ${
              errorState.code === 'ON_DEVICE_UNAVAILABLE'
                ? 'bg-[var(--bg-card-subtle)] border-[var(--border-card)]'
                : 'bg-[#F59E0B]/10 border-[#F59E0B]/35'
            }`}
          >
            <div
              className={`flex items-center gap-2 font-semibold ${
                errorState.code === 'ON_DEVICE_UNAVAILABLE'
                  ? 'text-[var(--text-heading)]'
                  : 'text-[#B45309] dark:text-[#FBBF24] font-bold'
              }`}
            >
              {errorState.code === 'ON_DEVICE_UNAVAILABLE' ? (
                <Info className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{errorState.title}</span>
            </div>
            {errorState.code === 'ON_DEVICE_UNAVAILABLE' ? (
              <details className="pl-6 text-[11px] text-[var(--text-muted)]">
                <summary className="cursor-pointer select-none font-medium hover:text-[var(--text-heading)] transition-colors">
                  Technical Diagnostics
                </summary>
                <p className="mt-1.5 leading-relaxed">{errorState.message}</p>
                <p className="mt-1 text-[10px] font-mono opacity-80">
                  Code: {errorState.code}
                  {errorState.technicalDetails ? ` — ${errorState.technicalDetails}` : ''}
                </p>
              </details>
            ) : (
              <>
                <p className="text-[var(--text-muted)] leading-relaxed">{errorState.message}</p>
                {errorState.technicalDetails && (
                  <p className="text-[10px] font-mono opacity-80">{errorState.technicalDetails}</p>
                )}
              </>
            )}
          </div>
        )}

        {/* Analysis Results Display */}
        {analysis && (
          <div className="mt-5 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Evaluation Summary
              </p>
              <p className="text-sm font-semibold text-[var(--text-heading)] leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {analysis.suspiciousIndicators.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Suspicious Indicators ({analysis.suspiciousIndicators.length})
                </p>
                <ul className="space-y-1.5">
                  {analysis.suspiciousIndicators.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-card)] flex items-start gap-2 text-[var(--text-main)]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.recommendedActions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Protective Recommendations
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

            {analysis.limitations.length > 0 && (
              <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-card)] text-[11px] text-[var(--text-muted)]">
                <span className="font-bold text-[var(--text-heading)]">Scope Notice: </span>
                {analysis.limitations.join(' ')}
              </div>
            )}

            <div className="text-[11px] text-[var(--text-muted)] flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-card)]">
              <span className="font-semibold text-[var(--text-heading)]">
                Engine: {analysis.modelName}
              </span>
              <span className="font-mono">Latency: {analysis.latencyMs ?? 0}ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Consistent Bottom Action Footer */}
      <div className="mt-6 pt-4 border-t border-[var(--border-card)] flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-[var(--text-muted)]">
          {analysis
            ? isLocalRules
              ? 'Analyzed offline (Zero AI / Zero Net)'
              : 'Completed locally via Chrome Prompt API'
            : '100% browser-local execution'}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isAnalyzing || !protectedMessage.trim()}
            onClick={handleRunLocalRuleBased}
            icon={isAnalyzing ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
          >
            {analysis && isLocalRules ? 'Re-run Local Rules' : 'Run Local Security Analysis'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isAnalyzing || isCheckingReadiness || !protectedMessage.trim()}
            onClick={handleStartAnalysis}
            icon={
              isAnalyzing ? (
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              ) : analysis && !isLocalRules ? (
                <RotateCcw className="w-3.5 h-3.5" />
              ) : (
                <Cpu className="w-3.5 h-3.5" />
              )
            }
          >
            {isAnalyzing
              ? 'Checking...'
              : readiness?.status === 'readily'
              ? 'Run Gemini Nano'
              : 'Check Gemini Nano'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
