import React, { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
  MessageSquare,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { MAX_MESSAGE_LENGTH } from './types'

export interface MessageInputCardProps {
  value: string
  onChange: (nextValue: string) => void
  onClear: () => void
  validationError: string | null
  onValidationMessage?: (message: string | null) => void
  disabled?: boolean
}

export const MessageInputCard: React.FC<MessageInputCardProps> = ({
  value,
  onChange,
  onClear,
  validationError,
  onValidationMessage,
  disabled = false,
}) => {
  const [clipboardFeedback, setClipboardFeedback] = useState<{
    type: 'success' | 'warning' | 'error'
    text: string
  } | null>(null)

  const charCount = value.length
  const isNearLimit = charCount >= MAX_MESSAGE_LENGTH * 0.9 && charCount < MAX_MESSAGE_LENGTH
  const isAtLimit = charCount >= MAX_MESSAGE_LENGTH
  const hasOnlyWhitespace = value.length > 0 && value.trim().length === 0

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value
    setClipboardFeedback(null)

    if (raw.length > MAX_MESSAGE_LENGTH) {
      onChange(raw.slice(0, MAX_MESSAGE_LENGTH))
      onValidationMessage?.(
        `Maximum length of ${MAX_MESSAGE_LENGTH.toLocaleString()} characters reached. Extra characters were trimmed.`
      )
    } else {
      onChange(raw)
      if (validationError) {
        onValidationMessage?.(null)
      }
    }
  }

  const handlePasteFromClipboard = async () => {
    setClipboardFeedback(null)

    if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
      setClipboardFeedback({
        type: 'error',
        text: 'Clipboard API is not supported in this browser context. Please use Ctrl+V or Cmd+V to paste.',
      })
      return
    }

    try {
      const clipText = await navigator.clipboard.readText()
      if (!clipText || clipText.trim().length === 0) {
        setClipboardFeedback({
          type: 'warning',
          text: 'Your clipboard is currently empty or does not contain text.',
        })
        return
      }

      const combined = value ? `${value}\n${clipText}` : clipText
      if (combined.length > MAX_MESSAGE_LENGTH) {
        onChange(combined.slice(0, MAX_MESSAGE_LENGTH))
        setClipboardFeedback({
          type: 'warning',
          text: `Pasted text was trimmed to fit the ${MAX_MESSAGE_LENGTH.toLocaleString()}-character limit.`,
        })
      } else {
        onChange(combined)
        onValidationMessage?.(null)
        setClipboardFeedback({
          type: 'success',
          text: 'Text pasted from clipboard.',
        })
      }
    } catch {
      setClipboardFeedback({
        type: 'error',
        text: 'Clipboard access was blocked by the browser. Please paste manually using Ctrl+V or Cmd+V.',
      })
    }
  }

  const handleClearClick = () => {
    setClipboardFeedback(null)
    onClear()
  }

  return (
    <Card className="p-5 sm:p-7">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-[var(--border-card)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#159FB5]/15 text-[var(--text-accent)]">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-heading)]">
              Suspicious Message Input
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Paste or type an SMS, chat message, or email body to inspect
            </p>
          </div>
        </div>

        {/* Paste & Clear Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePasteFromClipboard}
            disabled={disabled || isAtLimit}
            icon={<ClipboardPaste className="w-3.5 h-3.5 text-[var(--text-accent)]" />}
          >
            Paste
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearClick}
            disabled={disabled || value.length === 0}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Textarea Input Area */}
      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="scanner-message-input" className="sr-only">
            Suspicious message text
          </label>
          <textarea
            id="scanner-message-input"
            value={value}
            onChange={handleTextChange}
            disabled={disabled}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={7}
            placeholder="Paste or type a suspicious message here..."
            aria-invalid={!!validationError || hasOnlyWhitespace}
            aria-describedby="scanner-char-counter"
            className={`w-full p-4 rounded-xl text-xs sm:text-sm bg-[var(--bg-main)] border transition-all resize-y font-mono leading-relaxed text-[var(--text-main)] placeholder-[var(--text-muted)]/70 focus:outline-none focus:ring-2 ${
              validationError || hasOnlyWhitespace
                ? 'border-[#E07A5F] focus:ring-[#E07A5F]/30 focus:border-[#E07A5F]'
                : 'border-[var(--border-card)] focus:ring-[#159FB5]/40 focus:border-[#159FB5]'
            }`}
          />
        </div>

        {/* Live Character Counter & Helper Bar */}
        <div
          id="scanner-char-counter"
          className="flex flex-wrap items-center justify-between gap-2 text-xs"
        >
          <span className="text-[var(--text-muted)]">
            {charCount === 0
              ? 'Enter message text above to enable scanning.'
              : hasOnlyWhitespace
              ? 'Message cannot consist only of blank spaces.'
              : isAtLimit
              ? 'Maximum character limit reached (5,000).'
              : 'Ready for review.'}
          </span>

          <span
            className={`font-mono font-semibold px-2.5 py-0.5 rounded-md border ${
              isAtLimit
                ? 'bg-[#E07A5F]/15 text-[#E07A5F] border-[#E07A5F]/30'
                : isNearLimit
                ? 'bg-[#D7C4A8]/25 text-[#164E5A] dark:text-[#D7C4A8] border-[#D7C4A8]/40'
                : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border-[var(--border-card)]'
            }`}
          >
            {charCount.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()} characters
          </span>
        </div>

        {/* Helpful Validation & Clipboard Feedback Messages */}
        {(validationError || hasOnlyWhitespace) && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-[#E07A5F]/15 border border-[#E07A5F]/30 text-xs text-[#B8573D] dark:text-[#F3A58E]"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E07A5F]" />
            <span>
              {validationError ||
                'Message contains only whitespace. Please enter valid text to analyze.'}
            </span>
          </div>
        )}

        {clipboardFeedback && (
          <div
            role="status"
            className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs ${
              clipboardFeedback.type === 'success'
                ? 'bg-[#2E8B57]/12 border-[#2E8B57]/30 text-[#216740] dark:text-[#67D59A]'
                : clipboardFeedback.type === 'warning'
                ? 'bg-[#D7C4A8]/25 border-[#D7C4A8]/45 text-[var(--text-main)]'
                : 'bg-[#E07A5F]/15 border-[#E07A5F]/30 text-[#B8573D] dark:text-[#F3A58E]'
            }`}
          >
            {clipboardFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2E8B57]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E07A5F]" />
            )}
            <span>{clipboardFeedback.text}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
