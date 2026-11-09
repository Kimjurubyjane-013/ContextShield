import React, { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  History as HistoryIcon,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Modal } from '@/components/common/Modal'
import { ScanDetailModal } from '@/components/common/ScanDetailModal'
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
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-[var(--shadow-card)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors duration-250">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#159FB5]/10 text-[var(--text-accent)] text-xs font-semibold">
            <HistoryIcon className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] tracking-tight">
            Scan History &amp; Security Audit
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
            icon={<Trash2 className="w-4 h-4 text-[#E07A5F]" />}
          >
            Clear All History
          </Button>
        )}
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#159FB5] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            All Scans ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('safe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'safe'
                ? 'bg-[#2E8B57] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[#2E8B57]'
            }`}
          >
            Safe ({counts.safe})
          </button>
          <button
            onClick={() => setStatusFilter('suspicious')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'suspicious'
                ? 'bg-[#E07A5F] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[#E07A5F]'
            }`}
          >
            Suspicious ({counts.suspicious})
          </button>
          <button
            onClick={() => setStatusFilter('threat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'threat'
                ? 'bg-[#D9383A] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[#D9383A]'
            }`}
          >
            Threats ({counts.threat})
          </button>
        </div>

        {/* Local Search Filter */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter scans by sender, content, or risk..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-main)] placeholder-[var(--text-muted)]/70 focus:outline-none focus:ring-2 focus:ring-[#159FB5]/40"
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
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 sm:mt-0 ${
                    item.status === 'safe'
                      ? 'bg-[#2E8B57]/15 text-[#2E8B57]'
                      : item.status === 'suspicious'
                      ? 'bg-[#E07A5F]/15 text-[#E07A5F]'
                      : 'bg-[#D9383A]/15 text-[#D9383A]'
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
                    <span className="text-[11px] text-[var(--text-muted)]">
                      &bull; {item.timestamp}
                    </span>
                    {item.isDemo && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#A6C5C1]/20 text-[var(--text-muted)] font-mono">
                        DEMO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 font-mono">
                    {item.messageText}
                  </p>
                </div>
              </div>

              {/* Threat Score and Arrow */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:border-l sm:border-[var(--border-card)] sm:pl-4">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                    Score
                  </span>
                  <span
                    className={`text-sm font-black ${
                      item.status === 'safe'
                        ? 'text-[#2E8B57]'
                        : item.status === 'suspicious'
                        ? 'text-[#E07A5F]'
                        : 'text-[#D9383A]'
                    }`}
                  >
                    {item.threatScore}/100
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        title="Clear Scan History"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-[var(--text-main)]">
            Are you sure you want to clear your local scan history?
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setClearModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                clearHistory()
                setClearModalOpen(false)
              }}
            >
              Confirm Clear
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
