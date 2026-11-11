import React, { useState } from 'react'
import { Modal } from '@/components/common/Modal'

export const Footer: React.FC = () => {
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false)
  const [termsModalOpen, setTermsModalOpen] = useState(false)

  return (
    <footer className="mt-auto border-t border-[var(--border-card)] bg-[var(--bg-footer)] py-5 px-6 text-xs text-[var(--text-muted)] transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Disclaimer */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
          <span className="font-bold text-[#0D5663] dark:text-[#22D3EE]">ContextShield</span>
          <span className="hidden sm:inline opacity-40">&bull;</span>
          <span>Privacy-First Hybrid AI Security Console</span>
        </div>

        {/* Right: Policy Links & Version */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-center">
          <button
            onClick={() => setPrivacyModalOpen(true)}
            className="hover:text-[var(--text-accent)] transition-colors underline-offset-4 hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60 rounded px-1"
          >
            Privacy Architecture
          </button>
          <span className="opacity-40">&bull;</span>
          <button
            onClick={() => setTermsModalOpen(true)}
            className="hover:text-[var(--text-accent)] transition-colors underline-offset-4 hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/60 rounded px-1"
          >
            Terms of Use
          </button>
          <span className="opacity-40">&bull;</span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#0D5663]/15 dark:bg-[#0B2735] border border-[var(--border-card)] text-[10px] font-mono text-[var(--text-main)]">
            Defense Console v1.0
          </span>
        </div>
      </div>

      {/* Privacy Modal */}
      <Modal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        title="ContextShield Privacy Principles"
      >
        <div className="space-y-4 text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
          <div className="p-3.5 rounded-xl bg-[#0D5663]/12 border border-[#22D3EE]/30">
            <p className="font-bold text-[#0D5663] dark:text-[#22D3EE]">
              Guarantee 1: Zero Personal Identifiable Information (PII) Leakage
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Any scanned message is stripped of phone numbers, national IDs, emails, and account identifiers locally before external analysis.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#22C55E]/12 border border-[#22C55E]/30">
            <p className="font-bold text-[#15803D] dark:text-[#4ADE80]">
              Guarantee 2: Local Client Storage Only
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Your scan history remains in your local browser cache. You can purge or export all redacted records at any time from Privacy &amp; Data.
            </p>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Developed specifically to combat emerging social engineering, smishing, and financial fraud campaigns.
          </p>
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
