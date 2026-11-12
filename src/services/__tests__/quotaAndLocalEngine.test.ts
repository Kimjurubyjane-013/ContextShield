/**
 * ContextShield - Comprehensive Unit Tests for Phase 3:
 * Quota-Aware Error Handling, Server Retry Delays, and Local Rule-Based Security Engine.
 */

import {
  formatRetryDelay,
  isTransientError,
  normalizeAnalysisError,
  parseQuotaErrorDetails,
  parseRetryDelaySeconds,
  toAnalysisErrorState,
} from '../errorUtils.ts'
import {
  extractUrlsAndDomains,
  runLocalRuleBasedAnalysis,
} from '../localSecurityEngine.ts'
import { formatReportAsText, generateUnifiedReport } from '../hybridReportEngine.ts'
import { compareAnalyses, getCorroborationPresentation } from '../../features/analysis/analysisUtils.ts'

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      `Assertion failed: expected ${String(expected)}, got ${String(actual)}. ${message || ''}`
    )
  }
}

function assertTrue(actual: boolean, message?: string) {
  if (!actual) {
    throw new Error(`Assertion failed: expected true, got false. ${message || ''}`)
  }
}

function assertFalse(actual: boolean, message?: string) {
  if (actual) {
    throw new Error(`Assertion failed: expected false, got true. ${message || ''}`)
  }
}

export function runQuotaAndLocalEngineTests() {
  console.log('--- Running Phase 3 Quota & Local Security Engine Unit Tests ---')

  // ==========================================
  // SECTION 1: Quota Error Classification
  // ==========================================

  // 1.1 DAILY_QUOTA_EXCEEDED via violations quotaMetric
  const dailyQuotaMetricErr = {
    customErrorData: {
      status: 429,
      errorDetails: [
        {
          '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
          violations: [
            {
              subject: 'project:123456789',
              description: 'Quota exceeded for quota metric: requests_per_day',
              quotaMetric: 'generate_content_requests_per_day',
              quotaId: 'GenerateContentRequestsPerDayPerProject',
            },
          ],
        },
        {
          '@type': 'type.googleapis.com/google.rpc.RetryInfo',
          retryDelay: '34281s',
        },
      ],
    },
  }
  const dailyDetails = parseQuotaErrorDetails(dailyQuotaMetricErr)
  assertEqual(dailyDetails.category, 'DAILY_QUOTA_EXCEEDED', 'Should detect daily quota metric')
  assertEqual(dailyDetails.retryDelaySeconds, 34281, 'Should parse server retry delay')
  assertEqual(dailyDetails.retryDelayText, '9 hours 31 min', 'Should format retry delay in hours & mins')
  assertFalse(isTransientError(dailyQuotaMetricErr), 'Daily quota must never be transient')

  const dailyState = toAnalysisErrorState(dailyQuotaMetricErr)
  assertEqual(dailyState.code, 'DAILY_QUOTA_EXCEEDED')
  assertFalse(dailyState.retryable, 'Daily quota error state must not be retryable')
  assertEqual(dailyState.retryDelayText, '9 hours 31 min')
  assertTrue(dailyState.message.includes('9 hours 31 min'), 'Message should include provider reset window')

  // 1.2 DAILY_QUOTA_EXCEEDED via status 429 and long reset delay (> 3600s) without explicit metric
  const longDelay429 = {
    status: 429,
    message: 'Resource has been exhausted (e.g. check quota).',
    customErrorData: {
      errorDetails: [
        {
          '@type': 'type.googleapis.com/google.rpc.RetryInfo',
          retryDelay: '7200s',
        },
      ],
    },
  }
  const longDelayDetails = parseQuotaErrorDetails(longDelay429)
  assertEqual(longDelayDetails.category, 'DAILY_QUOTA_EXCEEDED', 'Status 429 with 2-hour delay is daily quota')
  assertEqual(longDelayDetails.retryDelayText, '2 hours')
  assertFalse(isTransientError(longDelay429), '429 with long delay is non-transient')

  // 1.3 RATE_LIMIT_EXCEEDED with short retry delay (<= 30s)
  const shortRateLimitErr = {
    status: 429,
    message: 'Resource exhausted: rate limit exceeded',
    customErrorData: {
      errorDetails: [
        {
          '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
          violations: [
            {
              quotaMetric: 'generate_content_requests_per_minute',
              description: 'Rate limit exceeded for requests_per_minute',
            },
          ],
        },
        {
          '@type': 'type.googleapis.com/google.rpc.RetryInfo',
          retryDelay: '15s',
        },
      ],
    },
  }
  const shortRateDetails = parseQuotaErrorDetails(shortRateLimitErr)
  assertEqual(shortRateDetails.category, 'RATE_LIMIT_EXCEEDED')
  assertEqual(shortRateDetails.retryDelaySeconds, 15)
  assertEqual(shortRateDetails.retryDelayText, '15 seconds')
  assertTrue(isTransientError(shortRateLimitErr), 'Short rate limit <= 30s is transient and retryable')

  const shortRateState = toAnalysisErrorState(shortRateLimitErr)
  assertEqual(shortRateState.code, 'RATE_LIMIT_EXCEEDED')
  assertTrue(shortRateState.retryable, 'Short rate limit should be retryable')
  assertTrue(shortRateState.message.includes('15 seconds'))

  // 1.4 TOKEN_QUOTA_EXCEEDED
  const tokenQuotaErr = {
    status: 429,
    message: 'Quota exceeded for quota metric: tokens_per_minute',
    details: [
      {
        '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
        violations: [
          {
            quotaMetric: 'generate_content_tokens_per_minute',
            description: 'Token quota exceeded',
          },
        ],
      },
    ],
  }
  const tokenDetails = parseQuotaErrorDetails(tokenQuotaErr)
  assertEqual(tokenDetails.category, 'TOKEN_QUOTA_EXCEEDED')
  assertFalse(isTransientError(tokenQuotaErr), 'Token quota must not retry without payload adjustment')
  const tokenState = toAnalysisErrorState(tokenQuotaErr)
  assertEqual(tokenState.code, 'TOKEN_QUOTA_EXCEEDED')
  assertFalse(tokenState.retryable)

  // 1.5 BILLING_REQUIRED
  const billingDisabledErr = {
    status: 403,
    message: 'Cloud Billing API has not been used in project 123456 or it is disabled.',
    customErrorData: {
      errorDetails: [
        {
          '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
          reason: 'BILLING_DISABLED',
          domain: 'googleapis.com',
        },
      ],
    },
  }
  const billingDetails = parseQuotaErrorDetails(billingDisabledErr)
  assertEqual(billingDetails.category, 'BILLING_REQUIRED')
  assertFalse(isTransientError(billingDisabledErr), 'Billing required must never retry')
  const billingState = toAnalysisErrorState(billingDisabledErr)
  assertEqual(billingState.code, 'BILLING_REQUIRED')
  assertFalse(billingState.retryable)

  // 1.6 MODEL_OVERLOADED (503 / 504 / overloaded)
  const overload503 = {
    status: 503,
    message: 'The model is overloaded. Please try again later.',
  }
  const overloadDetails = parseQuotaErrorDetails(overload503)
  assertEqual(overloadDetails.category, 'MODEL_OVERLOADED')
  assertTrue(isTransientError(overload503), 'Model overloaded is transient and retryable')
  const overloadState = toAnalysisErrorState(overload503)
  assertEqual(overloadState.code, 'MODEL_OVERLOADED')
  assertTrue(overloadState.retryable)

  // 1.7 UNKNOWN_ERROR
  const genericErr = new Error('A completely strange error happened')
  const genericDetails = parseQuotaErrorDetails(genericErr)
  assertEqual(genericDetails.category, 'UNKNOWN_ERROR')

  // ==========================================
  // SECTION 2: Retry Delay Helper Tests
  // ==========================================

  // 2.1 parseRetryDelaySeconds edge cases
  assertEqual(parseRetryDelaySeconds(null), undefined)
  assertEqual(parseRetryDelaySeconds(undefined), undefined)
  assertEqual(parseRetryDelaySeconds(''), undefined)
  assertEqual(parseRetryDelaySeconds({ retryAfter: 45 }), 45)
  assertEqual(parseRetryDelaySeconds({ headers: { 'retry-after': '60' } }), 60)
  assertEqual(parseRetryDelaySeconds({ message: 'Error: retryDelay: "45s"' }), 45)
  assertEqual(parseRetryDelaySeconds({ message: 'Please retry after 30 s' }), 30)

  // 2.2 formatRetryDelay edge cases
  assertEqual(formatRetryDelay(undefined), undefined, 'Never fabricates a time when undefined')
  assertEqual(formatRetryDelay(0), undefined)
  assertEqual(formatRetryDelay(-10), undefined)
  assertEqual(formatRetryDelay(1), '1 second')
  assertEqual(formatRetryDelay(45), '45 seconds')
  assertEqual(formatRetryDelay(60), '1 min')
  assertEqual(formatRetryDelay(125), '2 min 5 sec')
  assertEqual(formatRetryDelay(3600), '1 hour')
  assertEqual(formatRetryDelay(34281), '9 hours 31 min')

  // ==========================================
  // SECTION 3: Local Rule-Based Security Engine
  // ==========================================

  // 3.1 High-risk credential harvesting & urgency
  const phishSample =
    'URGENT: Your PayPal account has been suspended! Verify your identity immediately within 24 hours at http://192.168.1.50/verify to prevent termination. Enter your password and OTP.'
  const localPhishResult = runLocalRuleBasedAnalysis(phishSample)

  assertEqual(localPhishResult.riskLevel, 'HIGH')
  assertEqual(localPhishResult.modelName, 'Local Rule-Based Analysis')
  assertEqual(localPhishResult.actualInferenceSource, 'local_rules')
  assertEqual(localPhishResult.mode, 'local')
  assertTrue(localPhishResult.suspiciousIndicators.length >= 3)
  assertTrue(localPhishResult.evidence.length >= 2)
  assertTrue(localPhishResult.recommendedActions.length >= 2)
  assertTrue(localPhishResult.limitations.some(l => l.includes('Deterministic evaluation')))
  // Guarantee NO false Gemini Nano or Cloud attribution
  assertEqual(localPhishResult.actualInferenceSource, 'local_rules', 'Inference source must strictly be local_rules')
  assertFalse(localPhishResult.modelName.includes('Gemini Nano'), 'Must never claim Gemini Nano')
  assertFalse(localPhishResult.modelName.includes('Gemini Cloud'), 'Must never claim Gemini Cloud')

  // 3.2 URL and domain extraction (IP hosts, suspicious TLDs, shortened URLs)
  const urlSample =
    'Click here: http://bit.ly/claim-prize and https://secure-login.xyz/auth?code=123'
  const extracted = extractUrlsAndDomains(urlSample)
  assertEqual(extracted.length, 2)
  assertTrue(extracted.some(u => u.isShortener), 'Should detect bit.ly shortened link')
  assertTrue(extracted.some(u => u.hasSuspiciousTld), 'Should detect .xyz suspicious TLD')

  // 3.3 Benign message
  const benignSample = 'Hi Sarah, are we still having dinner at the restaurant tomorrow at 7pm?'
  const localBenignResult = runLocalRuleBasedAnalysis(benignSample)
  assertEqual(localBenignResult.riskLevel, 'LOW')
  assertEqual(localBenignResult.suspiciousIndicators.length, 0)
  assertEqual(localBenignResult.manipulationTactics.length, 0)

  // 3.4 Empty payload handling
  const emptyResult = runLocalRuleBasedAnalysis('   ')
  assertEqual(emptyResult.riskLevel, 'LOW')
  assertTrue(emptyResult.summary.includes('No text content'))

  // 3.5 Masked tokens analysis
  const maskedSample =
    'Your [ORGANIZATION_1] account is locked. Please send [PASSWORD_1] and [PIN_1] to confirm [IDENTITY_CARD_1].'
  const maskedResult = runLocalRuleBasedAnalysis(maskedSample)
  assertEqual(maskedResult.riskLevel, 'HIGH')
  assertTrue(maskedResult.evidence.some(e => e.toLowerCase().includes('password') || e.includes('credential')), 'Should capture password pattern in evidence')

  // 3.6 False-Positive Resistance on Everyday Sentences
  const benignApple = 'I ate a delicious apple for lunch while sitting on the river bank.'
  const benignAppleResult = runLocalRuleBasedAnalysis(benignApple)
  assertEqual(benignAppleResult.riskLevel, 'LOW', 'Eating an apple on river bank must be LOW')
  assertEqual(benignAppleResult.suspiciousIndicators.length, 0, 'Must not falsely trigger Apple or Bank impersonation')

  const benignLockedDoor = 'I locked the front door before leaving the house yesterday.'
  const benignLockedResult = runLocalRuleBasedAnalysis(benignLockedDoor)
  assertEqual(benignLockedResult.riskLevel, 'LOW', 'Locking front door must not trigger account lockout')
  assertEqual(benignLockedResult.suspiciousIndicators.length, 0)

  const benignPrime = 'The prime minister spoke about postal delivery times.'
  const benignPrimeResult = runLocalRuleBasedAnalysis(benignPrime)
  assertEqual(benignPrimeResult.riskLevel, 'LOW', 'Prime minister must not trigger Amazon Prime')
  assertEqual(benignPrimeResult.suspiciousIndicators.length, 0)

  // ==========================================
  // SECTION 4: Architecture & Attribution Guards
  // ==========================================

  // 4.1 Normalized error codes alignment
  const normalized429Daily = normalizeAnalysisError(dailyQuotaMetricErr)
  assertEqual(normalized429Daily.suggestedErrorCode, 'DAILY_QUOTA_EXCEEDED')
  assertFalse(normalized429Daily.isTransient)

  const normalized429Short = normalizeAnalysisError(shortRateLimitErr)
  assertEqual(normalized429Short.suggestedErrorCode, 'RATE_LIMIT_EXCEEDED')
  assertTrue(normalized429Short.isTransient)

  // 4.2 Unified Report Attribution: Local Rules must NEVER produce 'both_completed' or 'on_device_only'
  const localOnlyReport = generateUnifiedReport({
    protectedMessage: phishSample,
    onDeviceResult: localPhishResult,
    cloudResult: null,
  })
  assertEqual(localOnlyReport.completionStatus, 'local_only', 'Status must be local_only, NEVER on_device_only')
  assertEqual(localOnlyReport.commonFindings.length, 0, 'Local-only report must have 0 common findings')
  assertTrue(
    localOnlyReport.additionalFindings.every(f => f.source === 'local_rules'),
    'Findings must be attributed to local_rules, NEVER on-device'
  )
  assertTrue(
    localOnlyReport.assessment.confidenceNote.includes('No machine learning'),
    'Confidence note must honestly state no ML'
  )

  // 4.3 Multi-Paradigm (Cloud + Local Rules): Must be 'cloud_and_local', NEVER 'both_completed'
  const dummyCloud: typeof localPhishResult = {
    ...localPhishResult,
    id: 'cloud-test-sample',
    mode: 'cloud',
    modelName: 'Gemini 3.5 Flash-Lite (Firebase AI Logic Cloud)',
    actualInferenceSource: 'in_cloud',
  }
  const multiReport = generateUnifiedReport({
    protectedMessage: phishSample,
    onDeviceResult: localPhishResult,
    cloudResult: dummyCloud,
  })
  assertEqual(multiReport.completionStatus, 'cloud_and_local', 'Status must be cloud_and_local, NEVER both_completed')
  assertFalse(
    multiReport.assessment.confidenceNote.includes('Dual-AI'),
    'Must never claim Dual-AI consensus when one is local rules'
  )

  // 4.4 Comparison Engine: Local Rules must not claim AI consensus
  const comp = compareAnalyses(localPhishResult, dummyCloud)
  assertTrue(comp !== null)
  assertTrue(
    comp!.alignmentNote.includes('Heuristic verification') || comp!.alignmentNote.includes('local rules do not constitute a second AI model'),
    'Comparison note must state local rules do not constitute a second AI model'
  )

  // 4.5 Exported Text & Source Attribution for cloud_and_local vs local_only vs cloud_only vs both_completed
  assertEqual(multiReport.onDeviceSummary.mode, 'local', 'cloud_and_local must attribute local engine as local')
  const multiText = formatReportAsText(multiReport)
  assertTrue(multiText.includes('- Local Rules:'), 'Exported text must label Local Rules honestly')
  assertFalse(multiText.includes('- On-Device AI:'), 'Exported text must NEVER label local_rules as On-Device AI')
  assertFalse(multiText.includes('Dual-AI'), 'Exported text must NEVER claim Dual-AI for cloud_and_local')
  if (multiReport.commonFindings.length > 0) {
    assertTrue(
      multiText.includes('CORROBORATED BY CLOUD AI & LOCAL RULES'),
      'Exported text must attribute corroborated findings to Cloud AI & Local Rules'
    )
    assertFalse(
      multiText.includes('CORROBORATED BY BOTH AI MODELS'),
      'Exported text must NEVER claim both AI models corroborated cloud_and_local findings'
    )
  }

  assertEqual(localOnlyReport.onDeviceSummary.mode, 'local')
  const localOnlyText = formatReportAsText(localOnlyReport)
  assertTrue(localOnlyText.includes('- Local Rules:'))
  assertFalse(localOnlyText.includes('- On-Device AI:'))

  const cloudOnlyReport = generateUnifiedReport({
    protectedMessage: phishSample,
    onDeviceResult: null,
    cloudResult: dummyCloud,
  })
  assertEqual(cloudOnlyReport.completionStatus, 'cloud_only')
  assertEqual(cloudOnlyReport.commonFindings.length, 0, 'cloud_only must have 0 common findings')
  const cloudOnlyComp = compareAnalyses(null, dummyCloud)
  assertTrue(cloudOnlyComp !== null)
  assertEqual(cloudOnlyComp!.riskAlignment, 'SINGLE_MODEL')
  assertEqual(cloudOnlyComp!.commonIndicators.length, 0)

  // Genuine On-Device AI + Cloud AI (both_completed)
  const actualOnDeviceResult: typeof localPhishResult = {
    ...localPhishResult,
    id: 'on-device-test-sample',
    mode: 'on-device',
    modelName: 'Gemini Nano (Chrome Prompt API)',
    actualInferenceSource: 'on_device',
  }
  const bothAiReport = generateUnifiedReport({
    protectedMessage: phishSample,
    onDeviceResult: actualOnDeviceResult,
    cloudResult: dummyCloud,
  })
  assertEqual(bothAiReport.completionStatus, 'both_completed', 'Genuine on_device + in_cloud must produce both_completed')
  assertEqual(bothAiReport.onDeviceSummary.mode, 'on-device')
  const bothAiText = formatReportAsText(bothAiReport)
  assertTrue(bothAiText.includes('- On-Device AI:'))
  if (bothAiReport.commonFindings.length > 0) {
    assertTrue(bothAiText.includes('CORROBORATED BY BOTH AI MODELS'))
  }

  // Unattributed on-device record (neither 'on_device' nor 'local_rules') must be excluded
  const unattributedOnDevice: typeof localPhishResult = {
    ...localPhishResult,
    id: 'unattributed-on-device',
    mode: 'on-device',
    actualInferenceSource: undefined,
  }
  const excludedReport = generateUnifiedReport({
    protectedMessage: phishSample,
    onDeviceResult: unattributedOnDevice,
    cloudResult: dummyCloud,
  })
  assertEqual(excludedReport.completionStatus, 'cloud_only', 'Unattributed on-device record must be excluded')
  assertEqual(excludedReport.onDeviceSummary.status, 'unavailable')
  assertEqual(excludedReport.commonFindings.length, 0)
  const excludedComp = compareAnalyses(unattributedOnDevice, dummyCloud)
  assertTrue(excludedComp !== null)
  assertEqual(excludedComp!.riskAlignment, 'SINGLE_MODEL')
  assertEqual(excludedComp!.commonIndicators.length, 0)

  // 4.6 Phase 4.7: Strict Cloud Inference Attribution (actualInferenceSource === 'in_cloud' only)
  const validCloudComp = compareAnalyses(null, dummyCloud)
  assertTrue(validCloudComp !== null, 'Valid in_cloud record must be accepted')
  assertEqual(validCloudComp!.riskAlignment, 'SINGLE_MODEL')
  assertTrue(validCloudComp!.uniqueCloudFindings.length > 0)

  const missingSourceCloud: typeof localPhishResult = {
    ...dummyCloud,
    id: 'cloud-missing-source',
    mode: 'cloud',
    actualInferenceSource: undefined,
  }
  assertEqual(
    compareAnalyses(null, missingSourceCloud),
    null,
    'Cloud mode with missing actualInferenceSource must be excluded'
  )
  const missingCloudWithLocalComp = compareAnalyses(localPhishResult, missingSourceCloud)
  assertTrue(missingCloudWithLocalComp !== null)
  assertEqual(missingCloudWithLocalComp!.riskAlignment, 'SINGLE_MODEL')
  assertEqual(missingCloudWithLocalComp!.commonIndicators.length, 0, 'Missing-source cloud record must not create corroboration')
  assertEqual(missingCloudWithLocalComp!.uniqueCloudFindings.length, 0)

  const localRulesTaggedCloud: typeof localPhishResult = {
    ...dummyCloud,
    id: 'cloud-local-rules-source',
    mode: 'cloud',
    actualInferenceSource: 'local_rules',
  }
  assertEqual(
    compareAnalyses(null, localRulesTaggedCloud),
    null,
    'Cloud mode with actualInferenceSource local_rules must be excluded from cloud comparison'
  )
  const localTaggedCloudWithLocalComp = compareAnalyses(localPhishResult, localRulesTaggedCloud)
  assertTrue(localTaggedCloudWithLocalComp !== null)
  assertEqual(localTaggedCloudWithLocalComp!.riskAlignment, 'SINGLE_MODEL')
  assertEqual(localTaggedCloudWithLocalComp!.commonIndicators.length, 0, 'local_rules-tagged cloud record must not create corroboration')
  assertEqual(localTaggedCloudWithLocalComp!.uniqueCloudFindings.length, 0)

  assertEqual(
    compareAnalyses(unattributedOnDevice, missingSourceCloud),
    null,
    'Unattributed on-device and unattributed cloud records must both be excluded'
  )
  assertEqual(compareAnalyses(null, null), null)

  // 4.7 Corroboration Presentation Guard (Cloud-only, Local-only, Cloud + Local Rules, Gemini Nano + Cloud)
  const cloudOnlyPres = getCorroborationPresentation(null, dummyCloud)
  assertFalse(cloudOnlyPres.hasValidCorroborationPair, 'Cloud-only must NOT have a valid corroboration pair')
  assertFalse(cloudOnlyPres.subtitle.includes('Gemini Nano'), 'Cloud-only must NEVER mention Gemini Nano corroboration')
  assertEqual(cloudOnlyPres.heading, 'Non-Corroborated Findings')

  const localOnlyPres = getCorroborationPresentation(localPhishResult, null)
  assertFalse(localOnlyPres.hasValidCorroborationPair, 'Local-only must NOT have a valid corroboration pair')
  assertFalse(localOnlyPres.subtitle.includes('Gemini Nano'))
  assertEqual(localOnlyPres.heading, 'Non-Corroborated Findings')

  const cloudAndLocalPres = getCorroborationPresentation(localPhishResult, dummyCloud)
  assertTrue(cloudAndLocalPres.hasValidCorroborationPair, 'Cloud + Local Rules is a valid corroboration pair')
  assertEqual(cloudAndLocalPres.heading, 'Corroborated Indicators')
  assertTrue(cloudAndLocalPres.subtitle.includes('Cloud AI and deterministic Local Rules'))
  assertFalse(cloudAndLocalPres.subtitle.includes('Gemini Nano'))

  const nanoAndCloudPres = getCorroborationPresentation(actualOnDeviceResult, dummyCloud)
  assertTrue(nanoAndCloudPres.hasValidCorroborationPair, 'Actual Gemini Nano + Cloud is a valid corroboration pair')
  assertEqual(nanoAndCloudPres.heading, 'Corroborated Indicators')
  assertTrue(nanoAndCloudPres.subtitle.includes('On-Device Gemini Nano and Cloud AI'))

  const invalidPairPres = getCorroborationPresentation(unattributedOnDevice, missingSourceCloud)
  assertFalse(invalidPairPres.hasValidCorroborationPair, 'Invalid pair must NEVER allow corroboration')
  assertEqual(invalidPairPres.heading, 'Non-Corroborated Findings')

  console.log('✓ All Quota & Local Security Engine unit test assertions passed successfully!')
}

runQuotaAndLocalEngineTests()
