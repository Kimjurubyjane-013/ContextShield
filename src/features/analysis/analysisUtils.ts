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
  const validOnDevice =
    onDevice &&
    (onDevice.actualInferenceSource === 'on_device' ||
      onDevice.actualInferenceSource === 'local_rules')
      ? onDevice
      : null
  const validCloud =
    cloud && cloud.actualInferenceSource === 'in_cloud' ? cloud : null

  if (!validOnDevice && !validCloud) return null

  if (!validOnDevice && validCloud) {
    return {
      riskAlignment: 'SINGLE_MODEL',
      alignmentNote:
        'Cloud-Only Evaluation: On-Device AI was unavailable or not executed. Findings reflect deep contextual cloud inference without local corroboration.',
      commonIndicators: [],
      uniqueOnDeviceFindings: [],
      uniqueCloudFindings: validCloud.suspiciousIndicators,
      combinedRecommendations: validCloud.recommendedActions,
    }
  }

  if (validOnDevice && !validCloud) {
    const isLocalRules = validOnDevice.actualInferenceSource === 'local_rules'
    return {
      riskAlignment: 'SINGLE_MODEL',
      alignmentNote: isLocalRules
        ? 'Local Rule-Based Evaluation: Enhanced Cloud AI was not executed. Findings reflect client-side deterministic heuristics (Zero ML/AI).'
        : 'On-Device-Only Evaluation: Enhanced Cloud AI was not executed or lacked explicit consent. Findings reflect local Gemini Nano inference without cloud corroboration.',
      commonIndicators: [],
      uniqueOnDeviceFindings: validOnDevice.suspiciousIndicators,
      uniqueCloudFindings: [],
      combinedRecommendations: validOnDevice.recommendedActions,
    }
  }

  if (!validOnDevice || !validCloud) return null

  // Determine risk level agreement
  const onDeviceRisk = validOnDevice.riskLevel
  const cloudRisk = validCloud.riskLevel
  const isLocalRules = validOnDevice.actualInferenceSource === 'local_rules'

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

  const cloudText = validCloud.suspiciousIndicators.join(' ').toLowerCase()
  validOnDevice.suspiciousIndicators.forEach(ind => {
    const words = ind.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    const hasOverlap = words.some(w => cloudText.includes(w))
    if (hasOverlap) {
      commonIndicators.push(ind)
    } else {
      uniqueOnDeviceFindings.push(ind)
    }
  })

  const onDeviceText = validOnDevice.suspiciousIndicators.join(' ').toLowerCase()
  validCloud.suspiciousIndicators.forEach(ind => {
    const words = ind.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    const hasOverlap = words.some(w => onDeviceText.includes(w))
    if (!hasOverlap) {
      uniqueCloudFindings.push(ind)
    }
  })

  // Deduplicate recommendations
  const allRecs = [...validCloud.recommendedActions, ...validOnDevice.recommendedActions]
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
  variant: 'threat' | 'warning' | 'safe' | 'neutral'
  bgClass: string
  textClass: string
  borderClass: string
} {
  switch (risk) {
    case 'HIGH':
      return {
        label: 'High Risk',
        variant: 'threat',
        bgClass: 'bg-[#EF4444]/15',
        textClass: 'text-[#B91C1C] dark:text-[#F87171]',
        borderClass: 'border-[#EF4444]/35',
      }
    case 'MEDIUM':
      return {
        label: 'Medium Risk',
        variant: 'warning',
        bgClass: 'bg-[#F59E0B]/15',
        textClass: 'text-[#B45309] dark:text-[#FBBF24]',
        borderClass: 'border-[#F59E0B]/35',
      }
    case 'LOW':
      return {
        label: 'Low Risk',
        variant: 'safe',
        bgClass: 'bg-[#22C55E]/15',
        textClass: 'text-[#15803D] dark:text-[#4ADE80]',
        borderClass: 'border-[#22C55E]/35',
      }
    case 'UNKNOWN':
    default:
      return {
        label: 'Indeterminate Risk',
        variant: 'neutral',
        bgClass: 'bg-[#64748B]/15',
        textClass: 'text-[var(--text-muted)]',
        borderClass: 'border-[var(--border-card)]',
      }
  }
}

export interface CorroborationPresentation {
  hasValidCorroborationPair: boolean
  heading: string
  subtitle: string
}

/**
 * Determines whether two executed engines form a valid corroboration pair
 * (`on_device` + `in_cloud` or `local_rules` + `in_cloud`).
 */
export function getCorroborationPresentation(
  onDevice: AnalysisRecord | null,
  cloud: AnalysisRecord | null
): CorroborationPresentation {
  const isActualOnDevice = onDevice?.actualInferenceSource === 'on_device'
  const isLocalRules = onDevice?.actualInferenceSource === 'local_rules'
  const isActualCloud = cloud?.actualInferenceSource === 'in_cloud'

  if (isActualOnDevice && isActualCloud) {
    return {
      hasValidCorroborationPair: true,
      heading: 'Corroborated Indicators',
      subtitle: 'Corroborated by both On-Device Gemini Nano and Cloud AI security evaluation:',
    }
  }

  if (isLocalRules && isActualCloud) {
    return {
      hasValidCorroborationPair: true,
      heading: 'Corroborated Indicators',
      subtitle: 'Corroborated by Cloud AI and deterministic Local Rules:',
    }
  }

  return {
    hasValidCorroborationPair: false,
    heading: 'Non-Corroborated Findings',
    subtitle: 'No cross-engine corroboration available (single-engine evaluation only).',
  }
}
