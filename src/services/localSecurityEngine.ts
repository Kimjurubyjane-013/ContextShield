/**
 * ContextShield - Local Rule-Based Security Engine
 * 100% deterministic, offline client-side security evaluation.
 *
 * Requirements (Phase 3):
 * - Independent local pattern matching, URL/domain extraction, urgency & impersonation checks.
 * - Clearly labeled as "Local Rule-Based Analysis".
 * - Never claims to be or fabricates Gemini Nano or Gemini Cloud results.
 * - Does not use network, external APIs, or browser flags.
 */

import type { AnalysisRecord, AnalysisRiskLevel } from '@/features/analysis/types'

export interface ExtractedUrlInfo {
  url: string
  domain: string
  isIpAddress: boolean
  isShortener: boolean
  hasSuspiciousTld: boolean
}

export interface LocalSecurityIndicators {
  urgencyDetected: boolean
  impersonationDetected: boolean
  credentialHarvestingDetected: boolean
  financialFraudDetected: boolean
  suspiciousLinksDetected: boolean
  indicators: string[]
  manipulationTactics: string[]
  evidence: string[]
  extractedUrls: ExtractedUrlInfo[]
  recommendations: string[]
}

const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'rebrand.ly',
  'cutt.ly',
  'shorturl.at',
])

const SUSPICIOUS_TLDS = new Set([
  '.xyz',
  '.top',
  '.ru',
  '.click',
  '.work',
  '.link',
  '.live',
  '.tk',
  '.ml',
  '.ga',
  '.cf',
  '.gq',
  '.buzz',
  '.fit',
  '.rest',
  '.download',
  '.stream',
])

const IP_HOST_REGEX = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$/
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`[\]]+/gi

// Redacted URL tokens from ContextShield PII masker
const REDACTED_URL_REGEX = /\[REDACTED_LINK_\d+\]|\[UNKNOWN_LINK\]|\[LINK\]/gi

/**
 * Extracts URLs and domains from text, checking for suspicious patterns.
 */
export function extractUrlsAndDomains(text: string): ExtractedUrlInfo[] {
  const results: ExtractedUrlInfo[] = []
  const seen = new Set<string>()

  // 1. Match standard URLs
  const matches = text.match(URL_REGEX) || []
  for (const rawUrl of matches) {
    if (seen.has(rawUrl.toLowerCase())) continue
    seen.add(rawUrl.toLowerCase())

    let domain = ''
    try {
      const fullUrl = rawUrl.startsWith('www.') ? `http://${rawUrl}` : rawUrl
      const parsed = new URL(fullUrl)
      domain = parsed.hostname.toLowerCase()
    } catch {
      const parts = rawUrl.replace(/^https?:\/\//i, '').split(/[/?#]/)
      domain = parts[0]?.toLowerCase() || ''
    }

    const isIpAddress = IP_HOST_REGEX.test(domain)
    const isShortener = URL_SHORTENERS.has(domain)
    const hasSuspiciousTld = Array.from(SUSPICIOUS_TLDS).some(tld => domain.endsWith(tld))

    results.push({
      url: rawUrl,
      domain,
      isIpAddress,
      isShortener,
      hasSuspiciousTld,
    })
  }

  // 2. Check for masked link references
  const maskedMatches = text.match(REDACTED_URL_REGEX) || []
  for (const token of maskedMatches) {
    if (seen.has(token.toLowerCase())) continue
    seen.add(token.toLowerCase())
    results.push({
      url: token,
      domain: 'masked-external-destination',
      isIpAddress: false,
      isShortener: false,
      hasSuspiciousTld: false,
    })
  }

  return results
}

/**
 * Runs deterministic security inspection using pattern matching dictionaries.
 */
export function inspectSecurityPatterns(text: string): LocalSecurityIndicators {
  const lower = text.toLowerCase()
  const indicators: string[] = []
  const manipulationTactics: string[] = []
  const evidence: string[] = []
  const recommendations: string[] = []

  let urgencyDetected = false
  let impersonationDetected = false
  let credentialHarvestingDetected = false
  let financialFraudDetected = false
  let suspiciousLinksDetected = false

  // 1. URL & Link Inspection
  const extractedUrls = extractUrlsAndDomains(text)
  if (extractedUrls.length > 0) {
    suspiciousLinksDetected = true
    for (const urlInfo of extractedUrls) {
      if (urlInfo.isIpAddress) {
        indicators.push(`Direct IP address used as link host: "${urlInfo.domain}"`)
        evidence.push(urlInfo.url)
        recommendations.push('Never navigate to links utilizing raw IP addresses instead of trusted domain names.')
      } else if (urlInfo.isShortener) {
        indicators.push(`Shortened URL obscuring destination: "${urlInfo.domain}"`)
        evidence.push(urlInfo.url)
        recommendations.push('Do not click shortened URLs; use a link expander or verify through official channels.')
      } else if (urlInfo.hasSuspiciousTld) {
        indicators.push(`Suspicious or high-risk top-level domain: "${urlInfo.domain}"`)
        evidence.push(urlInfo.url)
      } else if (urlInfo.domain === 'masked-external-destination') {
        indicators.push('External link destination referenced in message')
        evidence.push(urlInfo.url)
      } else {
        indicators.push(`External link reference: "${urlInfo.domain}"`)
        evidence.push(urlInfo.url)
      }
    }
  } else if (
    lower.includes('unknown link') ||
    lower.includes('this link') ||
    lower.includes('click here') ||
    lower.includes('click the link') ||
    lower.includes('following link')
  ) {
    suspiciousLinksDetected = true
    indicators.push('Call-to-action urging user to visit an external link')
    evidence.push('link reference in text')
  }

  // 2. Urgency & Coercion Patterns
  const urgencyPatterns = [
    { pattern: 'account has been suspended', label: 'Account suspension notification creating immediate panic' },
    { pattern: 'account suspended', label: 'Account suspension notification' },
    { pattern: 'service suspended', label: 'Service suspension alert' },
    { pattern: 'temporarily suspended', label: 'Suspension alert' },
    { pattern: 'account is locked', label: 'Account lockout notification' },
    { pattern: 'account locked', label: 'Account lockout notification' },
    { pattern: 'account has been locked', label: 'Account lockout notification' },
    { pattern: 'card is locked', label: 'Payment card lock notification' },
    { pattern: 'access is locked', label: 'Access lock notification' },
    { pattern: 'locked out', label: 'Account lockout alert' },
    { pattern: 'account is restricted', label: 'Account restriction notice' },
    { pattern: 'account restricted', label: 'Account restriction notice' },
    { pattern: 'access restricted', label: 'Access restriction notice' },
    { pattern: 'will be locked', label: 'Threat of account lockout' },
    { pattern: 'will be terminated', label: 'Threat of immediate service termination' },
    { pattern: 'within 24 hours', label: 'Artificial 24-hour urgency deadline' },
    { pattern: 'within 12 hours', label: 'Artificial urgency deadline' },
    { pattern: 'immediate action', label: 'Demand for immediate action' },
    { pattern: 'urgent action', label: 'Demand for urgent action' },
    { pattern: 'act now', label: 'Artificial pressure to act immediately' },
    { pattern: 'final notice', label: 'Coercive final notice claim' },
    { pattern: 'last warning', label: 'Threatening last warning claim' },
    { pattern: 'unauthorized login', label: 'Unverified unauthorized login claim' },
    { pattern: 'suspicious activity detected', label: 'Security alert claiming unauthorized activity' },
  ]

  for (const { pattern, label } of urgencyPatterns) {
    if (lower.includes(pattern)) {
      urgencyDetected = true
      indicators.push(label)
      manipulationTactics.push('Artificial Urgency', 'Fear of Service Disruption')
      evidence.push(pattern)
      break
    }
  }

  // 3. Credential Harvesting Patterns
  const credentialPatterns = [
    { pattern: 'verify your identity', label: 'Direct request to verify personal identity' },
    { pattern: 'verify identity', label: 'Identity verification demand' },
    { pattern: 'confirm your password', label: 'Request to confirm account password' },
    { pattern: 'enter your password', label: 'Prompt to submit account password' },
    { pattern: 'verify your password', label: 'Prompt to verify password' },
    { pattern: 'send your password', label: 'Solicitation of account password' },
    { pattern: 'reset your password', label: 'Prompt to reset account password' },
    { pattern: 'your password has expired', label: 'Password expiration alert' },
    { pattern: 'enter your otp', label: 'Request to disclose one-time passcode (OTP)' },
    { pattern: 'confirm your otp', label: 'Prompt to share one-time passcode (OTP)' },
    { pattern: 'send your otp', label: 'Request to disclose one-time passcode (OTP)' },
    { pattern: 'enter otp', label: 'Request to disclose one-time passcode (OTP)' },
    { pattern: 'one-time password', label: 'Solicitation of one-time password' },
    { pattern: 'verification code', label: 'Reference to verification security code' },
    { pattern: 'claim code', label: 'Claim code voucher verification' },
    { pattern: 'login to verify', label: 'Request to log in via external prompt' },
    { pattern: 'update your billing', label: 'Request to update billing details' },
    { pattern: 'restore access', label: 'Coercive prompt to restore account access' },
    { pattern: 'enter your pin', label: 'Request to disclose secret PIN' },
    { pattern: 'confirm your pin', label: 'Request to disclose secret PIN' },
    { pattern: 'atm pin', label: 'Request for ATM PIN' },
    { pattern: 'security pin', label: 'Request for security PIN' },
    { pattern: 'your password', label: 'Reference to user password' },
    { pattern: '[password', label: 'Solicitation of masked sensitive password data' },
    { pattern: '[pin', label: 'Solicitation of masked PIN data' },
    { pattern: '[identity_card', label: 'Solicitation of sensitive national identity credentials' },
    { pattern: '[credit_card', label: 'Solicitation of payment card numbers' },
  ]

  for (const { pattern, label } of credentialPatterns) {
    if (lower.includes(pattern)) {
      credentialHarvestingDetected = true
      indicators.push(label)
      manipulationTactics.push('Credential Solicitation', 'Identity Extraction')
      evidence.push(pattern)
      break
    }
  }

  // 4. Impersonation Patterns (Context-aware to prevent false positives on common words)
  const impersonationEntities = [
    { entity: 'WavePay', keywords: ['wavepay', 'wave money', 'wave account'] },
    { entity: 'KBZPay', keywords: ['kpay', 'kbzpay', 'kbz bank'] },
    { entity: 'PayPal', keywords: ['paypal'] },
    { entity: 'Google', keywords: ['google account', 'google security', 'google support', 'gmail alert'] },
    { entity: 'Apple', keywords: ['apple id', 'apple support', 'apple security', 'apple account', 'apple pay', 'apple inc', 'icloud'] },
    { entity: 'Microsoft', keywords: ['microsoft account', 'microsoft security', 'office 365', 'outlook security'] },
    { entity: 'Amazon', keywords: ['amazon order', 'amazon prime', 'amazon account', 'amazon security', 'amazon support'] },
    { entity: 'Netflix', keywords: ['netflix account', 'netflix subscription', 'netflix payment'] },
    { entity: 'Meta/Facebook', keywords: ['facebook security', 'facebook support', 'instagram security', 'meta business'] },
    { entity: 'Bank/Financial', keywords: ['bank account', 'your bank', 'bank security', 'bank alert', 'online banking', 'credit union', 'card services', 'visa card', 'mastercard'] },
    { entity: 'Telecom Carrier', keywords: ['sim card', 'telecom support', 'mobile carrier', 'cellular account', 'cellular service'] },
    { entity: 'Delivery/Courier', keywords: ['fedex package', 'dhl tracking', 'ups delivery', 'package delivery fee', 'missed parcel delivery'] },
  ]

  for (const { entity, keywords } of impersonationEntities) {
    if (keywords.some(k => lower.includes(k))) {
      impersonationDetected = true
      indicators.push(`Brand or authority impersonation: ${entity}`)
      manipulationTactics.push('Authority Impersonation')
      evidence.push(entity)
      break
    }
  }

  // 5. Financial Fraud & Lottery Patterns
  const fraudPatterns = [
    { pattern: 'lucky winner', label: 'Unsolicited lottery or prize winner claim' },
    { pattern: 'grand prize', label: 'Sweepstakes or grand prize claim' },
    { pattern: 'randomly selected', label: 'Unsolicited random selection claim' },
    { pattern: 'processing fee', label: 'Demand for upfront transfer or processing fee' },
    { pattern: 'transfer fee', label: 'Advance fee demand before prize distribution' },
    { pattern: 'wire transfer', label: 'Irreversible wire transfer request' },
    { pattern: 'crypto transfer', label: 'Irreversible cryptocurrency payment prompt' },
  ]

  for (const { pattern, label } of fraudPatterns) {
    if (lower.includes(pattern)) {
      financialFraudDetected = true
      indicators.push(label)
      manipulationTactics.push('Advance Fee Fraud', 'Financial Incentive')
      evidence.push(pattern)
      break
    }
  }

  // Deduplicate tactics & evidence
  const uniqueTactics = Array.from(new Set(manipulationTactics))
  const uniqueEvidence = Array.from(new Set(evidence))

  // Recommendations based on findings
  if (credentialHarvestingDetected || urgencyDetected) {
    recommendations.push('Do not enter passwords, identity numbers, or one-time codes on linked pages.')
    recommendations.push('Never verify your identity through links sent in unexpected SMS or messaging apps.')
  }
  if (suspiciousLinksDetected) {
    recommendations.push('Do not click embedded links. Type the organization official address directly in your browser.')
  }
  if (financialFraudDetected) {
    recommendations.push('Legitimate prize programs never require upfront transfer fees or processing payments.')
  }
  if (impersonationDetected) {
    recommendations.push('Contact the service directly through their official application or published telephone number.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Exercise standard caution when receiving unsolicited or unverified communications.')
  }

  return {
    urgencyDetected,
    impersonationDetected,
    credentialHarvestingDetected,
    financialFraudDetected,
    suspiciousLinksDetected,
    indicators: Array.from(new Set(indicators)),
    manipulationTactics: uniqueTactics,
    evidence: uniqueEvidence,
    extractedUrls,
    recommendations: Array.from(new Set(recommendations)),
  }
}

/**
 * Executes Local Rule-Based Security Analysis.
 * Guaranteed 100% offline, deterministic, and free of hallucinations.
 * Clearly attributed as "Local Rule-Based Analysis" (NEVER Gemini Nano or Gemini Cloud).
 */
export function runLocalRuleBasedAnalysis(protectedMessage: string): AnalysisRecord {
  const trimmed = protectedMessage.trim()
  const startTime = performance.now()

  if (!trimmed) {
    return {
      id: `local-rule-${Date.now()}`,
      mode: 'local',
      modelName: 'Local Rule-Based Analysis',
      actualInferenceSource: 'local_rules',
      summary: 'No text content provided to evaluate. Message is empty.',
      riskLevel: 'LOW',
      suspiciousIndicators: [],
      manipulationTactics: [],
      evidence: [],
      recommendedActions: ['Provide a non-empty message for security evaluation.'],
      limitations: ['Empty message payload evaluated.'],
      analyzedAt: new Date().toISOString(),
      protectedMessageLength: 0,
      latencyMs: 1,
    }
  }

  const analysis = inspectSecurityPatterns(trimmed)

  // Determine categorical risk level deterministically
  let riskLevel: AnalysisRiskLevel = 'LOW'
  let summary = ''

  const isSeverePhishingTrap =
    (analysis.credentialHarvestingDetected && (analysis.urgencyDetected || analysis.suspiciousLinksDetected)) ||
    (analysis.urgencyDetected && analysis.suspiciousLinksDetected) ||
    analysis.financialFraudDetected

  const isModerateSuspicious =
    analysis.urgencyDetected ||
    analysis.suspiciousLinksDetected ||
    analysis.impersonationDetected ||
    analysis.credentialHarvestingDetected

  if (isSeverePhishingTrap) {
    riskLevel = 'HIGH'
    const factors: string[] = []
    if (analysis.urgencyDetected) factors.push('urgent threats')
    if (analysis.credentialHarvestingDetected) factors.push('identity verification requests')
    if (analysis.suspiciousLinksDetected) factors.push('unverified external links')
    if (analysis.financialFraudDetected) factors.push('financial fee demands')
    summary = `Deterministic pattern matching identified high-probability deceptive indicators (${factors.join(', ')}). This message strongly resembles a credential harvesting or social engineering attack.`
  } else if (isModerateSuspicious) {
    riskLevel = 'MEDIUM'
    summary =
      'Moderate suspicious signals detected by local pattern matching. The message contains anomalies that warrant cautious verification before interacting.'
  } else {
    riskLevel = 'LOW'
    summary =
      'Local rule-based pattern matching did not identify standard phishing keywords, urgency triggers, or suspicious link destinations in this message.'
  }

  const durationMs = Math.max(1, Math.round(performance.now() - startTime))

  return {
    id: `local-rule-${Date.now()}`,
    mode: 'local',
    modelName: 'Local Rule-Based Analysis',
    actualInferenceSource: 'local_rules',
    summary,
    riskLevel,
    suspiciousIndicators: analysis.indicators,
    manipulationTactics: analysis.manipulationTactics,
    evidence: analysis.evidence,
    recommendedActions: analysis.recommendations,
    limitations: [
      'Deterministic evaluation performed locally via regular expressions and threat pattern dictionaries.',
      'Does not perform external live DNS, WHOIS, or real-time URL reputation queries.',
      'This analysis does NOT use machine learning or semantic language models (Gemini Cloud / Gemini Nano).',
      'Heuristic keyword detection evaluates syntactic cues without access to real-time external intelligence feeds.',
    ],
    analyzedAt: new Date().toISOString(),
    protectedMessageLength: trimmed.length,
    latencyMs: durationMs,
    latencyBreakdown: {
      initMs: 0,
      generationMs: durationMs,
      synthesisMs: 0,
      totalMs: durationMs,
      retryAttempts: 0,
    },
  }
}
