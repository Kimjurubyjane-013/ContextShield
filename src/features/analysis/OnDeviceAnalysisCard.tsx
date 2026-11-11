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
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(!isInitiallyUnsupported && initialReadiness === null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [errorState, setErrorState] = useState<AnalysisErrorState | null>(
    isInitiallyUnsupported
      ? {
          code: 'ON_DEVICE_UNAVAILABLE',
          title: 'On-Device AI Unavailable',
          message:
            initialReadiness?.statusMessage ||
            'Browser does not support the Chrome Prompt API. On-device Gemini Nano requires Chrome 128+ with flags enabled.',
          retryable: false,
        }
      : null
  )

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
        if (res.status === 'unsupported' || res.status === 'no') {
          setErrorState(prev =>
            prev || {
              code: 'ON_DEVICE_UNAVAILABLE',
              title: 'On-Device AI Unavailable',
              message: res.statusMessage,
              retryable: false,
            }
          )
        }
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
        toAnalysisErrorState(err, 'Analysis Error', 'Failed to complete on-device analysis.')
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
      setErrorState(toAnalysisErrorState(err, 'Local Analysis Error', 'Failed to run local rule-based analysis.'))
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
            <div className="p-2.5 rounded-xl bg-[#159FB5]/15 text-[var(--text-accent)] shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--text-heading)]">
                  On-Device Security Analysis
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2E8B57]/15 text-[#2E8B57] dark:text-[#67D59A]">
                  Zero Network
                </span>
                {analysis?.modelName === 'Local Rule-Based Analysis' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E07A5F]/15 text-[#B8573D] dark:text-[#F3A58E]">
                    Deterministic Rule-Based
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {analysis?.modelName === 'Local Rule-Based Analysis'
                  ? 'Analyzed locally via Heuristic Pattern Engine (Zero AI / Zero ML)'
                  : 'Runs locally via Chrome Prompt API (Gemini Nano)'}
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

        {/* Readiness Info Banner */}
        <div className="mt-4 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs text-[var(--text-muted)] space-y-2">
          <div className="flex items-center gap-2 font-semibold text-[var(--text-heading)]">
            <Info className="w-4 h-4 text-[var(--text-accent)]" />
            <span>
              {isCheckingReadiness
                ? 'Inspecting device model readiness...'
                : readiness?.statusMessage || 'Device inspection complete.'}
            </span>
          </div>
          {readiness?.status === 'unsupported' && (
            <div className="space-y-2 pl-6">
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Chrome Prompt API (Gemini Nano) is not enabled on this browser. You can enable it in Chrome 128+ flags, or run the local rule-based security engine immediately without AI.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isAnalyzing || !protectedMessage.trim()}
                onClick={handleRunLocalRuleBased}
                icon={<Shield className="w-3.5 h-3.5 text-[var(--text-accent)]" />}
              >
                Run Local Rule-Based Analysis
              </Button>
            </div>
          )}
        </div>

        {/* Download Progress Bar */}
        {downloadProgress !== null && (
          <div className="mt-4 p-4 rounded-xl bg-[#159FB5]/10 border border-[#159FB5]/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-heading)]">
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4 text-[var(--text-accent)] animate-bounce" />
                Downloading on-device model components...
              </span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--bg-card)] overflow-hidden">
              <div
                className="h-full bg-[#159FB5] transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorState && (
          <div className="mt-4 p-4 rounded-xl bg-[#E07A5F]/15 border border-[#E07A5F]/30 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#E07A5F]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorState.title}</span>
            </div>
            <p className="text-[var(--text-muted)] leading-relaxed">{errorState.message}</p>
            {errorState.code === 'ON_DEVICE_UNAVAILABLE' && (
              <div className="pt-1.5 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isAnalyzing || !protectedMessage.trim()}
                  onClick={handleRunLocalRuleBased}
                  icon={<Shield className="w-3.5 h-3.5" />}
                >
                  Run Local Rule-Based Analysis
                </Button>
                <span className="text-[11px] text-[var(--text-accent)] font-medium">
                  Client-side deterministic security engine (Zero Network)
                </span>
              </div>
            )}
            {errorState.technicalDetails && (
              <p className="text-[10px] font-mono opacity-80">{errorState.technicalDetails}</p>
            )}
          </div>
        )}

        {/* Analysis Results Display */}
        {analysis && (
          <div className="mt-5 space-y-4 text-xs">
            {/* Summary */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Evaluation Summary
              </p>
              <p className="text-sm font-semibold text-[var(--text-heading)] leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {/* Indicators */}
            {analysis.suspiciousIndicators.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Suspicious Indicators ({analysis.suspiciousIndicators.length})
                </p>
                <ul className="space-y-1">
                  {analysis.suspiciousIndicators.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-card)] flex items-start gap-2 text-[var(--text-main)]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E07A5F] shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Actions */}
            {analysis.recommendedActions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Protective Recommendations
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

            {/* Honest Limitations */}
            {analysis.limitations.length > 0 && (
              <div className="p-2.5 rounded-lg bg-[var(--bg-card-subtle)] text-[11px] text-[var(--text-muted)]">
                <span className="font-bold text-[var(--text-heading)]">Scope Notice: </span>
                {analysis.limitations.join(' ')}
              </div>
            )}

            <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pt-2 border-t border-[var(--border-card)]">
              <span className="font-semibold text-[var(--text-heading)]">Engine: {analysis.modelName}</span>
              <span>Latency: {analysis.latencyMs ?? 0}ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-[var(--border-card)] flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-[var(--text-muted)]">
          {analysis
            ? analysis.modelName === 'Local Rule-Based Analysis'
              ? 'Analyzed locally (No ML/AI)'
              : 'Completed locally via Chrome Prompt API'
            : readiness?.status === 'unsupported'
            ? 'Prompt API unavailable • Local engine ready'
            : 'No data leaves your device'}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {readiness?.status === 'unsupported' && !analysis && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isAnalyzing || !protectedMessage.trim()}
              onClick={handleRunLocalRuleBased}
              icon={isAnalyzing ? <Sparkles className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            >
              {isAnalyzing ? 'Analyzing Locally...' : 'Run Local Rule-Based Analysis'}
            </Button>
          )}

          <Button
            type="button"
            variant={readiness?.status === 'unsupported' && !analysis ? 'outline' : 'primary'}
            size="sm"
            disabled={isAnalyzing || isCheckingReadiness}
            onClick={handleStartAnalysis}
            icon={
              isAnalyzing ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : analysis ? (
                <RotateCcw className="w-4 h-4" />
              ) : (
                <Shield className="w-4 h-4" />
              )
            }
          >
            {isAnalyzing
              ? 'Analyzing On-Device...'
              : analysis
              ? 'Re-analyze On-Device'
              : 'Run On-Device Analysis'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
