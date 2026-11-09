import React from 'react'
import {
  CheckCircle2,
  GitCompare,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { compareAnalyses } from './analysisUtils'
import type { AnalysisRecord } from './types'

interface HybridComparisonCardProps {
  onDeviceAnalysis: AnalysisRecord | null
  cloudAnalysis: AnalysisRecord | null
}

export const HybridComparisonCard: React.FC<HybridComparisonCardProps> = ({
  onDeviceAnalysis,
  cloudAnalysis,
}) => {
  const comparison = compareAnalyses(onDeviceAnalysis, cloudAnalysis)

  if (!comparison) return null

  const isBothCompleted = Boolean(onDeviceAnalysis && cloudAnalysis)
  const isCloudOnly = Boolean(!onDeviceAnalysis && cloudAnalysis)
  const isLocalRules = onDeviceAnalysis?.actualInferenceSource === 'local_rules'

  return (
    <Card className="p-6 sm:p-8 border-2 border-[#159FB5]/40 bg-[var(--bg-card)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-card)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#159FB5]/15 text-[var(--text-accent)] shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-heading)]">
                Hybrid Intelligence Synthesis
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#159FB5]/20 text-[var(--text-accent)]">
                {isBothCompleted
                  ? isLocalRules
                    ? 'Cloud AI + Local Rules'
                    : 'Dual AI Model Consensus'
                  : isCloudOnly
                  ? 'Cloud-Only Evaluation'
                  : isLocalRules
                  ? 'Local Rule-Based Evaluation'
                  : 'On-Device AI Evaluation'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
              {isBothCompleted
                ? isLocalRules
                  ? 'Cross-paradigm reconciliation of deterministic rules and Gemini Cloud semantic AI'
                  : 'Side-by-side reconciliation of on-device Gemini Nano and cloud security signals'
                : 'Security signals from the active evaluation engine'}
            </p>
          </div>
        </div>

        {/* Alignment status */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
            comparison.riskAlignment === 'AGREE'
              ? 'bg-[#2E8B57]/15 border-[#2E8B57]/30 text-[#2E8B57] dark:text-[#67D59A]'
              : comparison.riskAlignment === 'DIVERGE'
              ? 'bg-[#E07A5F]/15 border-[#E07A5F]/30 text-[#E07A5F]'
              : 'bg-[#A6C5C1]/20 border-[var(--border-card)] text-[var(--text-muted)]'
          }`}
        >
          {comparison.riskAlignment === 'AGREE' ? (
            <ShieldCheck className="w-4 h-4" />
          ) : comparison.riskAlignment === 'DIVERGE' ? (
            <ShieldAlert className="w-4 h-4" />
          ) : (
            <GitCompare className="w-4 h-4" />
          )}
          <span>
            {comparison.riskAlignment === 'AGREE'
              ? isLocalRules
                ? 'Heuristic & AI Agreement'
                : 'Consensus Reached'
              : comparison.riskAlignment === 'DIVERGE'
              ? isLocalRules
                ? 'Engine Divergence'
                : 'Model Divergence'
              : isCloudOnly
              ? 'Cloud-Only Evaluation'
              : isLocalRules
              ? 'Local Rule-Based Evaluation'
              : 'On-Device AI Evaluation'}
          </span>
        </div>
      </div>

      {/* Alignment Narrative */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
        <span className="font-bold text-[var(--text-heading)]">Assessment Comparison: </span>
        {comparison.alignmentNote}
      </div>

      {/* Comparison Grid */}
      {isBothCompleted ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Corroborated Common Threat Indicators */}
          <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2">
            <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2E8B57]" />
              Corroborated Indicators ({comparison.commonIndicators.length})
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              Corroborated by both on-device and cloud security evaluation:
            </p>
            {comparison.commonIndicators.length > 0 ? (
              <ul className="space-y-1.5 pt-1">
                {comparison.commonIndicators.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-main)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic pt-1">
                No direct semantic overlap found between individual indicators.
              </p>
            )}
          </div>

          {/* Distinct Model Findings */}
          <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2">
            <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#159FB5]" />
              Distinct Model Findings ({comparison.uniqueCloudFindings.length + comparison.uniqueOnDeviceFindings.length})
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              Single-source insights unique to one evaluation engine:
            </p>
            <ul className="space-y-1.5 pt-1">
              {comparison.uniqueCloudFindings.map((item, idx) => (
                <li
                  key={`cloud-${idx}`}
                  className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-main)] flex items-start gap-1.5"
                >
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#159FB5]/15 text-[var(--text-accent)] shrink-0 mt-0.5">
                    Cloud
                  </span>
                  <span>{item}</span>
                </li>
              ))}
              {comparison.uniqueOnDeviceFindings.map((item, idx) => (
                <li
                  key={`od-${idx}`}
                  className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-main)] flex items-start gap-1.5"
                >
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                      isLocalRules
                        ? 'bg-[#E07A5F]/15 text-[#B8573D] dark:text-[#F3A58E]'
                        : 'bg-[#2E8B57]/15 text-[#2E8B57] dark:text-[#67D59A]'
                    }`}
                  >
                    {isLocalRules ? 'Local Rules' : 'Gemini Nano'}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        /* Single Engine Evaluation View: Clear separation without claiming common indicators */
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inactive Engine Status Panel */}
          <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2">
            <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
              <GitCompare className="w-4 h-4 text-[var(--text-muted)]" />
              {cloudAnalysis ? 'On-Device Engine Status' : 'Cloud Engine Status'}
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              {cloudAnalysis
                ? 'Chrome Prompt API (Gemini Nano) local inference was not executed or is unavailable on this device.'
                : 'Gemini Cloud AI requires explicit user consent before data transmission.'}
            </p>
            <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-muted)] space-y-1">
              <span className="font-bold text-[var(--text-heading)] block">
                {cloudAnalysis ? 'No Local Corroboration' : 'Cloud Consent Required'}
              </span>
              <p>
                {cloudAnalysis
                  ? 'Dual-model comparison is inactive. Threat indicators below reflect deep contextual Cloud AI inference only.'
                  : 'To cross-examine with Gemini Cloud AI, grant explicit privacy consent in the Enhanced Cloud card.'}
              </p>
            </div>
          </div>

          {/* Active Engine Findings Panel */}
          <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2">
            <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#159FB5]" />
              {cloudAnalysis ? 'Cloud AI Findings' : 'On-Device AI Findings'} (
              {cloudAnalysis
                ? comparison.uniqueCloudFindings.length
                : comparison.uniqueOnDeviceFindings.length}
              )
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              {cloudAnalysis
                ? 'Deep contextual threat patterns identified by Gemini Cloud:'
                : 'Local heuristic patterns identified on-device:'}
            </p>
            <ul className="space-y-1.5 pt-1">
              {(cloudAnalysis
                ? comparison.uniqueCloudFindings
                : comparison.uniqueOnDeviceFindings
              ).map((item, idx) => (
                <li
                  key={idx}
                  className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-main)] flex items-start gap-1.5"
                >
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#159FB5]/15 text-[var(--text-accent)] shrink-0 mt-0.5">
                    {cloudAnalysis ? 'Cloud-Only' : 'On-Device'}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Combined Actionable Recommendations */}
      {comparison.combinedRecommendations.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[var(--border-card)] space-y-2">
          <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
            Consolidated Safety Directives:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {comparison.combinedRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#2E8B57]/10 border border-[#2E8B57]/20 flex items-start gap-2.5 text-xs text-[var(--text-heading)] font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 text-[#2E8B57] shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
