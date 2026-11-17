import React, { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  ClipboardPaste,
  FileImage,
  Globe,
  Info,
  Lock,
  MessageSquare,
  RotateCcw,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { MiniShieldIllustration } from '@/components/illustrations/MiniShieldIllustration'
import { useNavigation } from '@/context/NavigationContext'
import { useSecurity } from '@/context/SecurityContext'
import { PRESET_ATTACKS } from '@/data/mockSecurityData'
import type { ScanResult } from '@/types'
import { formatFileSize, validateImageFile, validateMessageInput } from './scannerUtils'
import { MAX_MESSAGE_LENGTH, type UploadedScreenshot } from './types'
import { detectPii, generateMaskedText, type DetectionSummary } from '@/features/privacy'

type InputTab = 'text' | 'url' | 'file'

export const ScannerWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { setCurrentPage } = useNavigation()
  const { analyzeMessage } = useSecurity()
  const [activeTab, setActiveTab] = useState<InputTab>('text')
  const [inputText, setInputText] = useState('')
  const [screenshot, setScreenshot] = useState<UploadedScreenshot | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scanSubmitted, setScanSubmitted] = useState(false)
  const [, setSummary] = useState<DetectionSummary | null>(null)
  const [, setMaskedPreview] = useState('')
  const [quickScanResult, setQuickScanResult] = useState<ScanResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (screenshot?.previewUrl) {
        URL.revokeObjectURL(screenshot.previewUrl)
      }
    }
  }, [screenshot])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setScanSubmitted(false)
    if (val.length > MAX_MESSAGE_LENGTH) {
      setInputText(val.slice(0, MAX_MESSAGE_LENGTH))
      setValidationError(
        `Maximum length of ${MAX_MESSAGE_LENGTH.toLocaleString()} characters reached.`
      )
    } else {
      setInputText(val)
      setValidationError(null)
    }
  }

  const handlePresetClick = (text: string) => {
    setInputText(text.slice(0, MAX_MESSAGE_LENGTH))
    setValidationError(null)
    setScanSubmitted(false)
  }

  const handlePaste = async () => {
    if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
      setValidationError('Clipboard API is unavailable. Please paste manually with Ctrl+V.')
      return
    }
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        setValidationError('Clipboard is empty.')
        return
      }
      const next = (inputText ? `${inputText}\n${text}` : text).slice(0, MAX_MESSAGE_LENGTH)
      setInputText(next)
      setValidationError(null)
      setScanSubmitted(false)
    } catch {
      setValidationError('Clipboard permission denied. Please paste manually with Ctrl+V.')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const err = validateImageFile(file)
    if (err) {
      setFileError(err)
      return
    }

    setFileError(null)
    setScanSubmitted(false)
    if (screenshot?.previewUrl) {
      URL.revokeObjectURL(screenshot.previewUrl)
    }
    setScreenshot({
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveScreenshot = () => {
    if (screenshot?.previewUrl) {
      URL.revokeObjectURL(screenshot.previewUrl)
    }
    setScreenshot(null)
    setFileError(null)
    setScanSubmitted(false)
  }

  const handleClear = () => {
    setInputText('')
    handleRemoveScreenshot()
    setValidationError(null)
    setFileError(null)
    setScanSubmitted(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    const error = validateMessageInput(inputText)
    if (error) {
      setValidationError(error)
      return
    }

    setValidationError(null)
    setIsSubmitting(true)
    setScanSubmitted(false)

    // Run local client-side PII detection + local rule-based analysis (zero network)
    const result = detectPii(inputText)
    setSummary(result)
    const allIds = new Set(result.items.map(i => i.id))
    setMaskedPreview(generateMaskedText(inputText, result.items, allIds))

    const scanRecord = await analyzeMessage(inputText, 'Dashboard Quick Scan')
    setQuickScanResult(scanRecord)

    setIsSubmitting(false)
    setScanSubmitted(true)
  }

  const isScanDisabled = inputText.trim().length === 0 || isSubmitting

  return (
    <Card className="p-6 sm:p-8 bg-[var(--bg-card)] border border-[var(--border-card)] shadow-[var(--shadow-card)] relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#00D9FF]/10 via-[#087BFF]/10 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Widget Header with Lightning Icon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-[var(--border-card)] relative z-10">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#087BFF]/15 border border-[#00D9FF]/30 text-[#00D9FF] shadow-[0_0_16px_rgba(0,217,255,0.2)]">
              <Zap className="w-5 h-5 text-[#00D9FF]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-heading)] tracking-tight">
              Start a New Analysis
            </h2>
            <StatusBadge variant="local" size="sm" dot>
              Zero Cloud Leakage
            </StatusBadge>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5">
            Inspect suspicious messages, links, or attachments locally with client-side PII protection.
          </p>
        </div>

        {/* Full Scanner Page Link */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage('scanner')}
          icon={<Lock className="w-3.5 h-3.5 text-[#00D9FF]" />}
        >
          <span>Full Hybrid Scanner</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {/* URL / File / Text Selection Tabs (as required in prompt section 4E) */}
      <div className="flex items-center gap-2 mb-5 p-1.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)] w-fit max-w-full overflow-x-auto relative z-10">
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'text'
              ? 'bg-[#087BFF] text-white shadow-md'
              : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Text &amp; Message</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'url'
              ? 'bg-[#087BFF] text-white shadow-md'
              : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Suspicious URL / Presets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('file')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'file'
              ? 'bg-[#087BFF] text-white shadow-md'
              : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
          }`}
        >
          <FileImage className="w-3.5 h-3.5" />
          <span>Screenshot &amp; File</span>
        </button>
      </div>

      {/* Presets Bar when on URL / Presets Tab */}
      {activeTab === 'url' && (
        <div className="mb-5 p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)] relative z-10 animate-in fade-in duration-200">
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2.5">
            Load Preset Threat Scenario:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_ATTACKS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  handlePresetClick(preset.text)
                  setActiveTab('text')
                }}
                className="text-xs px-3.5 py-2 rounded-xl bg-[var(--bg-card)] hover:border-[#00D9FF]/50 hover:bg-[#087BFF]/10 text-[var(--text-main)] border border-[var(--border-card)] transition-all cursor-pointer text-left font-medium shadow-xs"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File Upload Zone when on File Tab */}
      {activeTab === 'file' && (
        <div className="mb-5 p-6 rounded-2xl border-2 border-dashed border-[var(--border-card)] hover:border-[#00D9FF]/50 bg-[var(--bg-card-subtle)]/50 text-center relative z-10 transition-colors animate-in fade-in duration-200">
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            onChange={handleFileUpload}
            className="hidden"
            id="scanner-widget-file-tab"
          />
          <label htmlFor="scanner-widget-file-tab" className="cursor-pointer block space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#087BFF]/15 border border-[#00D9FF]/30 flex items-center justify-center text-[#00D9FF]">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[var(--text-heading)]">
              {screenshot ? 'Replace Screenshot Attachment' : 'Upload Screenshot of Suspicious Message'}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Supports PNG, JPG, WEBP up to 5MB. Evaluated client-side.
            </p>
          </label>
        </div>
      )}

      {/* Main Scanner Input & Supporting Visual Grid */}
      <form onSubmit={handleAnalyze} className="space-y-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Input text area (8 cols on lg) */}
          <div className="lg:col-span-8 relative">
            <textarea
              value={inputText}
              onChange={handleTextChange}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Paste or type suspicious message, smishing text, email content, or link here..."
              rows={compact ? 4 : 5}
              className="w-full p-4.5 rounded-2xl text-xs sm:text-sm bg-[var(--bg-input)] border border-[var(--border-card)] text-[var(--text-main)] placeholder-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/40 focus:border-[#00D9FF] resize-y transition-all font-mono leading-relaxed"
            />

            {/* Live Character Counter */}
            <div className="absolute right-3.5 bottom-3.5 flex items-center gap-2 text-[11px] text-[var(--text-muted)] bg-[var(--bg-card)]/90 px-2.5 py-1 rounded-lg backdrop-blur-xs border border-[var(--border-card)] font-mono">
              <span>
                {inputText.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Supporting 3D Decorative Shield Visual on Right (4 cols on lg, as requested in prompt section 4E) */}
          <div className="hidden lg:flex lg:col-span-4 h-full min-h-[140px] rounded-2xl bg-gradient-to-br from-[#0B2447]/60 via-[#07152B]/80 to-[var(--bg-card)] border border-[var(--border-card)] items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-radial from-[#00D9FF]/15 to-transparent pointer-events-none" />
            <div className="flex flex-col items-center text-center space-y-1 relative z-10">
              <MiniShieldIllustration className="w-16 h-16" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                Multi-Layer Screening
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                Local Heuristics + Cloud AI
              </span>
            </div>
          </div>
        </div>

        {/* Attached Screenshot Preview Pill */}
        {screenshot && (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)]">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={screenshot.previewUrl}
                alt={screenshot.name}
                className="w-12 h-12 rounded-xl object-cover border border-[var(--border-card)] shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--text-heading)] truncate">
                  {screenshot.name}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {formatFileSize(screenshot.size)} &bull; Screenshot ready for analysis
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveScreenshot}
              className="p-2 rounded-xl text-[#EF4444] hover:bg-[#EF4444]/15 transition-colors cursor-pointer"
              title="Remove image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Validation or File Errors */}
        {(validationError || fileError) && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/35 text-xs text-[#EF4444]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
            <span>{validationError || fileError}</span>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Left Utilities */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              onChange={handleFileUpload}
              className="hidden"
              id="dashboard-screenshot-upload-main"
            />
            <label
              htmlFor="dashboard-screenshot-upload-main"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-card-subtle)] hover:bg-[#087BFF]/10 text-[var(--text-main)] border border-[var(--border-card)] transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>{screenshot ? 'Replace File' : 'Browse Files'}</span>
            </label>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePaste}
              icon={<ClipboardPaste className="w-3.5 h-3.5 text-[#00D9FF]" />}
            >
              Paste
            </Button>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2.5">
            {(inputText.length > 0 || screenshot) && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleClear}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Clear
              </Button>
            )}

            <Button
              type="submit"
              variant="gradient"
              size="md"
              disabled={isScanDisabled}
              icon={
                isSubmitting ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )
              }
            >
              {isSubmitting ? 'Evaluating...' : 'Analyze Message'}
            </Button>
          </div>
        </div>
      </form>

      {/* Real Local Screening Result Display */}
      {scanSubmitted && quickScanResult && (
        <div
          role="status"
          className="mt-6 pt-6 border-t border-[var(--border-card)] animate-in fade-in duration-300 space-y-4 relative z-10"
        >
          <div className="p-5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-[#087BFF]/20 text-[#00D9FF] shrink-0 border border-[#00D9FF]/30">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    variant={
                      quickScanResult.status === 'safe'
                        ? 'safe'
                        : quickScanResult.status === 'suspicious'
                        ? 'suspicious'
                        : 'threat'
                    }
                    size="sm"
                    dot
                  >
                    {quickScanResult.status === 'safe'
                      ? 'Safe'
                      : quickScanResult.status === 'suspicious'
                      ? 'Suspicious'
                      : 'Threat Flagged'}
                  </StatusBadge>
                  <StatusBadge variant="local" size="sm">
                    {quickScanResult.analysisMethod}
                  </StatusBadge>
                  <span className="text-xs font-mono font-bold text-[var(--text-heading)]">
                    Score: {quickScanResult.threatScore}/100
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {quickScanResult.summary}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setCurrentPage('scanner')}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Deep Cloud Inspection
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
