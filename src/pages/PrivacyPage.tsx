import React, { useState } from 'react'
import {
  CheckCircle2,
  Database,
  Download,
  EyeOff,
  HardDrive,
  Lock,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Modal } from '@/components/common/Modal'
import { useSecurity } from '@/context/SecurityContext'

export const PrivacyPage: React.FC = () => {
  const { scans, clearHistory, stats } = useSecurity()
  const [purgeModalOpen, setPurgeModalOpen] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scans, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `contextshield-audit-log-${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    setDownloadSuccess(true)
    setTimeout(() => setDownloadSuccess(false), 3000)
  }

  const handleConfirmPurge = () => {
    clearHistory()
    setPurgeModalOpen(false)
  }

  const architectureSteps = [
    {
      step: '1. Ingestion & Boundary',
      title: 'Incoming Message / Screenshot',
      desc: 'Raw text or image bytes enter strictly within browser sandbox memory.',
      icon: HardDrive,
    },
    {
      step: '2. On-Device Scrubbing',
      title: 'Local Heuristic Redaction',
      desc: 'Regex and tokenizers mask phone numbers, account tokens, and personal names.',
      icon: EyeOff,
    },
    {
      step: '3. Hybrid Firewall',
      title: 'Zero-PII Isolation',
      desc: 'Only anonymized intent structures are allowed to pass towards AI reasoning.',
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Privacy Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-[var(--shadow-card)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors duration-250">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2E8B57]/15 text-[#2E8B57] dark:text-[#67D59A] text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Zero Cloud Leakage Verified</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] tracking-tight">
            Zero-Knowledge Privacy Vault
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            ContextShield is architected from the ground up to never send unmasked personal identifiable information (PII) to cloud servers.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            icon={<Download className="w-4 h-4 text-[var(--text-accent)]" />}
          >
            {downloadSuccess ? 'Downloaded!' : 'Export Audit Log (JSON)'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setPurgeModalOpen(true)}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Purge Local History
          </Button>
        </div>
      </div>

      {/* Zero-Knowledge Architecture Flow */}
      <Card className="p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[var(--text-heading)]">
            How the Privacy Boundary Protects You
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Data lifecycle visualization from device capture to sanitized inspection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {architectureSteps.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-[#164E5A] text-[#35C6D9]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-bold">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-heading)] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[var(--border-card)] flex items-center gap-1.5 text-[11px] font-semibold text-[#2E8B57]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enforced On-Device</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Redaction Rules & Vault Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Redaction Rules */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-[#159FB5]/15 text-[var(--text-accent)]">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-heading)]">
                Active Heuristic Redaction Rules
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Active automatic client-side filters
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { rule: 'International & Regional Phone Numbers', pattern: '(+95 | 09)xxxxxxxxx -> Masked' },
              { rule: 'Financial Banking / Account References', pattern: 'KBZPay, WavePay, AYA, CB Account tokens -> Redacted' },
              { rule: 'One-Time Passcodes (OTP)', pattern: '4-8 digit numeric credentials -> Masked' },
              { rule: 'Personal Identifying Names & ID References', pattern: 'Citizen ID format & contact handles -> Sanitized' },
            ].map((r, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-heading)] mb-1">
                  <span>{r.rule}</span>
                  <Badge status="safe" size="sm">Active</Badge>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">
                  {r.pattern}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Local Storage Vault Status */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-[#164E5A] text-[#35C6D9]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-heading)]">
                  Local Storage Vault
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Indexed browser sandbox diagnostics
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-[var(--text-muted)]">Stored Scan Records</span>
                <span className="font-bold text-[var(--text-heading)]">{scans.length} items</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-[var(--text-muted)]">Cumulative PII Tokens Scrubbed</span>
                <span className="font-bold text-[var(--text-accent)]">{stats.piiProtected} tokens</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-[var(--text-muted)]">Remote Tracking / Analytics Cookies</span>
                <span className="font-bold text-[#2E8B57]">0 (Disabled)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-[var(--text-muted)]">Storage Medium</span>
                <span className="font-mono text-[var(--text-heading)]">localStorage (Local Host)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-[var(--border-card)] text-xs text-[var(--text-muted)]">
            All local data can be purged instantly with zero remnants left on the disk.
          </div>
        </Card>
      </div>

      {/* Purge Confirmation Modal */}
      <Modal
        isOpen={purgeModalOpen}
        onClose={() => setPurgeModalOpen(false)}
        title="Confirm Purge Local Records"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
            Are you sure you want to permanently delete all scan records and security history from your local browser vault?
          </p>
          <div className="p-3 rounded-xl bg-[#E07A5F]/15 border border-[#E07A5F]/30 text-xs text-[#B8573D] dark:text-[#F3A58E]">
            This action cannot be undone. All demo and user-scanned records will be erased.
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setPurgeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmPurge}>
              Purge All History
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
