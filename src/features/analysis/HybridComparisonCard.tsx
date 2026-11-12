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
import { StatusBadge } from '@/components/common/StatusBadge'
import { compareAnalyses, getCorroborationPresentation } from './analysisUtils'
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

  const isLocalRules = onDeviceAnalysis?.actualInferenceSource === 'local_rules'
  const isActualOnDevice = onDeviceAnalysis?.actualInferenceSource === 'on_device'
  const effectiveOnDevice = isLocalRules || isActualOnDevice ? onDeviceAnalysis : null
  const effectiveCloud = cloudAnalysis?.actualInferenceSource === 'in_cloud' ? cloudAnalysis : null
  const corroboration = getCorroborationPresentation(effectiveOnDevice, effectiveCloud)
  const isBothCompleted = corroboration.hasValidCorroborationPair
  const isCloudOnly = Boolean(!effectiveOnDevice && effectiveCloud)

  return (
    <Card className="p-5 sm:p-6 border border-[#22D3EE]/35 bg-[var(--bg-card)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-card)]">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#0D5663]/15 dark:bg-[#0D5663]/45 text-[#0D5663] dark:text-[#22D3EE] border border-[#22D3EE]/25 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-heading)]">
                Hybrid Intelligence Synthesis
              </h2>
              <StatusBadge variant="ai" size="sm">
                {isBothCompleted
                  ? isLocalRules
                    ? 'Cloud AI + Local Rules'
                    : 'Dual AI Consensus'
                  : isCloudOnly
                  ? 'Cloud-Only Evaluation'
                  : isLocalRules
                  ? 'Local Rule-Based'
                  : 'On-Device AI'}
              </StatusBadge>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              {isBothCompleted
                ? isLocalRules
                  ? 'Cross-paradigm reconciliation of deterministic rules and Gemini Cloud semantic AI'
                  : 'Side-by-side reconciliation of on-device Gemini Nano and cloud security signals'
                : 'Security signals from the active evaluation engine'}
            </p>
          </div>
        </div>

        {/* Alignment status */}
        <StatusBadge
          variant={
            comparison.riskAlignment === 'AGREE'
              ? 'safe'
              : comparison.riskAlignment === 'DIVERGE'
              ? 'warning'
              : 'neutral'
          }
          icon={
            comparison.riskAlignment === 'AGREE' ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : comparison.riskAlignment === 'DIVERGE' ? (
              <ShieldAlert className="w-3.5 h-3.5" />
            ) : (
              <GitCompare className="w-3.5 h-3.5" />
            )
          }
        >
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
        </StatusBadge>
      </div>

      {/* Alignment Narrative */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
        <span className="font-bold text-[var(--text-heading)]">Assessment Comparison: </span>
        {comparison.alignmentNote}
      </div>

      {/* Comparison Grid */}
      {isBothCompleted ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Corroborated Common Threat Indicators (only shown for a valid executed pair) */}
          {corroboration.hasValidCorroborationPair ? (
            <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2">
              <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E8B57]" />
                {corroboration.heading} ({comparison.commonIndicators.length})
              </h4>
              <p className="text-[11px] text-[var(--text-muted)]">
                {corroboration.subtitle}
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
          ) : (
            <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2">
              <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-[var(--text-muted)]" />
                {corroboration.heading}
              </h4>
              <p className="text-[11px] text-[var(--text-muted)]">
                {corroboration.subtitle}
              </p>
            </div>
          )}

          {/* Distinct Model Findings */}
          <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2">
            <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#159FB5]" />
              {isLocalRules ? 'Distinct Engine Findings' : 'Distinct Model Findings'} ({comparison.uniqueCloudFindings.length + comparison.uniqueOnDeviceFindings.length})
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              Single-source insights unique to one evaluation engine:
            </p>
            <ul className="space-y-1.5 pt-1">
              {comparison.uniqueCloudFindings.map((item, idx) => (
                <li
                  key={`cloud-${idx}`}
                  className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-main)] flex items-start gap-2"
                >
                  <StatusBadge variant="ai" size="sm" className="shrink-0 mt-0.5">
                    Cloud
                  </StatusBadge>
                  <span>{item}</span>
                </li>
              ))}
              {comparison.uniqueOnDeviceFindings.map((item, idx) => (
                <li
                  key={`od-${idx}`}
                  className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-main)] flex items-start gap-2"
                >
                  <StatusBadge
                    variant={isLocalRules ? 'local' : 'safe'}
                    size="sm"
                    className="shrink-0 mt-0.5"
                  >
                    {isLocalRules ? 'Local Rules' : 'Gemini Nano'}
                  </StatusBadge>
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
              {effectiveCloud ? 'On-Device Engine Status' : 'Cloud Engine Status'}
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              {effectiveCloud
                ? 'Chrome Prompt API (Gemini Nano) local inference was not executed or is unavailable on this device.'
                : 'Gemini Cloud AI requires explicit user consent before data transmission.'}
            </p>
            <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-muted)] space-y-1">
              <span className="font-bold text-[var(--text-heading)] block">
                {effectiveCloud ? 'No Local Corroboration' : 'Cloud Consent Required'}
              </span>
              <p>
                {effectiveCloud
                  ? 'Dual-model comparison is inactive. Threat indicators below reflect deep contextual Cloud AI inference only.'
                  : 'To cross-examine with Gemini Cloud AI, grant explicit privacy consent in the Enhanced Cloud card.'}
              </p>
            </div>
          </div>

          {/* Active Engine Findings Panel */}
          <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2">
            <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#22D3EE]" />
              {effectiveCloud ? 'Cloud AI Findings' : isLocalRules ? 'Local Rule Findings' : 'On-Device AI Findings'} (
              {effectiveCloud
                ? comparison.uniqueCloudFindings.length
                : comparison.uniqueOnDeviceFindings.length}
              )
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              {effectiveCloud
                ? 'Deep contextual threat patterns identified by Gemini Cloud:'
                : isLocalRules
                ? 'Deterministic local patterns identified on-device:'
                : 'On-device Gemini Nano threat patterns:'}
            </p>
            <ul className="space-y-1.5 pt-1">
              {(effectiveCloud
                ? comparison.uniqueCloudFindings
                : comparison.uniqueOnDeviceFindings
              ).map((item, idx) => (
                <li
                  key={idx}
                  className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-main)] flex items-start gap-2"
                >
                  <StatusBadge
                    variant={effectiveCloud ? 'ai' : isLocalRules ? 'local' : 'safe'}
                    size="sm"
                    className="shrink-0 mt-0.5"
                  >
                    {effectiveCloud ? 'Cloud-Only' : isLocalRules ? 'Local Rules' : 'On-Device'}
                  </StatusBadge>
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
                className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/25 flex items-start gap-2.5 text-xs text-[var(--text-heading)] font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
