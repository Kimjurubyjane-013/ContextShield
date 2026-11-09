import React, { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  FileImage,
  Info,
  Lock,
  MessageSquare,
  RotateCcw,
  Shield,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { useNavigation } from '@/context/NavigationContext'
import { PRESET_ATTACKS } from '@/data/mockSecurityData'
import { formatFileSize, validateImageFile, validateMessageInput } from './scannerUtils'
import { MAX_MESSAGE_LENGTH, type UploadedScreenshot } from './types'
import { detectPii, generateMaskedText, type DetectionSummary } from '@/features/privacy'

export const ScannerWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { setCurrentPage } = useNavigation()
  const [inputText, setInputText] = useState('')
  const [screenshot, setScreenshot] = useState<UploadedScreenshot | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scanSubmitted, setScanSubmitted] = useState(false)
  const [summary, setSummary] = useState<DetectionSummary | null>(null)
  const [maskedPreview, setMaskedPreview] = useState('')
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

    // Run local client-side PII detection
    const result = detectPii(inputText)
    setSummary(result)
    const allIds = new Set(result.items.map(i => i.id))
    setMaskedPreview(generateMaskedText(inputText, result.items, allIds))

    await new Promise(resolve => setTimeout(resolve, 350))

    setIsSubmitting(false)
    setScanSubmitted(true)
  }

  const isScanDisabled = inputText.trim().length === 0 || isSubmitting

  return (
    <Card className="p-5 sm:p-7">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--border-card)]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#159FB5]/15 text-[var(--text-accent)]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-heading)]">
              Message Security Scanner
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Check suspicious messages before you trust them.
          </p>
        </div>

        {/* Full Scanner Page Link */}
        <button
          type="button"
          onClick={() => setCurrentPage('scanner')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#159FB5]/10 text-[var(--text-accent)] border border-[#159FB5]/25 hover:bg-[#159FB5]/20 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Open Full Scanner</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Sample Messages */}
      <div className="mb-4">
        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
          Try Sample Messages:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_ATTACKS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(preset.text)}
              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-card-subtle)] hover:bg-[#159FB5]/15 text-[var(--text-main)] border border-[var(--border-card)] transition-colors cursor-pointer text-left"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Scanner Form */}
      <form onSubmit={handleAnalyze} className="space-y-4">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={handleTextChange}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Paste or type a suspicious message here..."
            rows={compact ? 3 : 4}
            className="w-full p-4 rounded-xl text-xs sm:text-sm bg-[var(--bg-main)] border border-[var(--border-card)] text-[var(--text-main)] placeholder-[var(--text-muted)]/70 focus:outline-none focus:ring-2 focus:ring-[#159FB5]/40 focus:border-[#159FB5] resize-y transition-all font-mono"
          />

          {/* Live Character Counter */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2 text-[11px] text-[var(--text-muted)] bg-[var(--bg-card)]/90 px-2 py-0.5 rounded-md backdrop-blur-xs border border-[var(--border-card)] font-mono">
            <span>
              {inputText.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()} characters
            </span>
          </div>
        </div>

        {/* Attached Screenshot Preview Pill */}
        {screenshot && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
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
                  {formatFileSize(screenshot.size)} &bull; Preview attached
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveScreenshot}
              className="p-1.5 rounded-lg text-[#E07A5F] hover:bg-[#E07A5F]/15 transition-colors cursor-pointer"
              title="Remove image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Validation or File Errors */}
        {(validationError || fileError) && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#E07A5F]/15 border border-[#E07A5F]/30 text-xs text-[#B8573D] dark:text-[#F3A58E]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E07A5F]" />
            <span>{validationError || fileError}</span>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs text-[var(--text-muted)]">
          <span>
            Your privacy matters. Review your message before sending it for analysis. Cloud processing will require your explicit consent.
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage('privacy')}
            className="text-[var(--text-accent)] font-semibold hover:underline shrink-0 self-start sm:self-center cursor-pointer"
          >
            Privacy Center &rarr;
          </button>
        </div>

        {/* Upload screenshot bar & Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Left utilities */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              onChange={handleFileUpload}
              className="hidden"
              id="dashboard-screenshot-upload"
            />
            <label
              htmlFor="dashboard-screenshot-upload"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-card-subtle)] hover:bg-[#159FB5]/15 text-[var(--text-main)] border border-[var(--border-card)] transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[var(--text-accent)]" />
              <span>{screenshot ? 'Replace Screenshot' : 'Browse Files'}</span>
            </label>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePaste}
              icon={<ClipboardPaste className="w-3.5 h-3.5 text-[var(--text-accent)]" />}
            >
              Paste
            </Button>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2">
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
              variant="primary"
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
              {isSubmitting ? 'Preparing...' : 'Analyze Message'}
            </Button>
          </div>
        </div>
      </form>

      {/* Honest Readiness Message & Local PII Summary (No Fake AI Results) */}
      {scanSubmitted && (
        <div
          role="status"
          className="mt-6 pt-5 border-t border-[var(--border-card)] animate-in fade-in duration-300 space-y-3"
        >
          <div className="p-4 rounded-xl bg-[#159FB5]/10 border border-[#159FB5]/30 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#159FB5]/20 text-[var(--text-accent)] shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-bold text-[var(--text-heading)]">
                  Scanner interface is ready. AI analysis will be available after engine integration.
                </p>
              </div>
              <p className="text-xs text-[var(--text-muted)] flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[#2E8B57] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Input validated ({inputText.trim().length.toLocaleString()} chars)
                </span>
                {summary && summary.hasItems ? (
                  <span className="inline-flex items-center gap-1 text-[var(--text-accent)] font-semibold">
                    &bull; <Shield className="w-3.5 h-3.5" /> {summary.totalCount} sensitive item(s) detected locally
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[#2E8B57] font-semibold">
                    &bull; No standard PII patterns detected
                  </span>
                )}
                {screenshot && (
                  <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                    &bull; <FileImage className="w-3.5 h-3.5" /> {screenshot.name} (preview only)
                  </span>
                )}
              </p>

              {/* Protected text preview snippet */}
              {summary && summary.hasItems && (
                <div className="mt-2 pt-2 border-t border-[#159FB5]/20">
                  <p className="text-[11px] font-semibold text-[var(--text-heading)] mb-1">
                    Protected Preview (Client-Side Redaction):
                  </p>
                  <p className="p-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-card)] font-mono text-xs text-[var(--text-main)] line-clamp-2">
                    {maskedPreview}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Want to review individual masking toggles?
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage('scanner')}
                      className="text-xs font-bold text-[var(--text-accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Open Full Privacy Review &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
