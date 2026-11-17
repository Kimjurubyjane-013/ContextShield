import React, { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Modal } from '@/components/common/Modal'
import { ScanDetailModal } from '@/components/common/ScanDetailModal'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyIllustration } from '@/components/illustrations/EmptyIllustration'
import { useNavigation } from '@/context/NavigationContext'
import { useSecurity } from '@/context/SecurityContext'
import type { ScanResult, ScanStatus } from '@/types'

export const HistoryPage: React.FC = () => {
  const { scans, clearHistory } = useSecurity()
  const { searchQuery, setSearchQuery } = useNavigation()
  const [statusFilter, setStatusFilter] = useState<'all' | ScanStatus>('all')
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null)
  const [clearModalOpen, setClearModalOpen] = useState(false)

  const filteredScans = useMemo(() => {
    return scans.filter(scan => {
      const matchesStatus = statusFilter === 'all' || scan.status === statusFilter
      const query = searchQuery.toLowerCase().trim()
      const matchesQuery =
        !query ||
        scan.messageText.toLowerCase().includes(query) ||
        scan.sender.toLowerCase().includes(query) ||
        scan.category.toLowerCase().includes(query)
      return matchesStatus && matchesQuery
    })
  }, [scans, statusFilter, searchQuery])

  const counts = useMemo(() => {
    return {
      all: scans.length,
      safe: scans.filter(s => s.status === 'safe').length,
      suspicious: scans.filter(s => s.status === 'suspicious').length,
      threat: scans.filter(s => s.status === 'threat').length,
    }
  }, [scans])

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Page Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-[var(--shadow-card)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors duration-250">
        <div className="space-y-2 max-w-2xl">
          <StatusBadge
            variant="info"
            size="md"
            icon={<FileText className="w-3.5 h-3.5" />}
          >
            Audit Trail
          </StatusBadge>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] tracking-tight">
            Security Reports &amp; History
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            Review all analyzed communications, inspect detected threat indicators, and manage your audit log.
          </p>
        </div>

        {/* Clear Action */}
        {scans.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setClearModalOpen(true)}
            icon={<Trash2 className="w-4 h-4 text-[#EF4444]" />}
          >
            Clear All History
          </Button>
        )}
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center p-1.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] overflow-x-auto shadow-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#087BFF] text-white shadow-xs border border-[#00D9FF]/40'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            All Scans ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('safe')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'safe'
                ? 'bg-[#00D6B2] text-[#030B1B] font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[#00D6B2]'
            }`}
          >
            Safe ({counts.safe})
          </button>
          <button
            onClick={() => setStatusFilter('suspicious')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'suspicious'
                ? 'bg-[#F59E0B] text-[#030B1B] font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[#F59E0B]'
            }`}
          >
            Suspicious ({counts.suspicious})
          </button>
          <button
            onClick={() => setStatusFilter('threat')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'threat'
                ? 'bg-[#EF4444] text-white font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[#EF4444]'
            }`}
          >
            Threats ({counts.threat})
          </button>
        </div>

        {/* Local Search Filter */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter scans by sender, content, or risk..."
            className="w-full pl-9 pr-3 py-2 rounded-2xl text-xs bg-[var(--bg-input)] border border-[var(--border-card)] text-[var(--text-main)] placeholder-[var(--text-muted)]/70 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/40"
          />
        </div>
      </div>

      {/* Scans List or Empty State */}
      {filteredScans.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4">
          <EmptyIllustration />
          <div>
            <h3 className="text-base font-bold text-[var(--text-heading)]">
              No Scans Found
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1">
              {searchQuery
                ? `No scans matched the query "${searchQuery}". Try clearing search filters.`
                : 'No scan activity recorded yet.'}
            </p>
          </div>
          {searchQuery && (
            <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
              Clear Filter
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredScans.map(item => (
            <Card
              key={item.id}
              variant="interactive"
              onClick={() => setSelectedScan(item)}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div
                  className={`p-2.5 rounded-2xl shrink-0 mt-0.5 sm:mt-0 ${
                    item.status === 'safe'
                      ? 'bg-[#00D6B2]/15 text-[#00D6B2]'
                      : item.status === 'suspicious'
                      ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                      : 'bg-[#EF4444]/15 text-[#EF4444]'
                  }`}
                >
                  {item.status === 'safe' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : item.status === 'suspicious' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge status={item.status} size="sm">
                      {item.status === 'safe'
                        ? 'Safe Message'
                        : item.status === 'suspicious'
                        ? 'Suspicious Warning'
                        : 'High-Risk Threat'}
                    </Badge>
                    <span className="text-xs font-bold text-[var(--text-heading)] truncate max-w-[200px]">
                      {item.sender}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border border-[var(--border-card)]">
                      {item.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border border-[var(--border-card)]">
                      {item.analysisMethod}
                    </span>
                    {item.redactedPiiCount > 0 && (
                      <span className="text-[10px] font-semibold text-[#00D9FF]">
                        {item.redactedPiiCount} PII Redacted
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Threat Score & Arrow */}
              <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 sm:border-l border-[var(--border-card)] pt-3 sm:pt-0 sm:pl-5">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">
                    Threat Score
                  </span>
                  <span
                    className={`text-xl font-black ${
                      item.status === 'safe'
                        ? 'text-[#00D6B2]'
                        : item.status === 'suspicious'
                        ? 'text-[#F59E0B]'
                        : 'text-[#EF4444]'
                    }`}
                  >
                    {item.threatScore}/100
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[var(--bg-card-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[#00D9FF] transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        title="Clear Security Scan History"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            Are you sure you want to delete all recorded scan history? This action cannot be undone. All local threat logs will be purged from browser memory.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-card)]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                clearHistory()
                setClearModalOpen(false)
              }}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Clear All Data
            </Button>
          </div>
        </div>
      </Modal>

      {/* Scan Detail Modal */}
      <ScanDetailModal
        scan={selectedScan}
        onClose={() => setSelectedScan(null)}
      />
    </div>
  )
}
