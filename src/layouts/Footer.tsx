import React, { useState } from 'react'
import { ContextShieldLogo } from '@/components/common/ContextShieldLogo'
import { Modal } from '@/components/common/Modal'

export const Footer: React.FC = () => {
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false)
  const [termsModalOpen, setTermsModalOpen] = useState(false)

  return (
    <footer className="mt-auto border-t border-[var(--border-card)] bg-[var(--bg-footer)] py-6 px-6 text-xs text-[var(--text-muted)] transition-colors duration-250">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Tagline */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2">
            <ContextShieldLogo size="sm" />
            <span className="font-extrabold text-[var(--text-heading)]">
              Context<span className="text-[#00D9FF]">Shield</span>
            </span>
          </div>
          <span className="hidden sm:inline opacity-30">&bull;</span>
          <span>Privacy-First Hybrid AI Security Command</span>
        </div>

        {/* Right: Policy Links & Console Version */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-center">
          <button
            onClick={() => setPrivacyModalOpen(true)}
            className="hover:text-[#00D9FF] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60 rounded px-1"
          >
            Privacy Architecture
          </button>
          <span className="opacity-30">&bull;</span>
          <button
            onClick={() => setTermsModalOpen(true)}
            className="hover:text-[#00D9FF] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60 rounded px-1"
          >
            Terms of Use
          </button>
          <span className="opacity-30">&bull;</span>
          <span className="px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] text-[11px] font-mono text-[var(--text-main)] shadow-xs">
            Defense Console v1.0.0
          </span>
        </div>
      </div>

      {/* Privacy Principles Modal */}
      <Modal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        title="ContextShield Privacy Principles"
      >
        <div className="space-y-4 text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
          <div className="p-4 rounded-2xl bg-[#087BFF]/10 border border-[#087BFF]/30">
            <p className="font-bold text-[#087BFF] dark:text-[#00D9FF]">
              Guarantee 1: Zero Personal Identifiable Information (PII) Leakage
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              Every message is automatically stripped of phone numbers, national identification, email addresses, credit cards, and sensitive tokens locally in browser memory before any external model analysis.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#00D6B2]/10 border border-[#00D6B2]/30">
            <p className="font-bold text-[#00A88B] dark:text-[#00D6B2]">
              Guarantee 2: Client-Edge Heuristics &amp; Explicit Cloud Consent
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              Deterministic rule checks execute 100% offline with zero network requests. Cloud AI operates solely on client-masked text after explicit user consent.
            </p>
          </div>
        </div>
      </Modal>

      {/* Terms Modal */}
      <Modal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        title="Terms of Service & Disclaimer"
      >
        <div className="space-y-3 text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
          <p>
            ContextShield is an assistive security tool designed to highlight risk indicators and social engineering tactics in incoming communications.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Security risk scores and threat classifications are heuristic estimations provided to empower informed digital decisions. Users should exercise independent judgment when interacting with unknown senders or handling sensitive financial transactions.
          </p>
        </div>
      </Modal>
    </footer>
  )
}
