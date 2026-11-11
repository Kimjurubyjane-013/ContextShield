/**
 * ContextShield - AI Analysis Types & Unified Security Report Schema
 * Supporting On-Device AI, Cloud AI, and Hybrid Synthesis.
 */

export type AnalysisRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN'

export type AnalysisMode = 'on-device' | 'cloud' | 'hybrid' | 'local'

export type ActualInferenceSource = 'on_device' | 'in_cloud' | 'local_rules'

export type HybridInferenceMode = 'PREFER_ON_DEVICE' | 'ONLY_ON_DEVICE'

export type ModelStatus = 'idle' | 'running' | 'completed' | 'unavailable' | 'failed'

export type FindingSource = 'on-device' | 'cloud' | 'both' | 'local_rules'

export type FindingSeverity = 'low' | 'medium' | 'high' | 'info'

export interface StructuredAiAnalysis {
  summary: string
  riskLevel: AnalysisRiskLevel
  suspiciousIndicators: string[]
  manipulationTactics: string[]
  evidence: string[]
  recommendedActions: string[]
  limitations: string[]
}

export interface AttemptTelemetry {
  attemptNumber: number
  startTimeMs: number
  completionTimeMs: number
  durationMs: number
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT'
  httpStatus?: number
  errorClassification?: string
  backoffDurationMs?: number
  retryType?: 'APPLICATION' | 'SDK_INTERNAL'
}

export interface LatencyBreakdown {
  initMs: number        // Firebase request initialization
  generationMs: number  // Gemini response generation
  synthesisMs: number   // Report synthesis & structure validation
  totalMs: number       // Total analysis time
  retryAttempts?: number // Number of retry attempts made (0 if first attempt succeeded)
  attemptTelemetry?: AttemptTelemetry[] // Detailed per-attempt telemetry
}

export interface AnalysisRecord extends StructuredAiAnalysis {
  id: string
  mode: AnalysisMode
  modelName: string
  analyzedAt: string
  protectedMessageLength: number
  latencyMs?: number
  latencyBreakdown?: LatencyBreakdown
  actualInferenceSource?: ActualInferenceSource
  usedInferenceMode?: HybridInferenceMode
  cloudConsentGranted?: boolean
}

export interface HybridAnalysisResult extends AnalysisRecord {
  actualInferenceSource: ActualInferenceSource
  usedInferenceMode: HybridInferenceMode
  cloudConsentGranted: boolean
}

// Alias for generic analysis result referencing
export type AnalysisResult = AnalysisRecord

export interface Evidence {
  id: string
  indicator: string
  excerpt?: string
  explanation: string
  source: FindingSource
  severity: FindingSeverity
  confidenceLabel?: string
}

export interface ModelFinding {
  id: string
  title: string
  description: string
  source: FindingSource
  severity: FindingSeverity
  evidenceList: Evidence[]
  isConflicting?: boolean
  conflictReason?: string
}

export interface RiskAssessment {
  overallRisk: AnalysisRiskLevel
  summary: string
  rationale: string
  confidenceNote: string
  isContradictory: boolean
  contradictionDetails?: string
}

export interface ModelAnalysisSummary {
  mode: AnalysisMode
  status: ModelStatus
  modelName: string
  analyzedAt?: string
  findingsCount: number
  riskLevel?: AnalysisRiskLevel
  errorMessage?: string
  findings: string[]
  evidence: string[]
  recommendations: string[]
  limitations: string[]
}

export interface UnifiedReport {
  id: string
  generatedAt: string
  protectedMessageLength: number
  protectedMessageSnippet: string
  completionStatus:
    | 'both_completed'
    | 'on_device_only'
    | 'cloud_only'
    | 'local_only'
    | 'cloud_and_local'
    | 'none_completed'
  assessment: RiskAssessment
  onDeviceSummary: ModelAnalysisSummary
  cloudSummary: ModelAnalysisSummary
  commonFindings: ModelFinding[]
  additionalFindings: ModelFinding[]
  conflictingFindings: ModelFinding[]
  allEvidence: Evidence[]
  recommendedActions: string[]
  limitations: string[]
  privacyNotice: string
  latencyBreakdown?: LatencyBreakdown
}

export type QuotaErrorCategory =
  | 'DAILY_QUOTA_EXCEEDED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TOKEN_QUOTA_EXCEEDED'
  | 'MODEL_OVERLOADED'
  | 'BILLING_REQUIRED'
  | 'UNKNOWN_ERROR'

export interface QuotaViolation {
  subject?: string
  description?: string
  quotaMetric?: string
  quotaId?: string
  quotaDimensions?: Record<string, string>
  quotaValue?: string | number
}

export interface QuotaErrorDetails {
  category: QuotaErrorCategory
  retryDelaySeconds?: number
  retryDelayText?: string
  violations: QuotaViolation[]
  quotaMetric?: string
  quotaId?: string
  quotaDimensions?: Record<string, string>
  quotaValue?: string | number
}

export type AnalysisErrorCode =
  | 'DAILY_QUOTA_EXCEEDED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TOKEN_QUOTA_EXCEEDED'
  | 'MODEL_OVERLOADED'
  | 'BILLING_REQUIRED'
  | 'UNKNOWN_ERROR'
  | 'MISSING_CONFIG'
  | 'UNSUPPORTED_BROWSER'
  | 'ON_DEVICE_UNAVAILABLE'
  | 'DEVICE_MODEL_NOT_READY'
  | 'DEVICE_DOWNLOAD_REQUIRED'
  | 'DEVICE_DOWNLOAD_FAILED'
  | 'CONSENT_REQUIRED'
  | 'MESSAGE_CHANGED'
  | 'EMPTY_PAYLOAD'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'RATE_LIMITED'
  | 'AUTH_ERROR'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN'

export interface AnalysisErrorState {
  code: AnalysisErrorCode
  title: string
  message: string
  technicalDetails?: string
  retryable: boolean
  quotaDetails?: QuotaErrorDetails
  retryDelaySeconds?: number
  retryDelayText?: string
}

export interface CloudConsentState {
  hasConsented: boolean
  consentedAt: string | null
  consentedMessageSnapshot: string | null
}

export interface HybridComparison {
  riskAlignment: 'AGREE' | 'DIVERGE' | 'SINGLE_MODEL'
  alignmentNote: string
  commonIndicators: string[]
  uniqueOnDeviceFindings: string[]
  uniqueCloudFindings: string[]
  combinedRecommendations: string[]
}

export interface OnDeviceModelReadiness {
  status: 'readily' | 'after-download' | 'downloading' | 'no' | 'unsupported' | 'error'
  downloadProgress?: number // 0 to 100
  statusMessage: string
}
