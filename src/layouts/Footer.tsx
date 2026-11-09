import React, { useState } from 'react'
import { Modal } from '@/components/common/Modal'

export const Footer: React.FC = () => {
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false)
  const [termsModalOpen, setTermsModalOpen] = useState(false)

  return (
    <footer className="mt-auto border-t border-[var(--border-card)] bg-[var(--bg-footer)] py-6 px-6 text-xs text-[var(--text-muted)] transition-colors duration-250">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Disclaimer */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
          <span className="font-bold text-[#164E5A] dark:text-[#35C6D9]">ContextShield</span>
          <span className="hidden sm:inline opacity-40">&bull;</span>
          <span>ContextShield — A Privacy-First Hybrid AI Security Assistant.</span>
        </div>

        {/* Right: Policy Links & Version */}
        <div className="flex items-center gap-4 text-center">
          <button
            onClick={() => setPrivacyModalOpen(true)}
            className="hover:text-[var(--text-accent)] transition-colors underline-offset-4 hover:underline cursor-pointer"
          >
            Privacy Architecture
          </button>
          <span className="opacity-40">&bull;</span>
          <button
            onClick={() => setTermsModalOpen(true)}
            className="hover:text-[var(--text-accent)] transition-colors underline-offset-4 hover:underline cursor-pointer"
          >
            Terms of Use
          </button>
          <span className="opacity-40">&bull;</span>
          <span className="px-2 py-0.5 rounded-md bg-[#A6C5C1]/20 border border-[#A6C5C1]/30 text-[10px] font-mono text-[var(--text-main)]">
            v0.1.0-alpha · Hackathon Solo Setup
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
          <div className="p-3.5 rounded-xl bg-[#159FB5]/10 border border-[#159FB5]/30">
            <p className="font-bold text-[var(--text-accent)]">
              Guarantee 1: Zero Personal Identifiable Information (PII) Leakage
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Any scanned message or document is stripped of telephone numbers, NRC cards, bank account numbers, and personal names locally before any inference occurs.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#2E8B57]/10 border border-[#2E8B57]/30">
            <p className="font-bold text-[#216740] dark:text-[#67D59A]">
              Guarantee 2: Local Client Storage Only
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Your scan history remains solely on your local browser cache. You can purge or export all records at any time from the Privacy Center.
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
