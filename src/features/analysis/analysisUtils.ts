/**
 * ContextShield - Hybrid Analysis Utilities & Comparison Engine
 * Evaluates and compares findings from On-Device AI and Cloud AI.
 * Never fabricates agreement or artificial consensus.
 */

import type {
  AnalysisRecord,
  AnalysisRiskLevel,
  HybridComparison,
} from './types'

export function compareAnalyses(
  onDevice: AnalysisRecord | null,
  cloud: AnalysisRecord | null
): HybridComparison | null {
  if (!onDevice && !cloud) return null

  if (!onDevice && cloud) {
    return {
      riskAlignment: 'SINGLE_MODEL',
      alignmentNote:
        'Cloud-Only Evaluation: On-Device AI was unavailable or not executed. Findings reflect deep contextual cloud inference without local corroboration.',
      commonIndicators: [],
      uniqueOnDeviceFindings: [],
      uniqueCloudFindings: cloud.suspiciousIndicators,
      combinedRecommendations: cloud.recommendedActions,
    }
  }

  if (onDevice && !cloud) {
    const isLocalRules = onDevice.actualInferenceSource === 'local_rules'
    return {
      riskAlignment: 'SINGLE_MODEL',
      alignmentNote: isLocalRules
        ? 'Local Rule-Based Evaluation: Enhanced Cloud AI was not executed. Findings reflect client-side deterministic heuristics (Zero ML/AI).'
        : 'On-Device-Only Evaluation: Enhanced Cloud AI was not executed or lacked explicit consent. Findings reflect local Gemini Nano inference without cloud corroboration.',
      commonIndicators: [],
      uniqueOnDeviceFindings: onDevice.suspiciousIndicators,
      uniqueCloudFindings: [],
      combinedRecommendations: onDevice.recommendedActions,
    }
  }

  if (!onDevice || !cloud) return null

  // Determine risk level agreement
  const onDeviceRisk = onDevice.riskLevel
  const cloudRisk = cloud.riskLevel
  const isLocalRules = onDevice.actualInferenceSource === 'local_rules'

  let riskAlignment: 'AGREE' | 'DIVERGE' = 'DIVERGE'
  let alignmentNote = ''

  if (isLocalRules) {
    // When pairing Local Rules with Cloud AI, distinguish heuristic verification from dual-AI agreement
    if (onDeviceRisk === cloudRisk) {
      riskAlignment = 'AGREE'
      alignmentNote = `Gemini Cloud AI and deterministic Local Rules both classified the message as ${onDeviceRisk} risk. (Heuristic verification; local rules do not constitute a second AI model).`
    } else {
      riskAlignment = 'DIVERGE'
      alignmentNote = `Risk assessment differs between Gemini Cloud AI (${cloudRisk}) and Local Rules (${onDeviceRisk}). Review individual engine findings below.`
    }
  } else {
    // Both are genuine AI models (Gemini Nano + Gemini Cloud)
    if (onDeviceRisk === cloudRisk) {
      riskAlignment = 'AGREE'
      alignmentNote = `Both AI models independently assessed the message as ${onDeviceRisk} risk.`
    } else if (
      (onDeviceRisk === 'HIGH' && cloudRisk === 'MEDIUM') ||
      (onDeviceRisk === 'MEDIUM' && cloudRisk === 'HIGH')
    ) {
      riskAlignment = 'AGREE'
      alignmentNote = `Both AI models identified elevated risk patterns (On-Device: ${onDeviceRisk}, Cloud: ${cloudRisk}).`
    } else {
      riskAlignment = 'DIVERGE'
      alignmentNote = `AI models reached different risk classifications (On-Device: ${onDeviceRisk}, Cloud: ${cloudRisk}). Review individual model evidence below.`
    }
  }

  // Match common vs unique indicators (using substring/keyword overlap heuristics)
  const commonIndicators: string[] = []
  const uniqueOnDeviceFindings: string[] = []
  const uniqueCloudFindings: string[] = []

  const cloudText = cloud.suspiciousIndicators.join(' ').toLowerCase()
  onDevice.suspiciousIndicators.forEach(ind => {
    const words = ind.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    const hasOverlap = words.some(w => cloudText.includes(w))
    if (hasOverlap) {
      commonIndicators.push(ind)
    } else {
      uniqueOnDeviceFindings.push(ind)
    }
  })

  const onDeviceText = onDevice.suspiciousIndicators.join(' ').toLowerCase()
  cloud.suspiciousIndicators.forEach(ind => {
    const words = ind.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    const hasOverlap = words.some(w => onDeviceText.includes(w))
    if (!hasOverlap) {
      uniqueCloudFindings.push(ind)
    }
  })

  // Deduplicate recommendations
  const allRecs = [...cloud.recommendedActions, ...onDevice.recommendedActions]
  const combinedRecommendations = Array.from(new Set(allRecs))

  return {
    riskAlignment,
    alignmentNote,
    commonIndicators,
    uniqueOnDeviceFindings,
    uniqueCloudFindings,
    combinedRecommendations,
  }
}

export function getRiskLevelBadgeProps(risk: AnalysisRiskLevel): {
  label: string
  bgClass: string
  textClass: string
  borderClass: string
} {
  switch (risk) {
    case 'HIGH':
      return {
        label: 'High Risk',
        bgClass: 'bg-[#E07A5F]/15',
        textClass: 'text-[#E07A5F] dark:text-[#F3A58E]',
        borderClass: 'border-[#E07A5F]/30',
      }
    case 'MEDIUM':
      return {
        label: 'Medium Risk',
        bgClass: 'bg-[#D7C4A8]/25',
        textClass: 'text-[#B87A3D] dark:text-[#E8BA7E]',
        borderClass: 'border-[#D7C4A8]/40',
      }
    case 'LOW':
      return {
        label: 'Low Risk',
        bgClass: 'bg-[#2E8B57]/15',
        textClass: 'text-[#2E8B57] dark:text-[#67D59A]',
        borderClass: 'border-[#2E8B57]/30',
      }
    case 'UNKNOWN':
    default:
      return {
        label: 'Indeterminate Risk',
        bgClass: 'bg-[#A6C5C1]/20',
        textClass: 'text-[var(--text-muted)]',
        borderClass: 'border-[var(--border-card)]',
      }
  }
}
