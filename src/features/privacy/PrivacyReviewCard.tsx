import React, { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CheckSquare,
  Copy,
  Edit3,
  Eye,
  Info,
  Lock,
  RotateCcw,
  ShieldCheck,
  Square,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { generateMaskedText } from './piiDetection'
import type { DetectedPiiItem, DetectionSummary, PiiCategory } from './types'

export interface PrivacyReviewCardProps {
  originalMessage: string
  detectionSummary: DetectionSummary
  onBackToEdit: () => void
  onConfirmProtected: (protectedText: string, maskedCount: number) => void
  disabled?: boolean
}

export const PrivacyReviewCard: React.FC<PrivacyReviewCardProps> = ({
  originalMessage,
  detectionSummary,
  onBackToEdit,
  onConfirmProtected,
  disabled = false,
}) => {
  const { items, totalCount, categoryCounts, hasItems } = detectionSummary

  // By default, all detected items are selected for masking
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(items.map(item => item.id))
  })

  // Whether user is manually editing the protected text
  const [isManualEditing, setIsManualEditing] = useState(false)
  const [manualText, setManualText] = useState('')
  const [copied, setCopied] = useState(false)

  // Derived auto-masked text based on current selection
  const autoMaskedText = useMemo(() => {
    return generateMaskedText(originalMessage, items, selectedIds)
  }, [originalMessage, items, selectedIds])

  // Active protected text (manual edit takes priority if active)
  const effectiveProtectedText = isManualEditing ? manualText : autoMaskedText

  const allSelected = items.length > 0 && selectedIds.size === items.length
  const noneSelected = selectedIds.size === 0

  const handleToggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    // If user toggles, reset manual editing override so it reflects choices
    setIsManualEditing(false)
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(items.map(item => item.id)))
    setIsManualEditing(false)
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
    setIsManualEditing(false)
  }

  const handleStartManualEdit = () => {
    setManualText(autoMaskedText)
    setIsManualEditing(true)
  }

  const handleRevertToAuto = () => {
    setIsManualEditing(false)
  }

  const handleCopyProtected = async () => {
    try {
      await navigator.clipboard.writeText(effectiveProtectedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore clipboard error
    }
  }

  const handleProceed = () => {
    const maskedCount = isManualEditing
      ? selectedIds.size
      : selectedIds.size
    onConfirmProtected(effectiveProtectedText, maskedCount)
  }

  // Segment renderer for original text with highlighted sensitive spans
  const highlightedSegments = useMemo(() => {
    if (!hasItems) return [{ text: originalMessage, isItem: false, item: null }]

    const segments: Array<{ text: string; isItem: boolean; item: DetectedPiiItem | null }> = []
    let cursor = 0

    // Items are already sorted in ascending order of startIndex by detector
    for (const item of items) {
      if (item.startIndex > cursor) {
        segments.push({
          text: originalMessage.slice(cursor, item.startIndex),
          isItem: false,
          item: null,
        })
      }
      segments.push({
        text: originalMessage.slice(item.startIndex, item.endIndex),
        isItem: true,
        item,
      })
      cursor = item.endIndex
    }

    if (cursor < originalMessage.length) {
      segments.push({
        text: originalMessage.slice(cursor),
        isItem: false,
        item: null,
      })
    }

    return segments
  }, [originalMessage, items, hasItems])

  const categoryBadgeColors: Record<PiiCategory, string> = {
    Email: 'bg-[#22D3EE]/15 text-[#0891B2] dark:text-[#22D3EE] border-[#22D3EE]/35',
    Phone: 'bg-[#22C55E]/15 text-[#15803D] dark:text-[#4ADE80] border-[#22C55E]/35',
    'Financial Information': 'bg-[#EF4444]/15 text-[#DC2626] dark:text-[#FCA5A5] border-[#EF4444]/35',
    'Identification Number': 'bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FBBF24] border-[#F59E0B]/35',
    'Sensitive URL Parameter': 'bg-[#0D5663]/20 text-[#0D5663] dark:text-[#38BDF8] border-[#0D9488]/35',
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner & Status Summary */}
      <Card className="p-5 sm:p-7 border-2 border-[#0D9488]/35 dark:border-[#22D3EE]/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-card)]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#0D5663] text-[#22D3EE] shrink-0 mt-0.5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-heading)]">
                  Step 2: Local Privacy Review &amp; Redaction
                </h2>
                <StatusBadge variant="safe" size="sm" className="font-mono">
                  100% In-Browser
                </StatusBadge>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                ContextShield scanned your message entirely in your browser memory. Review detected items and choose what to redact before proceeding.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBackToEdit}
            disabled={disabled}
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Edit Message
          </Button>
        </div>

        {/* Detection Metrics Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
            <p className="text-[11px] text-[var(--text-muted)] font-medium">Total Sensitive Items</p>
            <p className="text-xl sm:text-2xl font-black text-[var(--text-heading)] mt-0.5">
              {totalCount}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
            <p className="text-[11px] text-[var(--text-muted)] font-medium">Selected to Redact</p>
            <p className="text-xl sm:text-2xl font-black text-[#0891B2] dark:text-[#22D3EE] mt-0.5">
              {selectedIds.size} / {totalCount}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
            <p className="text-[11px] text-[var(--text-muted)] font-medium">Detection Method</p>
            <p className="text-xs sm:text-sm font-bold text-[var(--text-heading)] mt-1">
              Local Heuristic Rules
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
            <p className="text-[11px] text-[var(--text-muted)] font-medium">Processing Boundary</p>
            <p className="text-xs sm:text-sm font-bold text-[#16A34A] dark:text-[#22C55E] mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              Zero Cloud Leakage
            </p>
          </div>
        </div>

        {/* Category breakdown pills */}
        {hasItems && (
          <div className="mt-4 pt-4 border-t border-[var(--border-card)] flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[var(--text-muted)]">Detected Categories:</span>
            {(Object.keys(categoryCounts) as PiiCategory[]).map(cat => {
              const count = categoryCounts[cat]
              if (count === 0) return null
              return (
                <span
                  key={cat}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold inline-flex items-center gap-1.5 ${categoryBadgeColors[cat]}`}
                >
                  <span>{cat}</span>
                  <span className="font-mono px-1.5 py-0.2 rounded-md bg-white/40 dark:bg-black/30 text-[10px]">
                    {count}
                  </span>
                </span>
              )
            })}
          </div>
        )}
      </Card>

      {/* 2. Highlighted Original Message Preview */}
      <Card className="p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-[var(--border-card)]">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[var(--text-accent)]" />
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-heading)]">
              Original Message Inspection Preview
            </h3>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            {hasItems ? 'Highlighted items will be redacted' : 'Clean message review'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap select-text break-words">
          {highlightedSegments.map((seg, idx) => {
            if (!seg.isItem || !seg.item) {
              return <span key={idx}>{seg.text}</span>
            }

            const item = seg.item
            const isMasked = selectedIds.has(item.id)

            return (
              <mark
                key={idx}
                title={`${item.category}: ${item.explanation} (${isMasked ? 'Will be redacted' : 'Preserved as-is'})`}
                className={`px-1.5 py-0.5 rounded-md font-bold transition-all ${
                  isMasked
                    ? 'bg-[#159FB5]/25 text-[#164E5A] dark:text-[#35C6D9] ring-1 ring-[#159FB5]/40'
                    : 'bg-[#A6C5C1]/20 text-[var(--text-muted)] line-through decoration-[#E07A5F]'
                }`}
              >
                {seg.text}
              </mark>
            )
          })}
        </div>

        {hasItems && (
          <p className="mt-2 text-[11px] text-[var(--text-muted)] flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded bg-[#159FB5]/30 border border-[#159FB5]/50" />
            Highlighted = Selected for redaction. Unchecked items remain in clear text.
          </p>
        )}
      </Card>

      {/* 3. Individual Detection Items & Masking Controls (if items exist) */}
      {hasItems ? (
        <Card className="p-5 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-card)]">
            <div>
              <h3 className="text-base font-bold text-[var(--text-heading)]">
                Detected Sensitive Information Items ({items.length})
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Toggle individual items on or off to adjust what gets masked.
              </p>
            </div>

            {/* Select All / Deselect All Controls */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={disabled || allSelected}
                icon={<CheckSquare className="w-3.5 h-3.5 text-[var(--text-accent)]" />}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                disabled={disabled || noneSelected}
                icon={<Square className="w-3.5 h-3.5" />}
              >
                Deselect All
              </Button>
            </div>
          </div>

          {/* List of Detected Items */}
          <div className="space-y-3">
            {items.map(item => {
              const isSelected = selectedIds.has(item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => !disabled && handleToggleItem(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[var(--bg-main)] border-[#159FB5]/40 ring-1 ring-[#159FB5]/20 shadow-xs'
                      : 'bg-[var(--bg-card-subtle)] border-[var(--border-card)] opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#0D9488] border-[#0D9488] dark:bg-[#22D3EE] dark:border-[#22D3EE] text-white dark:text-[#05121E]'
                          : 'border-[var(--border-card)] bg-[var(--bg-card)]'
                      }`}
                      aria-label={`Toggle masking for ${item.category}`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${categoryBadgeColors[item.category]}`}
                        >
                          {item.category}
                        </span>

                        <StatusBadge variant="neutral" size="sm">
                          {item.certainty}
                        </StatusBadge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                        <span className="text-[var(--text-muted)]">Matched:</span>
                        <code className="px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-card)] font-bold text-[var(--text-heading)] break-all">
                          {item.originalText}
                        </code>
                        <span className="text-[var(--text-muted)]">&rarr;</span>
                        <code className="px-2 py-0.5 rounded bg-[#22D3EE]/15 text-[var(--text-accent)] border border-[#22D3EE]/35 font-bold">
                          {item.suggestedReplacement}
                        </code>
                      </div>

                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                  </div>

                  <StatusBadge
                    variant={isSelected ? 'safe' : 'warning'}
                    size="sm"
                    className="shrink-0 self-end sm:self-center"
                  >
                    {isSelected ? 'Masking Active' : 'Keep Unmasked'}
                  </StatusBadge>
                </div>
              )
            })}
          </div>
        </Card>
      ) : (
        /* Reassuring zero-PII found banner */
        <Card className="p-6 sm:p-7 border border-[#22C55E]/30 bg-[#22C55E]/5">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#22C55E]/15 text-[#22C55E] shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-heading)]">
                No Common Sensitive Information Patterns Detected
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                ContextShield did not detect standard emails, international phone numbers, payment cards, identification numbers, or sensitive URL parameters.
              </p>
              <p className="text-xs text-[var(--text-muted)] pt-1">
                However, automated regex detection cannot reliably recognize informal personal names or custom codes. Please review your message below before proceeding.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Protected Message Preview & Manual Editing */}
      <Card className="p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-card)]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#22C55E]/15 text-[#22C55E]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-heading)]">
                Protected Message Preview
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {isManualEditing
                  ? 'Manual editing mode enabled: refine your masked text directly'
                  : 'Live rendered preview with your active masking selections applied'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isManualEditing ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRevertToAuto}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset to Auto
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleStartManualEdit}
                icon={<Edit3 className="w-3.5 h-3.5 text-[var(--text-accent)]" />}
              >
                Edit Protected Text
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyProtected}
              icon={<Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Text Preview / Edit View */}
        {isManualEditing ? (
          <div className="space-y-2">
            <label htmlFor="manual-protected-text" className="text-xs font-semibold text-[var(--text-muted)]">
              Manually redact or adjust protected message content:
            </label>
            <textarea
              id="manual-protected-text"
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              rows={6}
              className="w-full p-4 rounded-xl text-xs sm:text-sm bg-[var(--bg-main)] border border-[#159FB5] text-[var(--text-main)] font-mono focus:outline-none focus:ring-2 focus:ring-[#159FB5]/40 leading-relaxed resize-y"
            />
            <p className="text-[11px] text-[var(--text-muted)]">
              Manual edits only affect this current session and will be passed forward as the protected message.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap select-text break-words">
            {autoMaskedText}
          </div>
        )}
      </Card>

      {/* 5. Honest Privacy Disclaimer & Confirmation Actions */}
      <Card className="p-5 sm:p-6 bg-[var(--bg-card-subtle)] border border-[var(--border-card)] space-y-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-[var(--text-accent)] shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--text-muted)] leading-relaxed space-y-1">
            <p className="font-bold text-[var(--text-heading)]">
              Privacy &amp; Detection Limitations Notice
            </p>
            <p>
              Automated detection is performed strictly on your device using client-side regular expressions and heuristic checks. It does not provide 100% detection guarantees. Real personal names, street addresses, and non-standard identifiers cannot be reliably identified by regex alone.
            </p>
            <p>
              Original sensitive text is never sent across any network and is not written to localStorage or browser analytics.
            </p>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-card)]">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onBackToEdit}
            disabled={disabled}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Edit Input
          </Button>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleProceed}
            disabled={disabled || effectiveProtectedText.trim().length === 0}
            icon={<ShieldCheck className="w-5 h-5" />}
          >
            Confirm &amp; Proceed with Protected Message
          </Button>
        </div>
      </Card>
    </div>
  )
}
