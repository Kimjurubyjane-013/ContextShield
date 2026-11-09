/**
 * ContextShield - Unit Tests for Hybrid Intelligence Synthesis & Severity Consistency
 * Tests Task 3 (reconciliation logic, cloud-only vs dual-model, zero false common indicators)
 * and Task 4 (severity consistency, explainable risk aggregation).
 */

import { compareAnalyses } from '../../features/analysis/analysisUtils.ts'
import type { AnalysisRecord } from '../../features/analysis/types.ts'
import {
  generateUnifiedReport,
  inferFindingSeverity,
} from '../hybridReportEngine.ts'

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      `Assertion failed: expected ${String(expected)}, got ${String(actual)}. ${message || ''}`
    )
  }
}

export function runHybridSynthesisTests() {
  console.log('--- Running Hybrid Intelligence Synthesis unit tests ---')

  const dummyCloudResult: AnalysisRecord = {
    id: 'cloud-test-1',
    mode: 'cloud',
    modelName: 'Gemini 3.8 Flash (Firebase AI Logic Cloud)',
    summary: 'The message is a phishing attempt warning of account suspension to steal credentials via an unknown link.',
    riskLevel: 'HIGH',
    suspiciousIndicators: [
      'Account suspension notice creating false urgency',
      'Verify identity request via unknown link destination',
      'Suspicious unverified sender identity',
      'Coercive psychological pressure',
    ],
    manipulationTactics: ['Urgency', 'Authority Impersonation', 'Fear of Lockout'],
    evidence: [
      'Your account has been suspended',
      'Please verify your identity through this unknown link',
    ],
    recommendedActions: [
      'Do not click the embedded link',
      'Contact your provider through official channels',
    ],
    limitations: ['Evaluated sanitized message text only'],
    analyzedAt: new Date().toISOString(),
    protectedMessageLength: 85,
    actualInferenceSource: 'in_cloud',
  }

  const dummyOnDeviceResult: AnalysisRecord = {
    id: 'od-test-1',
    mode: 'on-device',
    modelName: 'Gemini Nano (Chrome Prompt API On-Device)',
    summary: 'Detected false urgency and unknown link pattern.',
    riskLevel: 'HIGH',
    suspiciousIndicators: [
      'False urgency regarding account status',
      'Direct request to click external link',
    ],
    manipulationTactics: ['Artificial Urgency'],
    evidence: ['account has been suspended', 'unknown link'],
    recommendedActions: ['Do not click unknown links'],
    limitations: ['Local on-device pattern match only'],
    analyzedAt: new Date().toISOString(),
    protectedMessageLength: 85,
    actualInferenceSource: 'on_device',
  }

  // TEST 1: Task 3 - Cloud-Only Analysis MUST return ZERO common indicators
  const cloudOnlyComparison = compareAnalyses(null, dummyCloudResult)
  assertEqual(cloudOnlyComparison !== null, true, 'Comparison must not be null')
  assertEqual(cloudOnlyComparison!.commonIndicators.length, 0, 'Cloud-only comparison MUST have 0 common indicators')
  assertEqual(cloudOnlyComparison!.uniqueCloudFindings.length, 4, 'All cloud findings must be in uniqueCloudFindings')
  assertEqual(cloudOnlyComparison!.uniqueOnDeviceFindings.length, 0, 'On-device findings must be 0')
  assertEqual(cloudOnlyComparison!.riskAlignment, 'SINGLE_MODEL')
  assertEqual(cloudOnlyComparison!.alignmentNote.includes('Cloud-Only Evaluation'), true)

  // TEST 2: Task 3 - On-Device-Only Analysis MUST return ZERO common indicators
  const onDeviceOnlyComparison = compareAnalyses(dummyOnDeviceResult, null)
  assertEqual(onDeviceOnlyComparison !== null, true)
  assertEqual(onDeviceOnlyComparison!.commonIndicators.length, 0, 'On-device only comparison MUST have 0 common indicators')
  assertEqual(onDeviceOnlyComparison!.uniqueOnDeviceFindings.length, 2)
  assertEqual(onDeviceOnlyComparison!.uniqueCloudFindings.length, 0)
  assertEqual(onDeviceOnlyComparison!.riskAlignment, 'SINGLE_MODEL')
  assertEqual(onDeviceOnlyComparison!.alignmentNote.includes('On-Device-Only Evaluation'), true)

  // TEST 3: Task 3 - Dual-Model Consensus MUST find genuine common overlap
  const dualComparison = compareAnalyses(dummyOnDeviceResult, dummyCloudResult)
  assertEqual(dualComparison !== null, true)
  assertEqual(dualComparison!.riskAlignment, 'AGREE')
  assertEqual(dualComparison!.commonIndicators.length > 0, true, 'Dual-model comparison must detect overlapping indicators')

  // TEST 4: Task 4 - Severity Consistency with inferFindingSeverity
  assertEqual(inferFindingSeverity('Account suspension notice creating false urgency'), 'high')
  assertEqual(inferFindingSeverity('Verify identity request via unknown link'), 'high')
  assertEqual(inferFindingSeverity('Direct credential harvesting attempt'), 'high')
  assertEqual(inferFindingSeverity('Unknown link destination', undefined, 'HIGH'), 'high')
  assertEqual(inferFindingSeverity('Shortened URL redirect', undefined, 'LOW'), 'medium')
  assertEqual(inferFindingSeverity('Minor formatting anomaly', undefined, 'LOW'), 'low')

  // TEST 5: Task 3 & 4 - generateUnifiedReport for Cloud-Only Evaluation
  const cloudOnlyReport = generateUnifiedReport({
    protectedMessage: 'Your account has been suspended. Please verify your identity through this unknown link.',
    onDeviceResult: null,
    cloudResult: dummyCloudResult,
    onDeviceStatus: 'unavailable',
    cloudStatus: 'completed',
  })

  assertEqual(cloudOnlyReport.completionStatus, 'cloud_only')
  assertEqual(cloudOnlyReport.commonFindings.length, 0, 'Unified report commonFindings MUST be 0 when on-device is unavailable')
  assertEqual(cloudOnlyReport.additionalFindings.length, 4, 'All 4 findings must be in additionalFindings')
  assertEqual(cloudOnlyReport.assessment.overallRisk, 'HIGH')
  assertEqual(cloudOnlyReport.assessment.summary.startsWith('Cloud-Only Evaluation'), true)
  assertEqual(cloudOnlyReport.assessment.confidenceNote.includes('Single-engine cloud evaluation'), true)

  // Verify that findings in cloud-only report have consistent high severity matching the HIGH overall risk
  const highSeverityFindings = cloudOnlyReport.additionalFindings.filter(f => f.severity === 'high')
  assertEqual(highSeverityFindings.length >= 2, true, 'At least 2 indicators must be high severity to support overall HIGH risk')

  // TEST 6: Dual-Model generateUnifiedReport
  const dualReport = generateUnifiedReport({
    protectedMessage: 'Your account has been suspended. Please verify your identity through this unknown link.',
    onDeviceResult: dummyOnDeviceResult,
    cloudResult: dummyCloudResult,
    onDeviceStatus: 'completed',
    cloudStatus: 'completed',
  })

  assertEqual(dualReport.completionStatus, 'both_completed')
  assertEqual(dualReport.commonFindings.length > 0, true, 'Dual report must contain corroborated common findings')
  assertEqual(dualReport.assessment.confidenceNote.includes('Dual-engine consensus'), true)

  console.log('✓ All Hybrid Intelligence Synthesis & Severity tests passed successfully!')
}

runHybridSynthesisTests()
