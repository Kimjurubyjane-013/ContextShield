import React, { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Lock,
  Shield,
  X,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useNavigation } from '@/context/NavigationContext'

interface CloudConsentModalProps {
  isOpen: boolean
  protectedMessage: string
  onClose: () => void
  onConfirmConsent: () => void
}

export const CloudConsentModal: React.FC<CloudConsentModalProps> = ({
  isOpen,
  protectedMessage,
  onClose,
  onConfirmConsent,
}) => {
  const { setCurrentPage } = useNavigation()
  const [isChecked, setIsChecked] = useState(false)

  if (!isOpen) return null

  const handleCancel = () => {
    setIsChecked(false)
    onClose()
  }

  const handleConfirm = () => {
    if (!isChecked) return
    onConfirmConsent()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-consent-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[var(--border-card)] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#159FB5]/15 text-[var(--text-accent)] shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="cloud-consent-title"
                className="text-lg sm:text-xl font-bold text-[var(--text-heading)]"
              >
                Enhanced Cloud Analysis
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                Explicit consent required before transmitting data
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-subtle)] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Official Description */}
          <p className="text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
            Cloud AI can provide deeper context analysis. Your privacy-protected message will be sent to Google&apos;s AI service for processing.
          </p>

          {/* Exact Protected Text Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#2E8B57]" />
                Exact Protected Text to be Transmitted:
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                {protectedMessage.length.toLocaleString()} characters
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs font-mono text-[var(--text-main)] leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap break-words select-text">
              {protectedMessage}
            </div>
          </div>

          {/* List of information being shared & boundaries */}
          <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2.5">
            <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
              Information Boundary Disclosure:
            </h4>
            <ul className="text-xs text-[var(--text-muted)] space-y-1.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E8B57] shrink-0 mt-0.5" />
                <span>Only the redacted message shown above will be transmitted over TLS.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E8B57] shrink-0 mt-0.5" />
                <span>Original unmasked emails, phone numbers, cards, and IDs remain in local browser memory.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E8B57] shrink-0 mt-0.5" />
                <span>Uploaded screenshots or image files are never uploaded or transmitted.</span>
              </li>
            </ul>
          </div>

          {/* Warning banner */}
          <div className="p-4 rounded-xl bg-[#E07A5F]/10 border border-[#E07A5F]/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#E07A5F] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-bold text-[#B8573D] dark:text-[#F3A58E]">
                Privacy Caution
              </p>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Automated regex masking reduces exposure of standard PII formats, but cannot detect every possible sensitive detail (such as obscure names or private conversational context). Please review the preview carefully.
              </p>
            </div>
          </div>

          {/* Link to Privacy Policy */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[var(--text-muted)]">
              Questions regarding data handling?
            </span>
            <button
              type="button"
              onClick={() => {
                onClose()
                setCurrentPage('privacy')
              }}
              className="text-[var(--text-accent)] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Privacy Policy</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Explicit Unchecked Consent Checkbox */}
          <div className="pt-3 border-t border-[var(--border-card)]">
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[#159FB5]/10 border border-[var(--border-card)] transition-colors select-none">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={e => setIsChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#159FB5] focus:ring-[#159FB5] accent-[#159FB5] cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-semibold text-[var(--text-heading)] leading-snug">
                I understand that my privacy-protected message will be sent to Google&apos;s AI service for additional analysis, and I explicitly agree to this processing.
              </span>
            </label>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-6 pt-4 border-t border-[var(--border-card)] flex flex-col sm:flex-row items-center justify-end gap-3 bg-[var(--bg-card)]">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!isChecked}
            onClick={handleConfirm}
            className="w-full sm:w-auto"
            icon={<Shield className="w-4 h-4" />}
          >
            Continue with Cloud Analysis
          </Button>
        </div>
      </div>
    </div>
  )
}
