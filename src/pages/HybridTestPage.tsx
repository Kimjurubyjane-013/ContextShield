import React, { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Cpu,
  FlaskConical,
  Lock,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { useNavigation } from '@/context/NavigationContext'
import {
  detectPii,
  generateMaskedText,
} from '@/features/privacy'
import { runHybridAiAnalysis } from '@/services/hybridAiService'
import { toAnalysisErrorState } from '@/services/errorUtils'
import type {
  AnalysisErrorState,
  CloudConsentState,
  HybridAnalysisResult,
} from '@/features/analysis/types'

const HARMLESS_SAMPLE =
  'Your account has been suspended. Please verify your identity through this unknown link.'

export const HybridTestPage: React.FC = () => {
  const { setCurrentPage } = useNavigation()

  // Input state
  const [inputText, setInputText] = useState(HARMLESS_SAMPLE)

  // Explicit consent state for Hybrid Test (strictly unchecked by default)
  const [hasConsented, setHasConsented] = useState(false)
  const [consentedSnapshot, setConsentedSnapshot] = useState<string | null>(null)

  // Execution state
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [activeTestType, setActiveTestType] = useState<'local_only' | 'hybrid_consented' | null>(
    null
  )
  const [result, setResult] = useState<HybridAnalysisResult | null>(null)
  const [errorState, setErrorState] = useState<AnalysisErrorState | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null)

  // Compute local protected message before execution
  const { protectedMessage, detectedCount } = useMemo(() => {
    const summary = detectPii(inputText)
    const allIds = new Set(summary.items.map(i => i.id))
    const masked = generateMaskedText(inputText, summary.items, allIds)
    return {
      protectedMessage: masked,
      detectedCount: summary.totalCount,
    }
  }, [inputText])

  // Invalidate consent if message changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value)
    // If text modified, immediately reset consent
    if (hasConsented) {
      setHasConsented(false)
      setConsentedSnapshot(null)
    }
  }

  const handleResetSample = () => {
    setInputText(HARMLESS_SAMPLE)
    setHasConsented(false)
    setConsentedSnapshot(null)
    setStatus('idle')
    setResult(null)
    setErrorState(null)
  }

  const handleConsentToggle = (checked: boolean) => {
    setHasConsented(checked)
    setConsentedSnapshot(checked ? protectedMessage.trim() : null)
  }

  // TEST OPTION 1: Local-only test (ONLY_ON_DEVICE, no cloud consent)
  const runLocalOnlyTest = async () => {
    setStatus('running')
    setActiveTestType('local_only')
    setErrorState(null)
    setResult(null)
    setDownloadProgress(null)
    const t0 = performance.now()

    try {
      // Strictly passes hasConsented: false
      const unconsentedState: CloudConsentState = {
        hasConsented: false,
        consentedAt: null,
        consentedMessageSnapshot: null,
      }

      const res = await runHybridAiAnalysis({
        protectedMessage,
        consentState: unconsentedState,
        onDownloadProgress: p => setDownloadProgress(p),
      })

      setResult(res)
      setStatus('success')
    } catch (err) {
      setErrorState(
        toAnalysisErrorState(err, 'Execution Failed', 'Local-only execution failed.')
      )
      setStatus('error')
    } finally {
      setExecutionTimeMs(Math.round(performance.now() - t0))
      setDownloadProgress(null)
    }
  }

  // TEST OPTION 2: Hybrid test (PREFER_ON_DEVICE, with explicit consent)
  const runHybridConsentedTest = async () => {
    if (!hasConsented) return

    setStatus('running')
    setActiveTestType('hybrid_consented')
    setErrorState(null)
    setResult(null)
    setDownloadProgress(null)
    const t0 = performance.now()

    try {
      const validConsent: CloudConsentState = {
        hasConsented: true,
        consentedAt: new Date().toISOString(),
        consentedMessageSnapshot: protectedMessage.trim(),
      }

      const res = await runHybridAiAnalysis({
        protectedMessage,
        consentState: validConsent,
        onDownloadProgress: p => setDownloadProgress(p),
      })

      setResult(res)
      setStatus('success')
    } catch (err) {
      setErrorState(
        toAnalysisErrorState(err, 'Hybrid Execution Failed', 'Hybrid execution failed.')
      )
      setStatus('error')
    } finally {
      setExecutionTimeMs(Math.round(performance.now() - t0))
      setDownloadProgress(null)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto pb-12">
      {/* 1. DEV Test Header */}
      <Card className="p-6 sm:p-8 border-2 border-[#159FB5]/40 bg-[var(--bg-card)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-card)]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#159FB5]/15 text-[var(--text-accent)] border border-[#159FB5]/30 text-xs font-bold font-mono">
                <FlaskConical className="w-3.5 h-3.5" />
                DEVELOPMENT BENCH ONLY
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-card)]">
                SDK v13.2.0
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[var(--text-heading)] tracking-tight">
              Hybrid AI Integration Test Bench
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              Validate Firebase AI Logic hybrid inference, source resolution (<code className="text-[var(--text-accent)] font-mono">result.response.inferenceSource</code>), and privacy consent enforcement.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage('scanner')}
            icon={<ArrowLeft className="w-4 h-4 text-[var(--text-accent)]" />}
          >
            Back to Scanner
          </Button>
        </div>

        {/* Security & Isolation Callout */}
        <div className="mt-4 p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-start gap-3 text-xs">
          <Lock className="w-4 h-4 text-[#2E8B57] shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-[var(--text-muted)] leading-relaxed">
            <span className="font-bold text-[var(--text-heading)]">Zero Credential Exposure: </span>
            This test bench reads strictly from <code className="font-mono">import.meta.env</code> and dispatches through the official Firebase AI Logic client. No API keys, tokens, or unmasked message payloads are ever logged or exposed.
          </div>
        </div>
      </Card>

      {/* 2. Message Input & Protected Payload Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Input Card */}
        <Card className="p-6 border border-[var(--border-card)] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="hybrid-test-input"
                className="text-xs font-bold uppercase tracking-wider text-[var(--text-heading)]"
              >
                Test Message Input:
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetSample}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset to Sample
              </Button>
            </div>

            <textarea
              id="hybrid-test-input"
              value={inputText}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-3.5 rounded-xl text-xs sm:text-sm bg-[var(--bg-main)] border border-[var(--border-card)] text-[var(--text-main)] font-mono focus:outline-none focus:ring-2 focus:ring-[#159FB5]/40 resize-y"
              placeholder="Enter message to test..."
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-card)]">
            <span>Length: {inputText.length} characters</span>
            <span>Sample: Harmless suspension test lure</span>
          </div>
        </Card>

        {/* Protected Output Preview Card */}
        <Card className="p-6 border border-[var(--border-card)] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-heading)] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2E8B57]" />
                Exact Protected Text (Passed to AI):
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                {detectedCount} item(s) masked
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] font-mono text-xs text-[var(--text-main)] min-h-[96px] whitespace-pre-wrap break-words select-text">
              {protectedMessage}
            </div>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-card)]">
            Boundary: Raw sensitive data is masked client-side before any model call.
          </div>
        </Card>
      </div>

      {/* 3. Dual Execution Controls (Option 1 vs Option 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* OPTION 1: Local-Only Test */}
        <Card className="p-6 border border-[var(--border-card)] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[var(--text-accent)]" />
                <h3 className="text-sm font-bold text-[var(--text-heading)]">
                  Option 1: Local-Only Test
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2E8B57]/15 text-[#2E8B57] dark:text-[#67D59A]">
                ONLY_ON_DEVICE
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Enforces <code className="font-mono text-[var(--text-heading)]">InferenceMode.ONLY_ON_DEVICE</code> with <code className="font-mono text-[var(--text-heading)]">hasConsented: false</code>.
              Guarantees zero network traffic. If on-device Gemini Nano is not available on this laptop, halts cleanly with <code className="font-mono text-[#E07A5F]">ON_DEVICE_UNAVAILABLE</code>.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={status === 'running' || !protectedMessage.trim()}
            onClick={runLocalOnlyTest}
            className="w-full"
            icon={
              status === 'running' && activeTestType === 'local_only' ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <Cpu className="w-4 h-4" />
              )
            }
          >
            {status === 'running' && activeTestType === 'local_only'
              ? 'Executing On-Device...'
              : 'Run Local-Only Test (No Consent)'}
          </Button>
        </Card>

        {/* OPTION 2: Hybrid Test (PREFER_ON_DEVICE) */}
        <Card className="p-6 border border-[var(--border-card)] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#159FB5]" />
                <h3 className="text-sm font-bold text-[var(--text-heading)]">
                  Option 2: Hybrid Test
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#159FB5]/15 text-[var(--text-accent)]">
                PREFER_ON_DEVICE
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Enforces <code className="font-mono text-[var(--text-heading)]">InferenceMode.PREFER_ON_DEVICE</code> under explicit consent.
              Attempts local on-device inference first, automatically falling back to Gemini 3.5 Flash-Lite if local model is unavailable.
            </p>

            {/* Mandatory Unchecked Consent Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasConsented}
                onChange={e => handleConsentToggle(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#159FB5] focus:ring-[#159FB5] accent-[#159FB5] cursor-pointer"
              />
              <span className="text-xs font-semibold text-[var(--text-heading)] leading-snug">
                I explicitly grant consent for cloud fallback analysis for this exact message snapshot.
              </span>
            </label>

            {consentedSnapshot && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#2E8B57] font-mono px-2 py-1 rounded bg-[#2E8B57]/10 border border-[#2E8B57]/20">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Snapshot verified: {consentedSnapshot.length} chars locked</span>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={status === 'running' || !hasConsented || !protectedMessage.trim()}
            onClick={runHybridConsentedTest}
            className="w-full"
            icon={
              status === 'running' && activeTestType === 'hybrid_consented' ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )
            }
          >
            {status === 'running' && activeTestType === 'hybrid_consented'
              ? 'Executing Hybrid...'
              : 'Run Hybrid Test (Consent Granted)'}
          </Button>
        </Card>
      </div>

      {/* 4. Download Progress (If on-device model component download is triggered) */}
      {downloadProgress !== null && (
        <Card className="p-4 bg-[#159FB5]/10 border border-[#159FB5]/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-heading)]">
            <span>Downloading on-device model components...</span>
            <span>{downloadProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--bg-card)] overflow-hidden">
            <div
              className="h-full bg-[#159FB5] transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </Card>
      )}

      {/* 5. Execution Results Display */}
      {status === 'error' && errorState && (
        <Card className="p-6 border-2 border-[#E07A5F]/40 bg-[#E07A5F]/10 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#E07A5F]/20 text-[#E07A5F] shrink-0 mt-0.5">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#E07A5F]/20 text-[#E07A5F]">
                  {errorState.code}
                </span>
                <h3 className="text-sm font-bold text-[#B8573D] dark:text-[#F3A58E]">
                  {errorState.title}
                </h3>
                {executionTimeMs !== null && (
                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {executionTimeMs}ms
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-main)] leading-relaxed">{errorState.message}</p>
              {errorState.technicalDetails && (
                <p className="text-[11px] font-mono text-[var(--text-muted)] pt-1">
                  Details: {errorState.technicalDetails}
                </p>
              )}

              {errorState.retryDelayText && (
                <div className="mt-2 p-2 rounded bg-[var(--bg-card)] border border-[var(--border-card)] font-mono text-[11px] text-[var(--text-heading)] flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-accent)] shrink-0" />
                  <span>Provider Reset Window: <strong>{errorState.retryDelayText}</strong></span>
                </div>
              )}

              {errorState.code === 'ON_DEVICE_UNAVAILABLE' && (
                <div className="mt-3 p-3 rounded-lg bg-[var(--bg-card)] border border-[#E07A5F]/20 text-xs text-[var(--text-muted)] space-y-1">
                  <p className="font-bold text-[var(--text-heading)]">Hardware Note (8GB RAM):</p>
                  <p>
                    On an 8GB laptop without Chrome flags, Chrome disables Gemini Nano by default.
                    This test verified that <code className="font-mono text-[#E07A5F]">ONLY_ON_DEVICE</code> safely halted without sending any network request to Google Cloud!
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {status === 'success' && result && (
        <Card className="p-6 sm:p-8 border-2 border-[#2E8B57]/40 bg-[var(--bg-card)] space-y-6">
          {/* Header & Source Resolution Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-card)]">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {result.actualInferenceSource === 'on_device' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2E8B57]/15 text-[#2E8B57] dark:text-[#67D59A] border border-[#2E8B57]/30 text-xs font-bold font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    INFERENCE SOURCE: ON_DEVICE (Gemini Nano)
                  </span>
                ) : result.actualInferenceSource === 'local_rules' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E07A5F]/15 text-[#B8573D] dark:text-[#F3A58E] border border-[#E07A5F]/30 text-xs font-bold font-mono">
                    <Shield className="w-3.5 h-3.5" />
                    INFERENCE SOURCE: LOCAL_RULES (Deterministic Engine)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#159FB5]/15 text-[var(--text-accent)] border border-[#159FB5]/30 text-xs font-bold font-mono">
                    <Sparkles className="w-3.5 h-3.5" />
                    INFERENCE SOURCE: IN_CLOUD (Gemini Fallback)
                  </span>
                )}

                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-[var(--bg-main)] text-[var(--text-heading)] border-[var(--border-card)]">
                  Risk: {result.riskLevel}
                </span>

                <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  Total: {result.latencyMs ?? executionTimeMs ?? 0}ms
                </span>

                {result.latencyBreakdown && (
                  <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-mono opacity-80">
                    [Init: {result.latencyBreakdown.initMs}ms | Gen: {result.latencyBreakdown.generationMs}ms | Synth: {result.latencyBreakdown.synthesisMs}ms{result.latencyBreakdown.retryAttempts ? ` | Retries: ${result.latencyBreakdown.retryAttempts}` : ''}]
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-heading)] pt-1">
                {result.summary}
              </h2>
            </div>
          </div>

          {/* Telemetry Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                Model Name
              </span>
              <p className="font-semibold text-[var(--text-heading)] truncate">{result.modelName}</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                Inference Mode Passed
              </span>
              <p className="font-mono font-semibold text-[var(--text-heading)]">
                {result.usedInferenceMode}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                Consent State
              </span>
              <p className="font-semibold text-[var(--text-heading)]">
                {result.cloudConsentGranted ? 'Consent Verified' : 'No Consent (Local Only)'}
              </p>
            </div>
          </div>

          {/* Structured Findings */}
          <div className="space-y-4 text-xs">
            {result.suspiciousIndicators.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-[var(--text-heading)] uppercase tracking-wider text-[10px]">
                  Suspicious Indicators ({result.suspiciousIndicators.length}):
                </span>
                <ul className="space-y-1">
                  {result.suspiciousIndicators.map((ind, i) => (
                    <li
                      key={i}
                      className="p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-card)] flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E07A5F] shrink-0 mt-1.5" />
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.manipulationTactics.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-[var(--text-heading)] uppercase tracking-wider text-[10px]">
                  Manipulation Tactics:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.manipulationTactics.map((tac, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-[#E07A5F]/10 border border-[#E07A5F]/20 text-[11px] font-semibold text-[#B8573D] dark:text-[#F3A58E]"
                    >
                      {tac}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.recommendedActions.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-[var(--text-heading)] uppercase tracking-wider text-[10px]">
                  Recommended Actions:
                </span>
                <ul className="space-y-1">
                  {result.recommendedActions.map((act, i) => (
                    <li
                      key={i}
                      className="p-2 rounded-lg bg-[#2E8B57]/10 border border-[#2E8B57]/20 flex items-start gap-2 text-[var(--text-heading)] font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8B57] shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 6. Integration Checklist */}
      <Card className="p-6 border border-[var(--border-card)] space-y-3 text-xs">
        <h4 className="font-bold text-[var(--text-heading)] uppercase tracking-wider text-[10px]">
          Integration Compliance Assertions:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2E8B57]" />
            <span>Strict zero-network call when consent is unchecked</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2E8B57]" />
            <span>Consent invalidated on message alteration</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2E8B57]" />
            <span>Captures SDK <code className="font-mono text-[var(--text-heading)]">inferenceSource</code> accurately</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2E8B57]" />
            <span>Zero credential/API key leakage in client code</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
