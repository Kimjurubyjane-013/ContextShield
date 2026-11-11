import React, { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Layers,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useNavigation } from '@/context/NavigationContext'
import { useSecurity } from '@/context/SecurityContext'
import { abortCloudAiAnalysis } from '@/services/cloudAi'
import {
  CloudAnalysisCard,
  HybridComparisonCard,
  OnDeviceAnalysisCard,
  UnifiedSecurityReportCard,
  generateUnifiedReport,
  type AnalysisRecord,
  type CloudConsentState,
} from '@/features/analysis'
import {
  PrivacyReviewCard,
  detectPii,
  type DetectionSummary,
} from '@/features/privacy'
import { MessageInputCard } from '@/features/scanner/MessageInputCard'
import { PrivacyNoticeBanner } from '@/features/scanner/PrivacyNoticeBanner'
import { ScreenshotUploadCard } from '@/features/scanner/ScreenshotUploadCard'
import { formatFileSize, validateMessageInput } from '@/features/scanner/scannerUtils'
import type { UploadedScreenshot } from '@/features/scanner/types'

type ScannerStage = 'input' | 'review' | 'ready'

export const ScannerPage: React.FC = () => {
  const { setCurrentPage } = useNavigation()
  const { recordAnalysisScan } = useSecurity()

  // Workflow state
  const [stage, setStage] = useState<ScannerStage>('input')

  // User message and screenshot (kept in component memory only)
  const [messageText, setMessageText] = useState('')
  const [screenshot, setScreenshot] = useState<UploadedScreenshot | null>(null)

  // Validation
  const [messageError, setMessageError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  // Detection and Protected Output
  const [detectionSummary, setDetectionSummary] = useState<DetectionSummary | null>(null)
  const [protectedMessage, setProtectedMessage] = useState('')
  const [redactedCount, setRedactedCount] = useState(0)

  // Loading indicator for interface transition
  const [isProcessing, setIsProcessing] = useState(false)

  // AI Analysis states (Stage 3)
  const [onDeviceAnalysis, setOnDeviceAnalysis] = useState<AnalysisRecord | null>(null)
  const [cloudAnalysis, setCloudAnalysis] = useState<AnalysisRecord | null>(null)
  const [cloudConsent, setCloudConsent] = useState<CloudConsentState>({
    hasConsented: false,
    consentedAt: null,
    consentedMessageSnapshot: null,
  })
  const [stage3View, setStage3View] = useState<'engines' | 'report'>('engines')

  // Computed Unified Security Report whenever analysis records update
  const unifiedReport = useMemo(() => {
    if (!onDeviceAnalysis && !cloudAnalysis) return null
    return generateUnifiedReport({
      protectedMessage,
      onDeviceResult: onDeviceAnalysis,
      cloudResult: cloudAnalysis,
    })
  }, [protectedMessage, onDeviceAnalysis, cloudAnalysis])

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (screenshot?.previewUrl) {
        URL.revokeObjectURL(screenshot.previewUrl)
      }
    }
  }, [screenshot])

  const handleMessageChange = (nextValue: string) => {
    setMessageText(nextValue)
    if (stage !== 'input') {
      setStage('input')
    }
  }

  const handleClearMessage = () => {
    abortCloudAiAnalysis('CONSENT_REVOKED')
    setMessageText('')
    setMessageError(null)
    setStage('input')
    setStage3View('engines')
    setOnDeviceAnalysis(null)
    setCloudAnalysis(null)
    setCloudConsent({
      hasConsented: false,
      consentedAt: null,
      consentedMessageSnapshot: null,
    })
  }

  const handleResetAll = () => {
    abortCloudAiAnalysis('CONSENT_REVOKED')
    setMessageText('')
    setMessageError(null)
    setFileError(null)
    setStage('input')
    setStage3View('engines')
    setDetectionSummary(null)
    setProtectedMessage('')
    setRedactedCount(0)
    setOnDeviceAnalysis(null)
    setCloudAnalysis(null)
    setCloudConsent({
      hasConsented: false,
      consentedAt: null,
      consentedMessageSnapshot: null,
    })
    if (screenshot?.previewUrl) {
      URL.revokeObjectURL(screenshot.previewUrl)
    }
    setScreenshot(null)
  }

  // Trigger Local PII Detection and advance to Stage 2 (Review)
  const handleStartPrivacyReview = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationResult = validateMessageInput(messageText)
    if (validationResult) {
      setMessageError(validationResult)
      return
    }

    setMessageError(null)
    setIsProcessing(true)

    // Run local client-side regex detection purely in browser memory
    const summary = detectPii(messageText)

    // Simulate smooth local parsing transition (250ms)
    await new Promise(resolve => setTimeout(resolve, 250))

    setDetectionSummary(summary)
    setIsProcessing(false)
    setStage('review')
    window.scrollTo({ top: 120, behavior: 'smooth' })
  }

  // User confirms protected message in Stage 2, advancing to Stage 3 (Ready & Analysis)
  const handleConfirmProtected = (maskedText: string, count: number) => {
    // If text modified from previous confirmation, abort pending cloud requests & reset consent
    if (maskedText !== protectedMessage) {
      abortCloudAiAnalysis('CONSENT_REVOKED')
      setOnDeviceAnalysis(null)
      setCloudAnalysis(null)
      setCloudConsent({
        hasConsented: false,
        consentedAt: null,
        consentedMessageSnapshot: null,
      })
    }
    setProtectedMessage(maskedText)
    setRedactedCount(count)
    setStage3View('engines')
    setStage('ready')
    window.scrollTo({ top: 120, behavior: 'smooth' })
  }

  const handleLocalAnalysisComplete = (result: AnalysisRecord) => {
    setOnDeviceAnalysis(result)
    recordAnalysisScan({
      protectedMessage,
      maskedCount: redactedCount,
      record: result,
      sender: 'Message Scanner (Local)',
    })
  }

  const handleCloudAnalysisComplete = (result: AnalysisRecord) => {
    setCloudAnalysis(result)
    recordAnalysisScan({
      protectedMessage,
      maskedCount: redactedCount,
      record: result,
      sender: 'Message Scanner (Cloud)',
    })
  }

  const isScanDisabled = messageText.trim().length === 0 || isProcessing

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Page Header & Workflow Breadcrumbs */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-[var(--shadow-card)] transition-colors duration-250">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <StatusBadge
              variant="ai"
              size="md"
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              Hybrid AI Security Pipeline
            </StatusBadge>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text-heading)] tracking-tight">
              Message Scanner
            </h1>

            <p className="text-sm sm:text-base font-semibold text-[var(--text-main)]">
              Check suspicious messages before you trust them.
            </p>

            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Paste or type any suspicious SMS, chat message, or email below, and optionally attach a screenshot for visual reference. ContextShield scans for sensitive Personal Identifiable Information (PII) locally in your browser memory so you can mask private data before running local security rules, Gemini Nano, or consent-controlled Cloud AI.
            </p>
          </div>

          {/* Back to Dashboard Button & Status */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage('dashboard')}
              icon={<LayoutDashboard className="w-4 h-4 text-[var(--text-accent)]" />}
            >
              Back to Dashboard
            </Button>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] text-left">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Privacy Boundary
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#16A34A] dark:text-[#22C55E]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Client-Side PII Redaction Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-step Visual Workflow Stepper */}
        <div className="mt-8 pt-6 border-t border-[var(--border-card)]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                stage === 'input'
                  ? 'bg-[#0D5663]/15 border-[#0D9488] dark:border-[#22D3EE] text-[var(--text-heading)] font-bold'
                  : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  stage === 'input'
                    ? 'bg-[#0D5663] text-[#EAF4F8]'
                    : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border border-[var(--border-card)]'
                }`}
              >
                1
              </span>
              <div className="text-xs">
                <p className="font-bold">Input Message</p>
                <p className="text-[10px] opacity-75">Text &amp; screenshot preview</p>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                stage === 'review'
                  ? 'bg-[#0D5663]/15 border-[#0D9488] dark:border-[#22D3EE] text-[var(--text-heading)] font-bold'
                  : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  stage === 'review'
                    ? 'bg-[#0D5663] text-[#EAF4F8]'
                    : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border border-[var(--border-card)]'
                }`}
              >
                2
              </span>
              <div className="text-xs">
                <p className="font-bold">Local Privacy Review</p>
                <p className="text-[10px] opacity-75">Detect &amp; mask sensitive PII</p>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                stage === 'ready'
                  ? 'bg-[#0D5663]/15 border-[#0D9488] dark:border-[#22D3EE] text-[var(--text-heading)] font-bold'
                  : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  stage === 'ready'
                    ? 'bg-[#0D5663] text-[#EAF4F8]'
                    : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border border-[var(--border-card)]'
                }`}
              >
                3
              </span>
              <div className="text-xs">
                <p className="font-bold">Security Analysis</p>
                <p className="text-[10px] opacity-75">Local &amp; consent cloud</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STAGE 1: Message Input & Screenshot Upload */}
      {stage === 'input' && (
        <form onSubmit={handleStartPrivacyReview} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 flex flex-col">
              <MessageInputCard
                value={messageText}
                onChange={handleMessageChange}
                onClear={handleClearMessage}
                validationError={messageError}
                onValidationMessage={setMessageError}
                disabled={isProcessing}
              />
            </div>

            <div className="lg:col-span-5 flex flex-col">
              <ScreenshotUploadCard
                screenshot={screenshot}
                onSelectScreenshot={item => setScreenshot(item)}
                fileError={fileError}
                onFileError={setFileError}
                disabled={isProcessing}
              />
            </div>
          </div>

          <PrivacyNoticeBanner />

          {/* Action Card */}
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-heading)]">
                  Start Privacy Inspection
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {messageText.trim().length === 0
                    ? 'Enter or paste a message above to enable privacy detection.'
                    : `Message prepared (${messageText.trim().length.toLocaleString()} characters). Click below to review and mask sensitive PII.`}
                </p>
              </div>

              <div className="flex items-center gap-3 self-stretch sm:self-auto">
                {(messageText.length > 0 || screenshot) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleResetAll}
                    disabled={isProcessing}
                    icon={<RotateCcw className="w-4 h-4" />}
                  >
                    Reset
                  </Button>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isScanDisabled}
                  className="flex-1 sm:flex-initial"
                  icon={
                    isProcessing ? (
                      <Sparkles className="w-5 h-5 animate-spin" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )
                  }
                >
                  {isProcessing ? 'Scanning for PII...' : 'Review Privacy & Redact'}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      )}

      {/* STAGE 2: Privacy Review & Redaction Interface */}
      {stage === 'review' && detectionSummary && (
        <PrivacyReviewCard
          originalMessage={messageText}
          detectionSummary={detectionSummary}
          onBackToEdit={() => setStage('input')}
          onConfirmProtected={handleConfirmProtected}
          disabled={isProcessing}
        />
      )}

      {/* STAGE 3: Protected Output, Hybrid AI Analysis & Unified Security Report */}
      {stage === 'ready' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
          {/* Sub-view Navigation Bar (When at least one model has produced results) */}
          {unifiedReport && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xs">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-main)]">
                <button
                  type="button"
                  onClick={() => setStage3View('engines')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    stage3View === 'engines'
                      ? 'bg-[var(--bg-card)] text-[var(--text-heading)] shadow-xs border border-[var(--border-card)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                  <span>Interactive Analysis Engines</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStage3View('report')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    stage3View === 'report'
                      ? 'bg-[var(--bg-card)] text-[var(--text-heading)] shadow-xs border border-[var(--border-card)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                  <span>Unified Security Report</span>
                  <span className="w-2 h-2 rounded-full bg-[#159FB5] animate-pulse" />
                </button>
              </div>

              <div className="flex items-center gap-2 px-3">
                <span className="text-[11px] text-[var(--text-muted)] hidden md:inline">
                  {onDeviceAnalysis && cloudAnalysis
                    ? 'Dual Engines Synchronized'
                    : 'Single Engine Active'}
                </span>
                {stage3View === 'engines' && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setStage3View('report')}
                    icon={<FileText className="w-3.5 h-3.5" />}
                  >
                    View Security Report
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* VIEW A: UNIFIED SECURITY REPORT */}
          {stage3View === 'report' && unifiedReport ? (
            <UnifiedSecurityReportCard
              report={unifiedReport}
              onAnalyzeAgain={handleResetAll}
              onClearReport={handleResetAll}
              onBackToScanner={() => setStage3View('engines')}
            />
          ) : (
            /* VIEW B: INTERACTIVE DUAL ENGINES */
            <div className="space-y-6 sm:space-y-8">
              {/* Protected Payload Summary Card */}
              <Card className="p-5 sm:p-6 border border-[#22C55E]/40 bg-[#22C55E]/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-card)]">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 shrink-0 mt-0.5">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-heading)]">
                          Protected Payload Verified
                        </h2>
                        <StatusBadge variant="safe" size="sm" dot>
                          {redactedCount} {redactedCount === 1 ? 'Item' : 'Items'} Redacted
                        </StatusBadge>
                      </div>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                        Your message has been masked locally in memory. Raw sensitive identifiers never leave your device.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setStage('review')}
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Modify Redactions
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleResetAll}
                    >
                      Start New Scan
                    </Button>
                  </div>
                </div>

                {/* Protected Message Box */}
                <div className="mt-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#22C55E]" />
                      Protected Message Snapshot
                    </span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      {protectedMessage.length.toLocaleString()} characters
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap select-text break-words">
                    {protectedMessage}
                  </div>
                </div>

                {/* Attached Screenshot Visual Reference */}
                {screenshot && (
                  <div className="mt-5 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={screenshot.previewUrl}
                        alt={screenshot.name}
                        className="w-12 h-12 rounded-lg object-cover border border-[var(--border-card)] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-heading)] truncate">
                          {screenshot.name}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {formatFileSize(screenshot.size)} &bull; Screenshot Attachment (Local Visual Reference Only &bull; Never Uploaded)
                        </p>
                      </div>
                    </div>
                    <StatusBadge variant="neutral" size="sm">
                      Preview Only
                    </StatusBadge>
                  </div>
                )}
              </Card>

              {/* DUAL ANALYSIS ENGINES (Side-by-Side on Desktop, Stacked on Mobile) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Local Security Analysis Card */}
                <OnDeviceAnalysisCard
                  protectedMessage={protectedMessage}
                  analysis={onDeviceAnalysis}
                  onAnalysisComplete={handleLocalAnalysisComplete}
                />

                {/* Enhanced Cloud Analysis Card */}
                <CloudAnalysisCard
                  protectedMessage={protectedMessage}
                  analysis={cloudAnalysis}
                  consentState={cloudConsent}
                  onConsentChange={setCloudConsent}
                  onAnalysisComplete={handleCloudAnalysisComplete}
                  onRunLocalFallback={handleLocalAnalysisComplete}
                />
              </div>

              {/* HYBRID COMPARISON SECTION */}
              {(onDeviceAnalysis || cloudAnalysis) && (
                <HybridComparisonCard
                  onDeviceAnalysis={onDeviceAnalysis}
                  cloudAnalysis={cloudAnalysis}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
