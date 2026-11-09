/**
 * ContextShield - Hybrid AI Analysis & Unified Security Report Engine
 * Pure TypeScript service that compares On-Device AI and Cloud AI findings,
 * resolves agreements/disagreements, and produces an evidence-based Unified Security Report.
 *
 * Rules:
 * - Never blindly combine or average model scores.
 * - Never invent risk percentages or fabricate evidence.
 * - Transparent, explainable risk logic.
 * - Preserves source attribution ('on-device', 'cloud', 'both').
 */

import type {
  AnalysisMode,
  AnalysisRecord,
  AnalysisRiskLevel,
  Evidence,
  FindingSeverity,
  FindingSource,
  ModelAnalysisSummary,
  ModelFinding,
  ModelStatus,
  RiskAssessment,
  UnifiedReport,
} from '@/features/analysis/types'

export interface GenerateReportParams {
  protectedMessage: string
  onDeviceResult: AnalysisRecord | null
  cloudResult: AnalysisRecord | null
  onDeviceStatus?: ModelStatus
  cloudStatus?: ModelStatus
  onDeviceError?: string | null
  cloudError?: string | null
}

/**
 * Generates a unified, evidence-based security report from available model inputs.
 */
export function generateUnifiedReport({
  protectedMessage,
  onDeviceResult,
  cloudResult,
  onDeviceStatus,
  cloudStatus,
  onDeviceError,
  cloudError,
}: GenerateReportParams): UnifiedReport {
  const tSynthStart = performance.now()
  const trimmed = protectedMessage.trim()
  const snippet = trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed

  // 1. Determine model run statuses
  const effectiveOnDeviceStatus: ModelStatus =
    onDeviceStatus ?? (onDeviceResult ? 'completed' : onDeviceError ? 'failed' : 'unavailable')
  const effectiveCloudStatus: ModelStatus =
    cloudStatus ?? (cloudResult ? 'completed' : cloudError ? 'failed' : 'unavailable')

  // 2. Distinguish actual Gemini Nano AI from deterministic Local Rules
  const isLocalRules = onDeviceResult?.actualInferenceSource === 'local_rules'
  const isOnDeviceAi = onDeviceResult?.actualInferenceSource === 'on_device'
  const isCloudCompleted = Boolean(cloudResult)

  let completionStatus: UnifiedReport['completionStatus'] = 'none_completed'
  if (isOnDeviceAi && isCloudCompleted) {
    completionStatus = 'both_completed'
  } else if (isLocalRules && isCloudCompleted) {
    completionStatus = 'cloud_and_local'
  } else if (isOnDeviceAi && !isCloudCompleted) {
    completionStatus = 'on_device_only'
  } else if (isLocalRules && !isCloudCompleted) {
    completionStatus = 'local_only'
  } else if (!onDeviceResult && isCloudCompleted) {
    completionStatus = 'cloud_only'
  } else {
    completionStatus = 'none_completed'
  }

  // 3. Build model summaries with honest engine attribution
  const onDeviceSummary = buildModelSummary(
    isLocalRules ? 'local' : 'on-device',
    effectiveOnDeviceStatus,
    isLocalRules ? 'Local Rule-Based Analysis' : 'Gemini Nano (Chrome Prompt API On-Device)',
    onDeviceResult,
    onDeviceError
  )

  const cloudSummary = buildModelSummary(
    'cloud',
    effectiveCloudStatus,
    'Gemini 3.8 Flash (Firebase AI Logic Cloud)',
    cloudResult,
    cloudError
  )

  // 4. Compare findings and correlate indicators
  const { commonFindings, additionalFindings, conflictingFindings, allEvidence } =
    reconcileFindings(onDeviceResult, cloudResult, trimmed)

  // 5. Compute overall risk assessment
  const assessment = computeOverallRiskAssessment({
    onDeviceResult,
    cloudResult,
    completionStatus,
    conflictingFindings,
    allFindings: [...commonFindings, ...additionalFindings],
  })

  // 6. Generate contextual recommendations
  const recommendedActions = synthesizeRecommendations(
    onDeviceResult,
    cloudResult,
    commonFindings,
    additionalFindings
  )

  // 7. Consolidate honest limitations
  const limitations = consolidateLimitations(onDeviceResult, cloudResult, completionStatus)

  return {
    id: `rep-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    protectedMessageLength: trimmed.length,
    protectedMessageSnippet: snippet,
    completionStatus,
    assessment,
    onDeviceSummary,
    cloudSummary,
    commonFindings,
    additionalFindings,
    conflictingFindings,
    allEvidence,
    recommendedActions,
    limitations,
    privacyNotice:
      'This report reflects automated analysis of client-sanitized text. All evaluations represent heuristic and model-generated risk indicators rather than legal guarantees of authenticity or fraud.',
    latencyBreakdown: {
      initMs: 0,
      generationMs: 0,
      synthesisMs: Math.max(1, Math.round(performance.now() - tSynthStart)),
      totalMs: Math.max(1, Math.round(performance.now() - tSynthStart)),
    },
  }
}

/**
 * Reconciles indicators from both models, detecting commonalities, unique additions, and direct conflicts.
 */
function reconcileFindings(
  onDevice: AnalysisRecord | null,
  cloud: AnalysisRecord | null,
  protectedMessage: string
): {
  commonFindings: ModelFinding[]
  additionalFindings: ModelFinding[]
  conflictingFindings: ModelFinding[]
  allEvidence: Evidence[]
} {
  const commonFindings: ModelFinding[] = []
  const additionalFindings: ModelFinding[] = []
  const conflictingFindings: ModelFinding[] = []
  const allEvidence: Evidence[] = []

  const onDeviceIndicators = onDevice?.suspiciousIndicators ?? []
  const cloudIndicators = cloud?.suspiciousIndicators ?? []

  // Track matched indices
  const matchedCloudIndices = new Set<number>()

  // A. Check each On-Device indicator against Cloud indicators
  onDeviceIndicators.forEach((odInd, odIdx) => {
    let matchedCloudIdx = -1

    for (let cIdx = 0; cIdx < cloudIndicators.length; cIdx++) {
      if (matchedCloudIndices.has(cIdx)) continue
      if (hasSemanticOverlap(odInd, cloudIndicators[cIdx])) {
        matchedCloudIdx = cIdx
        break
      }
    }

    const isLocalRules = onDevice?.actualInferenceSource === 'local_rules'

    if (matchedCloudIdx !== -1) {
      // Overlapping finding across both engines
      matchedCloudIndices.add(matchedCloudIdx)
      const cloudInd = cloudIndicators[matchedCloudIdx]
      const severity = inferFindingSeverity(odInd, cloudInd, cloud?.riskLevel || onDevice?.riskLevel)
      const evidence = extractRelevantEvidence(
        odInd,
        isLocalRules ? 'cloud' : 'both',
        severity,
        onDevice,
        cloud,
        protectedMessage
      )

      allEvidence.push(...evidence)

      commonFindings.push({
        id: `common-${odIdx}-${matchedCloudIdx}`,
        title: odInd,
        description: isLocalRules
          ? `Identified by Gemini Cloud AI and verified by deterministic local rules: "${odInd}".`
          : `Corroborated by both On-Device AI (Gemini Nano) and Cloud AI: "${odInd}" and "${cloudInd}".`,
        source: isLocalRules ? 'cloud' : 'both',
        severity,
        evidenceList: evidence,
      })
    } else {
      // Unique to local engine (On-Device Nano or Local Rules)
      const findingSource: FindingSource = isLocalRules ? 'local_rules' : 'on-device'
      const severity = inferFindingSeverity(odInd, undefined, onDevice?.riskLevel)
      const evidence = extractRelevantEvidence(
        odInd,
        findingSource,
        severity,
        onDevice,
        null,
        protectedMessage
      )

      allEvidence.push(...evidence)

      additionalFindings.push({
        id: isLocalRules ? `local-${odIdx}` : `od-${odIdx}`,
        title: odInd,
        description: isLocalRules
          ? `Identified by Deterministic Local Security Engine (Rule-based heuristics).`
          : `Identified by On-Device Gemini Nano local inference.`,
        source: findingSource,
        severity,
        evidenceList: evidence,
      })
    }
  })

  // B. Cloud indicators not matched with On-Device
  cloudIndicators.forEach((cInd, cIdx) => {
    if (matchedCloudIndices.has(cIdx)) return

    const severity = inferFindingSeverity(cInd, undefined, cloud?.riskLevel)
    const evidence = extractRelevantEvidence(
      cInd,
      'cloud',
      severity,
      null,
      cloud,
      protectedMessage
    )

    allEvidence.push(...evidence)

    additionalFindings.push({
      id: `cloud-${cIdx}`,
      title: cInd,
      description: `Identified by Cloud AI deep contextual evaluation.`,
      source: 'cloud',
      severity,
      evidenceList: evidence,
    })
  })

  // C. Detect Direct Model Conflicts (e.g. Risk Contradictions or Stance Conflicts)
  if (onDevice && cloud) {
    const odRisk = onDevice.riskLevel
    const cRisk = cloud.riskLevel

    const isDirectRiskContradiction =
      (odRisk === 'HIGH' && cRisk === 'LOW') || (odRisk === 'LOW' && cRisk === 'HIGH')

    if (isDirectRiskContradiction) {
      conflictingFindings.push({
        id: 'conflict-risk-divergence',
        title: 'Severe Risk Level Divergence',
        description: `On-Device AI evaluated this message as ${odRisk} risk, whereas Cloud AI evaluated it as ${cRisk} risk.`,
        source: 'both',
        severity: 'high',
        isConflicting: true,
        conflictReason:
          'Models produced opposing security classifications. On-Device AI relied on local surface patterns while Cloud AI analyzed deeper contextual nuance. Manual verification is strongly advised.',
        evidenceList: [
          {
            id: 'ev-conflict-od',
            indicator: `On-Device Assessment: ${odRisk}`,
            explanation: onDevice.summary,
            source: 'on-device',
            severity: odRisk === 'HIGH' ? 'high' : 'low',
          },
          {
            id: 'ev-conflict-cloud',
            indicator: `Cloud Assessment: ${cRisk}`,
            explanation: cloud.summary,
            source: 'cloud',
            severity: cRisk === 'HIGH' ? 'high' : 'low',
          },
        ],
      })
    }
  }

  return {
    commonFindings,
    additionalFindings,
    conflictingFindings,
    allEvidence,
  }
}

/**
 * Transparent, explainable risk assessment engine.
 * Never invents percentages or averages scores.
 * Accurately distinguishes Gemini Nano on-device AI from deterministic Local Rules.
 */
function computeOverallRiskAssessment({
  onDeviceResult,
  cloudResult,
  completionStatus,
  conflictingFindings,
  allFindings,
}: {
  onDeviceResult: AnalysisRecord | null
  cloudResult: AnalysisRecord | null
  completionStatus: UnifiedReport['completionStatus']
  conflictingFindings: ModelFinding[]
  allFindings: ModelFinding[]
}): RiskAssessment {
  if (completionStatus === 'none_completed') {
    return {
      overallRisk: 'UNKNOWN',
      summary: 'Analysis could not be completed.',
      rationale:
        'Neither local evaluation nor cloud inference completed successfully. No reliable security determinations can be made.',
      confidenceNote: 'Zero evaluation engines available.',
      isContradictory: false,
    }
  }

  // A. Local Rule-Based Analysis Only (No ML / No Gemini Nano)
  if (completionStatus === 'local_only') {
    const rawModelRisk = onDeviceResult?.riskLevel ?? 'UNKNOWN'
    const highFindings = allFindings.filter(f => f.severity === 'high')
    const medFindings = allFindings.filter(f => f.severity === 'medium')

    let overallRisk: AnalysisRiskLevel = rawModelRisk
    let rationale = ''

    if (highFindings.length > 0 || rawModelRisk === 'HIGH') {
      overallRisk = 'HIGH'
      const keyTitles =
        highFindings.length > 0
          ? highFindings.map(f => `"${f.title}"`).slice(0, 2).join(' and ')
          : 'deterministic threat patterns'
      rationale = `Assigned HIGH risk based on deterministic pattern matching by Local Rule-Based Analysis (${keyTitles}). Enhanced Cloud AI was not executed or lacked explicit consent.`
    } else if (medFindings.length > 0 || rawModelRisk === 'MEDIUM') {
      overallRisk = 'MEDIUM'
      rationale =
        'Assigned MEDIUM risk based on moderate suspicious indicators detected by local rule-based pattern matching. No cloud corroboration.'
    } else {
      overallRisk = 'LOW'
      rationale =
        'Assigned LOW risk: local rule-based pattern matching did not identify standard phishing keywords or threat patterns.'
    }

    return {
      overallRisk,
      summary: `Local Rule-Based Evaluation: ${onDeviceResult?.summary ?? 'Analysis completed.'}`,
      rationale,
      confidenceNote: `Deterministic heuristic assessment (${overallRisk} Risk). No machine learning or semantic AI was executed.`,
      isContradictory: false,
    }
  }

  // B. On-Device Gemini Nano AI Only
  if (completionStatus === 'on_device_only') {
    const rawModelRisk = onDeviceResult?.riskLevel ?? 'UNKNOWN'
    const highFindings = allFindings.filter(f => f.severity === 'high')
    const medFindings = allFindings.filter(f => f.severity === 'medium')

    let overallRisk: AnalysisRiskLevel = rawModelRisk
    let rationale = ''

    if (highFindings.length > 0 || rawModelRisk === 'HIGH') {
      overallRisk = 'HIGH'
      const keyTitles =
        highFindings.length > 0
          ? highFindings.map(f => `"${f.title}"`).slice(0, 2).join(' and ')
          : 'on-device threat patterns'
      rationale = `Assigned HIGH risk based on high-severity threat indicators (${keyTitles}) identified by on-device Gemini Nano inference. Enhanced Cloud AI was not executed or lacked explicit consent.`
    } else if (medFindings.length > 0 || rawModelRisk === 'MEDIUM') {
      overallRisk = 'MEDIUM'
      rationale =
        'Assigned MEDIUM risk based on moderate suspicious indicators detected by on-device Gemini Nano inference without cloud corroboration.'
    } else {
      overallRisk = 'LOW'
      rationale =
        'Assigned LOW risk: on-device Gemini Nano evaluation identified standard benign communication patterns.'
    }

    return {
      overallRisk,
      summary: `On-Device AI Evaluation: ${onDeviceResult?.summary ?? 'Analysis completed.'}`,
      rationale,
      confidenceNote: `Single-engine On-Device AI evaluation (${overallRisk} Risk). Enhanced Cloud context was not consulted.`,
      isContradictory: false,
    }
  }

  // C. Cloud AI Only
  if (completionStatus === 'cloud_only') {
    const rawModelRisk = cloudResult?.riskLevel ?? 'UNKNOWN'
    const highFindings = allFindings.filter(f => f.severity === 'high')
    const medFindings = allFindings.filter(f => f.severity === 'medium')

    let overallRisk: AnalysisRiskLevel = rawModelRisk
    let rationale = ''

    if (highFindings.length > 0 || rawModelRisk === 'HIGH') {
      overallRisk = 'HIGH'
      const keyTitles =
        highFindings.length > 0
          ? highFindings.map(f => `"${f.title}"`).slice(0, 2).join(' and ')
          : 'critical deceptive and credential harvesting patterns'
      rationale = `Assigned HIGH risk: Gemini Cloud identified high-severity threat indicators (${keyTitles}) substantiated by psychological pressure and deceptive context under explicit user consent.`
    } else if (medFindings.length > 0 || rawModelRisk === 'MEDIUM') {
      overallRisk = 'MEDIUM'
      const keyTitles =
        medFindings.length > 0
          ? medFindings.map(f => `"${f.title}"`).slice(0, 2).join(' and ')
          : 'moderate anomalies'
      rationale = `Assigned MEDIUM risk based on moderate suspicious indicators (${keyTitles}). Potential manipulation was observed, but conclusive credential theft or account lockout threats were not proven.`
    } else {
      overallRisk = 'LOW'
      rationale =
        'Assigned LOW risk: cloud analysis found only standard benign patterns without verified threat indicators.'
    }

    return {
      overallRisk,
      summary: `Cloud-Only Evaluation: ${cloudResult?.summary ?? 'Analysis completed.'}`,
      rationale,
      confidenceNote: `Single-engine cloud evaluation (${overallRisk} Risk). On-device local analysis was unavailable.`,
      isContradictory: false,
    }
  }

  // D. Cloud AI + Local Rules (Multi-Paradigm: Heuristic + Semantic AI)
  if (completionStatus === 'cloud_and_local') {
    const odRisk = onDeviceResult!.riskLevel
    const cRisk = cloudResult!.riskLevel
    const hasConflict = conflictingFindings.some(f => f.isConflicting)

    if (odRisk === 'HIGH' && cRisk === 'HIGH') {
      return {
        overallRisk: 'HIGH',
        summary: 'High threat probability identified by Gemini Cloud with local heuristic corroboration.',
        rationale:
          'Gemini Cloud AI identified severe threat signals, confirmed by matching deterministic threat patterns in the Local Security Engine.',
        confidenceNote: 'Cloud AI with Local Heuristic Verification (High Threat).',
        isContradictory: false,
      }
    }

    if (odRisk === 'LOW' && cRisk === 'LOW') {
      return {
        overallRisk: 'LOW',
        summary: 'No standard deceptive indicators detected by Cloud AI or Local Rules.',
        rationale:
          'Both Gemini Cloud AI and deterministic local pattern rules found no verified threat indicators. Caution is still advised for unexpected messages.',
        confidenceNote: 'Cloud AI with Local Heuristic Verification (Low Threat).',
        isContradictory: false,
      }
    }

    if (hasConflict || (odRisk === 'HIGH' && cRisk === 'LOW') || (odRisk === 'LOW' && cRisk === 'HIGH')) {
      return {
        overallRisk: 'MEDIUM',
        summary: `Evaluation divergence: Cloud AI (${cRisk}) vs Local Rules (${odRisk}).`,
        rationale:
          'Cloud semantic AI and deterministic local rules reached different conclusions. Uncertainty is highlighted rather than averaged. Precautionary MEDIUM status applied.',
        confidenceNote: 'Discrepancy between semantic AI and syntactic rules.',
        isContradictory: true,
        contradictionDetails: `Local Rules evaluated ${odRisk} while Cloud AI evaluated ${cRisk}. Review individual evidence before trusting or discarding the message.`,
      }
    }

    if ((odRisk === 'HIGH' && cRisk === 'MEDIUM') || (odRisk === 'MEDIUM' && cRisk === 'HIGH')) {
      return {
        overallRisk: 'HIGH',
        summary: 'Elevated threat probability identified across Cloud AI and Local Rules.',
        rationale:
          'Assigned HIGH risk as precautionary stance: elevated threat patterns were detected across Cloud AI and Local Rules.',
        confidenceNote: 'Elevated risk observed across semantic AI and heuristic rules.',
        isContradictory: false,
      }
    }

    return {
      overallRisk: 'MEDIUM',
      summary: 'Moderate threat signals detected across Cloud AI and Local Rules.',
      rationale:
        'Moderate anomalies detected. Review individual findings for context.',
      confidenceNote: 'Moderate threat evaluation.',
      isContradictory: false,
    }
  }

  // E. True Dual-AI: Both Gemini Nano (on-device) and Gemini Cloud (cloud) completed
  const odRisk = onDeviceResult!.riskLevel
  const cRisk = cloudResult!.riskLevel
  const hasConflict = conflictingFindings.some(f => f.isConflicting)

  // Agreement: Both HIGH
  if (odRisk === 'HIGH' && cRisk === 'HIGH') {
    return {
      overallRisk: 'HIGH',
      summary: 'High threat probability corroborated by both AI engines.',
      rationale:
        'Both On-Device AI (Gemini Nano) and Gemini Cloud AI independently identified severe threat signals and psychological manipulation patterns.',
      confidenceNote: 'Dual-engine consensus (High Severity Dual-AI).',
      isContradictory: false,
    }
  }

  // Agreement: Both LOW
  if (odRisk === 'LOW' && cRisk === 'LOW') {
    return {
      overallRisk: 'LOW',
      summary: 'No standard deceptive indicators detected by either AI engine.',
      rationale:
        'Both on-device Gemini Nano and cloud models independently concluded the message lacks typical phishing or manipulation characteristics. Caution is still advised for unexpected messages.',
      confidenceNote: 'Dual-engine consensus (Low Threat Dual-AI).',
      isContradictory: false,
    }
  }

  // Direct contradiction: HIGH vs LOW
  if (hasConflict || (odRisk === 'HIGH' && cRisk === 'LOW') || (odRisk === 'LOW' && cRisk === 'HIGH')) {
    return {
      overallRisk: 'MEDIUM',
      summary: `Divergent evaluations: On-Device AI (${odRisk}) and Cloud AI (${cRisk}) disagree.`,
      rationale:
        'The two analysis models reached contradictory conclusions. In accordance with ContextShield security policy, uncertainty is highlighted rather than averaged. A precautionary MEDIUM status is applied, and manual verification is strongly recommended.',
      confidenceNote: 'AI model divergence detected. Uncertainty is elevated.',
      isContradictory: true,
      contradictionDetails: `On-Device evaluated ${odRisk} while Cloud evaluated ${cRisk}. Review individual evidence before trusting or discarding the message.`,
    }
  }

  // High + Medium or Medium + High: Precautionary HIGH
  if ((odRisk === 'HIGH' && cRisk === 'MEDIUM') || (odRisk === 'MEDIUM' && cRisk === 'HIGH')) {
    return {
      overallRisk: 'HIGH',
      summary: 'Elevated risk detected with corroborated suspicious signals across both engines.',
      rationale:
        'One model identified high-severity phishing characteristics while the other corroborated medium-level suspicious tactics. The unified assessment adopts a precautionary HIGH risk.',
      confidenceNote: 'Dual-engine corroborated elevated risk.',
      isContradictory: false,
    }
  }

  // Medium + Low or Low + Medium: MEDIUM
  if ((odRisk === 'MEDIUM' && cRisk === 'LOW') || (odRisk === 'LOW' && cRisk === 'MEDIUM')) {
    return {
      overallRisk: 'MEDIUM',
      summary: 'Moderate suspicious indicators detected. Caution advised.',
      rationale:
        'One model detected suspicious tactics while the other observed low immediate threat. Assigned MEDIUM risk pending user verification.',
      confidenceNote: 'Partial alignment (Medium Caution).',
      isContradictory: false,
    }
  }

  // Both MEDIUM
  if (odRisk === 'MEDIUM' && cRisk === 'MEDIUM') {
    return {
      overallRisk: 'MEDIUM',
      summary: 'Moderate risk indicators corroborated by both models.',
      rationale:
        'Both engines identified potential anomalies or manipulation tactics without conclusive proof of a severe breach attempt.',
      confidenceNote: 'Dual-engine consensus (Moderate Risk).',
      isContradictory: false,
    }
  }

  // Fallback to UNKNOWN
  return {
    overallRisk: 'UNKNOWN',
    summary: 'Indeterminate security posture.',
    rationale:
      'Available model responses were inconclusive or returned unknown risk parameters.',
    confidenceNote: 'Inconclusive findings.',
    isContradictory: false,
  }
}

/**
 * Extracts and maps evidence from the analyzed records, citing message excerpts if available.
 */
function extractRelevantEvidence(
  indicator: string,
  source: FindingSource,
  severity: FindingSeverity,
  od: AnalysisRecord | null,
  cloud: AnalysisRecord | null,
  protectedMessage: string
): Evidence[] {
  const list: Evidence[] = []

  // Check local engine evidence (On-Device Nano or Local Rules)
  if (od && (source === 'on-device' || source === 'local_rules' || source === 'both')) {
    const match = od.evidence.find(e => hasSemanticOverlap(e, indicator)) || od.evidence[0]
    if (match) {
      const isLocalRules = od.actualInferenceSource === 'local_rules'
      list.push({
        id: `ev-${isLocalRules ? 'local' : 'od'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        indicator,
        excerpt: findMessageExcerpt(match, protectedMessage),
        explanation: match,
        source: isLocalRules ? 'local_rules' : 'on-device',
        severity,
        confidenceLabel: isLocalRules ? 'Deterministic Rule Match' : 'On-Device AI Pattern Match',
      })
    }
  }

  // Check Cloud evidence
  if (cloud && (source === 'cloud' || source === 'both')) {
    const match =
      cloud.evidence.find(e => hasSemanticOverlap(e, indicator)) || cloud.evidence[0]
    if (match) {
      list.push({
        id: `ev-cloud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        indicator,
        excerpt: findMessageExcerpt(match, protectedMessage),
        explanation: match,
        source: 'cloud',
        severity,
        confidenceLabel: 'Deep Context Corroboration',
      })
    }
  }

  // Fallback if no specific excerpt matched
  if (list.length === 0) {
    list.push({
      id: `ev-gen-${Date.now()}`,
      indicator,
      explanation: `Flagged during ${source} inspection.`,
      source,
      severity,
    })
  }

  return list
}

/**
 * Locates an authentic excerpt from the protected message.
 * Never invents text.
 */
function findMessageExcerpt(evidenceStr: string, protectedMessage: string): string | undefined {
  if (!protectedMessage || !evidenceStr) return undefined

  // If evidence string is directly in message
  if (protectedMessage.includes(evidenceStr)) {
    return evidenceStr
  }

  // Check if keywords from evidence exist contiguously
  const tokens = evidenceStr.split(/\s+/).filter(w => w.length > 3)
  for (let i = 0; i < tokens.length - 1; i++) {
    const phrase = `${tokens[i]} ${tokens[i + 1]}`
    const idx = protectedMessage.toLowerCase().indexOf(phrase.toLowerCase())
    if (idx !== -1) {
      const start = Math.max(0, idx - 15)
      const end = Math.min(protectedMessage.length, idx + phrase.length + 25)
      return `...${protectedMessage.substring(start, end).trim()}...`
    }
  }

  return undefined
}

/**
 * Synthesizes actionable, deduplicated recommendations based on observed findings.
 */
function synthesizeRecommendations(
  od: AnalysisRecord | null,
  cloud: AnalysisRecord | null,
  common: ModelFinding[],
  additional: ModelFinding[]
): string[] {
  const set = new Set<string>()

  // 1. Add model-provided recommendations
  od?.recommendedActions.forEach(r => r.trim() && set.add(r.trim()))
  cloud?.recommendedActions.forEach(r => r.trim() && set.add(r.trim()))

  const allTitles = [...common, ...additional].map(f => f.title.toLowerCase()).join(' ')

  // 2. Add contextual safety directives based on specific detected threats
  if (allTitles.includes('payment') || allTitles.includes('card') || allTitles.includes('bank') || allTitles.includes('invoice')) {
    set.add('Do not transfer money or authorize payments before verifying with the organization via an independent phone number.')
  }

  if (allTitles.includes('link') || allTitles.includes('url') || allTitles.includes('domain') || allTitles.includes('qr')) {
    set.add('Do not click any embedded links, shortened URLs, or download attachments provided in the message.')
  }

  if (allTitles.includes('urgency') || allTitles.includes('pressure') || allTitles.includes('deadline') || allTitles.includes('suspended')) {
    set.add('Pause before reacting. Scammers intentionally fabricate artificial urgency to bypass careful scrutiny.')
  }

  if (allTitles.includes('password') || allTitles.includes('otp') || allTitles.includes('verification') || allTitles.includes('credential')) {
    set.add('Never disclose passwords, two-factor authentication codes, or PINs. Legitimate organizations never request these via message.')
  }

  set.add('Verify the sender through an official, trusted communication channel before replying.')

  return Array.from(set)
}

function buildModelSummary(
  mode: AnalysisMode,
  status: ModelStatus,
  modelName: string,
  record: AnalysisRecord | null,
  errorMessage?: string | null
): ModelAnalysisSummary {
  return {
    mode,
    status,
    modelName: record?.modelName ?? modelName,
    analyzedAt: record?.analyzedAt,
    findingsCount: (record?.suspiciousIndicators.length ?? 0) + (record?.manipulationTactics.length ?? 0),
    riskLevel: record?.riskLevel,
    errorMessage: errorMessage ?? undefined,
    findings: record?.suspiciousIndicators ?? [],
    evidence: record?.evidence ?? [],
    recommendations: record?.recommendedActions ?? [],
    limitations: record?.limitations ?? [],
  }
}

function consolidateLimitations(
  od: AnalysisRecord | null,
  cloud: AnalysisRecord | null,
  completionStatus: UnifiedReport['completionStatus']
): string[] {
  const set = new Set<string>()

  od?.limitations.forEach(l => l.trim() && set.add(l.trim()))
  cloud?.limitations.forEach(l => l.trim() && set.add(l.trim()))

  if (completionStatus === 'local_only') {
    set.add('Report generated from deterministic local rule-based analysis only; no machine learning or cloud context was consulted.')
  } else if (completionStatus === 'on_device_only') {
    set.add('Report generated from on-device Gemini Nano inference only; enhanced cloud context was not consulted.')
  } else if (completionStatus === 'cloud_only') {
    set.add('Report generated from cloud analysis only; on-device local engine was unavailable.')
  } else if (completionStatus === 'cloud_and_local') {
    set.add('Report synthesized from Cloud AI and deterministic Local Rules (no on-device Gemini Nano AI was available).')
  }

  set.add('Analysis was conducted on client-masked message text. Masking reduces PII exposure but does not guarantee total anonymity.')
  set.add('AI evaluations do not constitute definitive legal proof of fraud or safety.')

  return Array.from(set)
}

function hasSemanticOverlap(strA: string, strB: string): boolean {
  if (!strA || !strB) return false
  const wordsA = strA.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 4)
  const wordsB = strB.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 4)
  return wordsA.some(w => wordsB.includes(w))
}

export function inferFindingSeverity(
  textA: string,
  textB?: string,
  modelRiskLevel?: AnalysisRiskLevel
): FindingSeverity {
  const combined = `${textA} ${textB ?? ''}`.toLowerCase()

  // 1. Critical High-Severity Threat Patterns
  if (
    combined.includes('credential') ||
    combined.includes('password') ||
    combined.includes('otp') ||
    combined.includes('pin') ||
    combined.includes('suspend') ||
    combined.includes('suspens') ||
    combined.includes('lockout') ||
    combined.includes('wire transfer') ||
    combined.includes('bank transfer') ||
    combined.includes('malware') ||
    combined.includes('extortion') ||
    combined.includes('verify identity') ||
    combined.includes('identity verification') ||
    combined.includes('unauthorized transaction') ||
    combined.includes('phishing') ||
    combined.includes('harvest')
  ) {
    return 'high'
  }

  // 2. Moderate Threat Patterns
  if (
    combined.includes('link') ||
    combined.includes('url') ||
    combined.includes('domain') ||
    combined.includes('urgent') ||
    combined.includes('urgency') ||
    combined.includes('pressure') ||
    combined.includes('deadline') ||
    combined.includes('impersonat') ||
    combined.includes('spoof') ||
    combined.includes('payment') ||
    combined.includes('invoice') ||
    combined.includes('prize') ||
    combined.includes('lottery') ||
    combined.includes('reward') ||
    combined.includes('unsolicited') ||
    combined.includes('unusual')
  ) {
    // If overall model assessment is HIGH and indicator involves urgent links/impersonation,
    // maintain high severity to prevent inconsistent downgrade
    if (
      modelRiskLevel === 'HIGH' &&
      (combined.includes('link') ||
        combined.includes('urgent') ||
        combined.includes('urgency') ||
        combined.includes('impersonat') ||
        combined.includes('domain'))
    ) {
      return 'high'
    }
    return 'medium'
  }

  if (modelRiskLevel === 'HIGH') {
    return 'medium'
  }

  return 'low'
}

export const inferSeverity = inferFindingSeverity

/**
 * Formats a UnifiedReport into clean, exportable, privacy-safe text.
 * Never includes unmasked sensitive information.
 */
export function formatReportAsText(report: UnifiedReport): string {
  const dateStr = new Date(report.generatedAt).toUTCString()

  const lines: string[] = [
    '========================================================',
    '       CONTEXTSHIELD - UNIFIED SECURITY REPORT          ',
    '========================================================',
    `Report ID:      ${report.id}`,
    `Generated At:   ${dateStr}`,
    `Completion:     ${report.completionStatus.replace('_', ' ').toUpperCase()}`,
    `Overall Risk:   ${report.assessment.overallRisk}`,
    '--------------------------------------------------------',
    'OVERALL ASSESSMENT:',
    `Summary:        ${report.assessment.summary}`,
    `Rationale:      ${report.assessment.rationale}`,
    `Confidence:     ${report.assessment.confidenceNote}`,
  ]

  if (report.assessment.isContradictory && report.assessment.contradictionDetails) {
    lines.push(`Discrepancy:    ${report.assessment.contradictionDetails}`)
  }

  lines.push('--------------------------------------------------------')
  lines.push('AI SOURCE ATTRIBUTION:')
  lines.push(`- On-Device AI: [${report.onDeviceSummary.status.toUpperCase()}] ${report.onDeviceSummary.modelName}`)
  if (report.onDeviceSummary.riskLevel) {
    lines.push(`  Risk Finding: ${report.onDeviceSummary.riskLevel}`)
  }
  lines.push(`- Cloud AI:     [${report.cloudSummary.status.toUpperCase()}] ${report.cloudSummary.modelName}`)
  if (report.cloudSummary.riskLevel) {
    lines.push(`  Risk Finding: ${report.cloudSummary.riskLevel}`)
  }

  if (report.commonFindings.length > 0) {
    lines.push('--------------------------------------------------------')
    lines.push(`COMMON FINDINGS (CORROBORATED BY BOTH ENGINES) [${report.commonFindings.length}]:`)
    report.commonFindings.forEach((f, idx) => {
      lines.push(`  ${idx + 1}. [${f.severity.toUpperCase()}] ${f.title}`)
      lines.push(`     ${f.description}`)
    })
  }

  if (report.additionalFindings.length > 0) {
    lines.push('--------------------------------------------------------')
    lines.push(`ADDITIONAL FINDINGS [${report.additionalFindings.length}]:`)
    report.additionalFindings.forEach((f, idx) => {
      lines.push(`  ${idx + 1}. [${f.source.toUpperCase()}] [${f.severity.toUpperCase()}] ${f.title}`)
      lines.push(`     ${f.description}`)
    })
  }

  if (report.conflictingFindings.length > 0) {
    lines.push('--------------------------------------------------------')
    lines.push(`CONFLICTING FINDINGS / MODEL DIVERGENCE [${report.conflictingFindings.length}]:`)
    report.conflictingFindings.forEach((f, idx) => {
      lines.push(`  ${idx + 1}. ${f.title}`)
      lines.push(`     ${f.description}`)
      if (f.conflictReason) lines.push(`     Note: ${f.conflictReason}`)
    })
  }

  if (report.recommendedActions.length > 0) {
    lines.push('--------------------------------------------------------')
    lines.push('RECOMMENDED PROTECTIVE ACTIONS:')
    report.recommendedActions.forEach((act, idx) => {
      lines.push(`  ${idx + 1}. ${act}`)
    })
  }

  lines.push('--------------------------------------------------------')
  lines.push('LIMITATIONS & PRIVACY NOTICE:')
  report.limitations.forEach(lim => lines.push(`- ${lim}`))
  lines.push(`- ${report.privacyNotice}`)
  lines.push('========================================================')

  return lines.join('\n')
}
