import React from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  EyeOff,
  Shield,
  ShieldAlert,
  User,
} from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import type { ScanResult } from '@/types'

export interface ScanDetailModalProps {
  scan: ScanResult | null
  onClose: () => void
}

export const ScanDetailModal: React.FC<ScanDetailModalProps> = ({ scan, onClose }) => {
  if (!scan) return null

  return (
    <Modal
      isOpen={!!scan}
      onClose={onClose}
      title="Security Scan Breakdown"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Top Header Card with Status & Threat Score */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl ${
                scan.status === 'safe'
                  ? 'bg-[#2E8B57]/15 text-[#2E8B57]'
                  : scan.status === 'suspicious'
                  ? 'bg-[#E07A5F]/15 text-[#E07A5F]'
                  : 'bg-[#D9383A]/15 text-[#D9383A]'
              }`}
            >
              {scan.status === 'safe' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : scan.status === 'suspicious' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge status={scan.status}>
                  {scan.status === 'safe'
                    ? 'Safe Message'
                    : scan.status === 'suspicious'
                    ? 'Suspicious Warning'
                    : 'High-Risk Threat'}
                </Badge>
                {scan.isDemo && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#A6C5C1]/20 text-[var(--text-muted)] font-mono">
                    DEMO DATA
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {scan.timestamp} &bull; {scan.category}
              </p>
            </div>
          </div>

          {/* Threat Score Pill */}
          <div className="text-right sm:border-l sm:border-[var(--border-card)] sm:pl-6">
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
              Threat Risk Score
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-2xl font-black ${
                  scan.status === 'safe'
                    ? 'text-[#2E8B57]'
                    : scan.status === 'suspicious'
                    ? 'text-[#E07A5F]'
                    : 'text-[#D9383A]'
                }`}
              >
                {scan.threatScore}
              </span>
              <span className="text-xs text-[var(--text-muted)]">/100</span>
            </div>
          </div>
        </div>

        {/* Message Content with Sender */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--text-accent)]" />
              {scan.sender}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              ID: {scan.id}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-card)] text-xs sm:text-sm text-[var(--text-main)] leading-relaxed whitespace-pre-wrap font-mono select-text">
            {scan.messageText}
          </div>
        </div>

        {/* Security Summary & Signals */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-[#159FB5]/10 border border-[#159FB5]/25">
            <p className="text-xs font-bold text-[var(--text-accent)] mb-1">
              Analysis Evaluation
            </p>
            <p className="text-xs text-[var(--text-main)] leading-relaxed">
              {scan.summary}
            </p>
          </div>

          {/* Detected Signals List */}
          <div>
            <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[var(--text-accent)]" />
              Detected Risk Factors
            </h4>
            <ul className="space-y-1.5">
              {scan.reasons.map((reason, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-main)] p-2.5 rounded-lg border border-[var(--border-card)]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#159FB5] shrink-0 mt-1.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Locally Redacted PII list */}
        {scan.piiItems && scan.piiItems.length > 0 && (
          <div className="p-3.5 rounded-xl bg-[#A6C5C1]/15 border border-[#A6C5C1]/30">
            <div className="flex items-center gap-2 mb-2 text-[var(--text-heading)]">
              <EyeOff className="w-4 h-4 text-[var(--text-accent)]" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Locally Masked PII Items ({scan.piiItems.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {scan.piiItems.map((pii, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-[var(--bg-main)] border border-[var(--border-card)] text-[var(--text-accent)]"
                >
                  <span className="opacity-70 text-[var(--text-muted)]">{pii.type}:</span>
                  <span className="font-bold">{pii.masked}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Engine & Disclaimer */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[var(--border-card)] gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Cpu className="w-4 h-4 text-[var(--text-accent)]" />
            <span>{scan.analysisMethod} (Privacy-scrubbed)</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
