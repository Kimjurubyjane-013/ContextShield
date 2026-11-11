/**
 * ContextShield - Unified Error Normalization & Transient Detection
 * Type-safe error handling that guarantees zero secondary TypeErrors.
 * Safely parses any caught unknown error (Error, AIError, FirebaseError, HTTP status, DOMException, primitives).
 */

import type {
  AnalysisErrorCode,
  AnalysisErrorState,
  QuotaErrorCategory,
  QuotaErrorDetails,
  QuotaViolation,
} from '../features/analysis/types.ts'

export interface NormalizedErrorDetails {
  raw: unknown
  message: string
  codeString: string
  statusCode?: number
  isTransient: boolean
  suggestedErrorCode: AnalysisErrorCode
  technicalDetails?: string
  quotaDetails?: QuotaErrorDetails
}

/**
 * Type guard to check if an unknown value is already a validated AnalysisErrorState.
 */
export function isAnalysisErrorState(val: unknown): val is AnalysisErrorState {
  if (!val || typeof val !== 'object') return false
  const candidate = val as Record<string, unknown>
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.message === 'string' &&
    typeof candidate.retryable === 'boolean'
  )
}

/**
 * Safely converts an unknown error property (code, status, etc.) to a string.
 * Never throws TypeError on numbers, objects, or symbols.
 */
export function safeString(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint') {
    return String(val)
  }
  if (typeof val === 'symbol') {
    return val.toString()
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val)
    } catch {
      return Object.prototype.toString.call(val)
    }
  }
  return ''
}

/**
 * Safely extracts numeric HTTP status code from an error if present.
 */
export function extractStatusCode(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined

  const record = err as Record<string, unknown>

  // Direct status or statusCode properties
  if (typeof record.status === 'number' && Number.isFinite(record.status)) {
    return record.status
  }
  if (typeof record.statusCode === 'number' && Number.isFinite(record.statusCode)) {
    return record.statusCode
  }

  // Firebase AIError customErrorData: { status: 503, ... }
  if (record.customErrorData && typeof record.customErrorData === 'object') {
    const custom = record.customErrorData as Record<string, unknown>
    if (typeof custom.status === 'number' && Number.isFinite(custom.status)) {
      return custom.status
    }
  }

  // If code is numeric (e.g. { code: 503 })
  if (typeof record.code === 'number' && Number.isFinite(record.code)) {
    return record.code
  }

  // Extract from message like "... [503 Service Unavailable] ..." or "... status: 503 ..."
  const msg = safeString(record.message)
  const bracketMatch = msg.match(/\[(\d{3})\s+[^\]]+\]/)
  if (bracketMatch && bracketMatch[1]) {
    const parsed = parseInt(bracketMatch[1], 10)
    if (!Number.isNaN(parsed)) return parsed
  }

  const statusMatch = msg.match(/\bstatus[:=]\s*(\d{3})\b/i)
  if (statusMatch && statusMatch[1]) {
    const parsed = parseInt(statusMatch[1], 10)
    if (!Number.isNaN(parsed)) return parsed
  }

  return undefined
}

/**
 * Parses server-provided retryDelay from structured RetryInfo or headers.
 * Returns numeric seconds or undefined. Never fabricates a value.
 */
export function parseRetryDelaySeconds(err: unknown): number | undefined {
  if (!err) return undefined

  const extractDuration = (val: unknown): number | undefined => {
    if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
      return Math.round(val)
    }
    if (typeof val === 'string') {
      const match = val.match(/^(\d+(?:\.\d+)?)\s*s?$/i)
      if (match && match[1]) {
        const num = parseFloat(match[1])
        if (Number.isFinite(num) && num >= 0) return Math.round(num)
      }
    }
    return undefined
  }

  // 1. Check structured detail arrays
  const candidates: unknown[] = []
  if (typeof err === 'object' && err !== null) {
    const rec = err as Record<string, unknown>
    if (Array.isArray(rec.errorDetails)) candidates.push(...rec.errorDetails)
    if (Array.isArray(rec.details)) candidates.push(...rec.details)
    if (rec.customErrorData && typeof rec.customErrorData === 'object') {
      const custom = rec.customErrorData as Record<string, unknown>
      if (Array.isArray(custom.errorDetails)) candidates.push(...custom.errorDetails)
    }
    if (rec.response && typeof rec.response === 'object') {
      const resp = rec.response as Record<string, unknown>
      if (resp.data && typeof resp.data === 'object') {
        const d = resp.data as Record<string, unknown>
        if (d.error && typeof d.error === 'object') {
          const e = d.error as Record<string, unknown>
          if (Array.isArray(e.details)) candidates.push(...e.details)
        }
      }
      if (resp.headers && typeof resp.headers === 'object') {
        const h = resp.headers as Record<string, unknown>
        const retryAfter = h['retry-after'] || h['Retry-After']
        const parsedHeader = extractDuration(retryAfter)
        if (parsedHeader !== undefined) return parsedHeader
      }
    }
    if (rec.headers && typeof rec.headers === 'object') {
      const h = rec.headers as Record<string, unknown>
      const retryAfter = h['retry-after'] || h['Retry-After']
      const parsedHeader = extractDuration(retryAfter)
      if (parsedHeader !== undefined) return parsedHeader
    }
    if (rec.retryAfter !== undefined) {
      const parsed = extractDuration(rec.retryAfter)
      if (parsed !== undefined) return parsed
    }
  }

  // Inspect objects in candidate arrays (e.g. RetryInfo)
  for (const item of candidates) {
    if (item && typeof item === 'object') {
      const itemRec = item as Record<string, unknown>
      const typeStr = safeString(itemRec['@type'])
      if (typeStr.includes('RetryInfo') || itemRec.retryDelay !== undefined) {
        const parsed = extractDuration(itemRec.retryDelay)
        if (parsed !== undefined) return parsed
      }
    }
  }

  // 2. Inspect string representation (message, details, etc.)
  const msgProp =
    typeof err === 'object' && err !== null && typeof (err as Record<string, unknown>).message === 'string'
      ? (err as Record<string, unknown>).message
      : ''
  const str = `${msgProp} ${safeString(err instanceof Error ? err.message : err)}`

  const regexMatch = str.match(/(?:retryDelay|retry_delay)\\?["']?\s*:\s*\\?["']?(\d+(?:\.\d+)?)\s*s?\\?["']?/i)
  if (regexMatch && regexMatch[1]) {
    const num = parseFloat(regexMatch[1])
    if (Number.isFinite(num) && num >= 0) return Math.round(num)
  }

  const retryAfterMatch = str.match(/retry[-\s]?after[:\s]+(\d+(?:\.\d+)?)\s*s?/i)
  if (retryAfterMatch && retryAfterMatch[1]) {
    const num = parseFloat(retryAfterMatch[1])
    if (Number.isFinite(num) && num >= 0) return Math.round(num)
  }

  return undefined
}

/**
 * Formats seconds into a human-readable duration (e.g. "9 hours 31 min" or "45 seconds").
 * Returns undefined if seconds is not provided or <= 0.
 */
export function formatRetryDelay(seconds: number | undefined): string | undefined {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) {
    return undefined
  }
  const rounded = Math.round(seconds)
  if (rounded < 60) {
    return `${rounded} second${rounded === 1 ? '' : 's'}`
  }
  if (rounded < 3600) {
    const mins = Math.floor(rounded / 60)
    const secs = rounded % 60
    return secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`
  }
  const hours = Math.floor(rounded / 3600)
  const mins = Math.floor((rounded % 3600) / 60)
  return mins > 0 ? `${hours} hour${hours === 1 ? '' : 's'} ${mins} min` : `${hours} hour${hours === 1 ? '' : 's'}`
}

/**
 * Accurately parses structured Firebase/Gemini RPC error details and classifies quota failure.
 */
export function parseQuotaErrorDetails(err: unknown): QuotaErrorDetails {
  const violations: QuotaViolation[] = []
  let reason: string | undefined
  const retryDelaySeconds = parseRetryDelaySeconds(err)
  const retryDelayText = formatRetryDelay(retryDelaySeconds)

  const candidates: unknown[] = []
  if (typeof err === 'object' && err !== null) {
    const rec = err as Record<string, unknown>
    if (Array.isArray(rec.errorDetails)) candidates.push(...rec.errorDetails)
    if (Array.isArray(rec.details)) candidates.push(...rec.details)
    if (rec.customErrorData && typeof rec.customErrorData === 'object') {
      const custom = rec.customErrorData as Record<string, unknown>
      if (Array.isArray(custom.errorDetails)) candidates.push(...custom.errorDetails)
    }
    if (rec.response && typeof rec.response === 'object') {
      const resp = rec.response as Record<string, unknown>
      if (resp.data && typeof resp.data === 'object') {
        const d = resp.data as Record<string, unknown>
        if (d.error && typeof d.error === 'object') {
          const e = d.error as Record<string, unknown>
          if (Array.isArray(e.details)) candidates.push(...e.details)
        }
      }
    }
  }

  // Also check if err.message contains JSON array/object of details
  if (err instanceof Error && err.message) {
    try {
      const jsonStart = err.message.indexOf('[')
      const jsonEnd = err.message.lastIndexOf(']')
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const parsed = JSON.parse(err.message.substring(jsonStart, jsonEnd + 1))
        if (Array.isArray(parsed)) candidates.push(...parsed)
      }
    } catch {
      // Ignore JSON parse errors in message
    }
  }

  for (const item of candidates) {
    if (!item || typeof item !== 'object') continue
    const itemRec = item as Record<string, unknown>
    const typeStr = safeString(itemRec['@type'])

    if (typeStr.includes('ErrorInfo') || typeof itemRec.reason === 'string') {
      reason = safeString(itemRec.reason)
    }

    if (typeStr.includes('QuotaFailure') || Array.isArray(itemRec.violations)) {
      const vios = Array.isArray(itemRec.violations) ? itemRec.violations : []
      for (const v of vios) {
        if (!v || typeof v !== 'object') continue
        const vRec = v as Record<string, unknown>
        violations.push({
          subject: safeString(vRec.subject) || undefined,
          description: safeString(vRec.description) || undefined,
          quotaMetric: safeString(vRec.quotaMetric || vRec.metric) || undefined,
          quotaId: safeString(vRec.quotaId || vRec.id) || undefined,
          quotaDimensions:
            vRec.quotaDimensions && typeof vRec.quotaDimensions === 'object'
              ? (vRec.quotaDimensions as Record<string, string>)
              : undefined,
          quotaValue: (typeof vRec.quotaValue === 'string' || typeof vRec.quotaValue === 'number')
            ? vRec.quotaValue
            : undefined,
        })
      }
    }
  }

  const statusCode = extractStatusCode(err)
  const fullText = (
    safeString(err) +
    ' ' +
    (err instanceof Error ? err.message : '') +
    ' ' +
    JSON.stringify(violations)
  ).toLowerCase()

  // Classify category accurately
  let category: QuotaErrorCategory = 'UNKNOWN_ERROR'

  // 1. BILLING_REQUIRED
  if (
    reason === 'BILLING_DISABLED' ||
    fullText.includes('billing_disabled') ||
    fullText.includes('billing required') ||
    fullText.includes('enable billing') ||
    fullText.includes('billing not enabled') ||
    fullText.includes('cloud billing api')
  ) {
    category = 'BILLING_REQUIRED'
  }
  // 2. DAILY_QUOTA_EXCEEDED (requests_per_day / daily / long reset delay)
  else if (
    violations.some(v => {
      const m = (v.quotaMetric || '').toLowerCase()
      const d = (v.description || '').toLowerCase()
      const qid = (v.quotaId || '').toLowerCase()
      return (
        m.includes('requests_per_day') ||
        m.includes('per_day') ||
        m.includes('daily') ||
        m.includes('rpd') ||
        d.includes('per day') ||
        d.includes('daily') ||
        d.includes('perday') ||
        qid.includes('daily') ||
        qid.includes('per_day')
      )
    }) ||
    // If status 429 and retryDelay > 3600 seconds, this is the free-tier daily reset (e.g. hours until midnight)
    ((statusCode === 429 || fullText.includes('resource_exhausted')) &&
      retryDelaySeconds !== undefined &&
      retryDelaySeconds > 3600) ||
    fullText.includes('requests_per_day') ||
    fullText.includes('requests per day') ||
    fullText.includes('daily request limit') ||
    fullText.includes('daily quota')
  ) {
    category = 'DAILY_QUOTA_EXCEEDED'
  }
  // 3. TOKEN_QUOTA_EXCEEDED (tokens_per_minute / token limits)
  else if (
    violations.some(v => {
      const m = (v.quotaMetric || '').toLowerCase()
      const d = (v.description || '').toLowerCase()
      return (
        m.includes('tokens_per_minute') ||
        m.includes('token') ||
        m.includes('tpm') ||
        d.includes('tokens per minute') ||
        d.includes('input tokens') ||
        d.includes('token limit')
      )
    }) ||
    fullText.includes('tokens_per_minute') ||
    fullText.includes('tokens per minute') ||
    fullText.includes('token quota') ||
    fullText.includes('token limit')
  ) {
    category = 'TOKEN_QUOTA_EXCEEDED'
  }
  // 4. RATE_LIMIT_EXCEEDED (RPM or short 429 rate limit)
  else if (
    statusCode === 429 ||
    reason === 'RATE_LIMIT_EXCEEDED' ||
    violations.some(v => {
      const m = (v.quotaMetric || '').toLowerCase()
      return m.includes('requests_per_minute') || m.includes('rpm')
    }) ||
    fullText.includes('rate_limit_exceeded') ||
    fullText.includes('rate limit') ||
    fullText.includes('resource_exhausted') ||
    fullText.includes('too many requests') ||
    fullText.includes('quota exceeded')
  ) {
    category = 'RATE_LIMIT_EXCEEDED'
  }
  // 5. MODEL_OVERLOADED (503 / 504 / 500 high demand / service overloaded)
  else if (
    statusCode === 503 ||
    statusCode === 504 ||
    fullText.includes('overloaded') ||
    fullText.includes('high demand') ||
    fullText.includes('spikes in demand') ||
    fullText.includes('experiencing high demand') ||
    fullText.includes('service unavailable') ||
    fullText.includes('deadline_expired') ||
    fullText.includes('deadline expired')
  ) {
    category = 'MODEL_OVERLOADED'
  }

  const primaryViolation = violations[0]

  return {
    category,
    retryDelaySeconds,
    retryDelayText,
    violations,
    quotaMetric: primaryViolation?.quotaMetric,
    quotaId: primaryViolation?.quotaId,
    quotaDimensions: primaryViolation?.quotaDimensions,
    quotaValue: primaryViolation?.quotaValue,
  }
}

/**
 * Safely extracts error message, code string, status, and transient status.
 */
export function normalizeAnalysisError(err: unknown): NormalizedErrorDetails {
  let message = ''
  let rawCode = ''

  if (err === null || err === undefined) {
    message = 'Unknown error occurred (null/undefined)'
  } else if (typeof err === 'string') {
    message = err
  } else if (err instanceof Error) {
    message = err.message || err.name || 'Error instance with empty message'
    rawCode = safeString((err as { code?: unknown }).code)
  } else if (typeof err === 'object') {
    const rec = err as Record<string, unknown>
    message = safeString(rec.message) || safeString(rec.error) || safeString(rec.details) || safeString(err)
    rawCode = safeString(rec.code)
  } else {
    message = safeString(err)
  }

  const statusCode = extractStatusCode(err)
  const lowerMsg = message.toLowerCase()
  const lowerCode = rawCode.toLowerCase()

  // 1. Permanent non-retryable conditions
  const isPermanent =
    statusCode === 400 ||
    statusCode === 401 ||
    statusCode === 403 ||
    statusCode === 404 ||
    lowerCode.includes('unauthenticated') ||
    lowerCode.includes('permission_denied') ||
    lowerCode.includes('no_api_key') ||
    lowerCode.includes('no_project_id') ||
    lowerCode.includes('api_not_enabled') ||
    lowerCode.includes('invalid_argument') ||
    lowerCode.includes('api-key') ||
    lowerCode.includes('api_key') ||
    lowerCode.startsWith('auth/') ||
    lowerMsg.includes('api_key') ||
    lowerMsg.includes('api key') ||
    lowerMsg.includes('api-key') ||
    lowerMsg.includes('unauthorized') ||
    lowerMsg.includes('permission denied') ||
    lowerMsg.includes('forbidden') ||
    lowerMsg.includes('not found') ||
    lowerMsg.includes('invalid argument') ||
    lowerCode === 'consent_required' ||
    lowerCode === 'message_changed' ||
    lowerCode === 'empty_payload' ||
    lowerCode === 'missing_config'

  // Parse detailed quota structure
  const quotaDetails = parseQuotaErrorDetails(err)

  // 2. Determine best-fit AnalysisErrorCode and transient status
  let isTransient = false
  let suggestedErrorCode: AnalysisErrorCode = 'UNKNOWN'

  if (
    lowerCode === 'missing_config' ||
    lowerMsg.includes('configuration missing') ||
    lowerMsg.includes('project credentials')
  ) {
    suggestedErrorCode = 'MISSING_CONFIG'
    isTransient = false
  } else if (lowerCode === 'consent_required' || lowerMsg.includes('consent required')) {
    suggestedErrorCode = 'CONSENT_REQUIRED'
    isTransient = false
  } else if (lowerCode === 'message_changed' || lowerMsg.includes('consent invalidated')) {
    suggestedErrorCode = 'MESSAGE_CHANGED'
    isTransient = false
  } else if (lowerCode === 'empty_payload' || lowerMsg.includes('empty message')) {
    suggestedErrorCode = 'EMPTY_PAYLOAD'
    isTransient = false
  } else if (
    lowerCode === 'on_device_unavailable' ||
    lowerMsg.includes('on-device gemini nano is not available') ||
    lowerMsg.includes('chrome prompt api')
  ) {
    suggestedErrorCode = 'ON_DEVICE_UNAVAILABLE'
    isTransient = false
  }
  // Check specific quota & overload classifications first
  else if (quotaDetails.category === 'DAILY_QUOTA_EXCEEDED') {
    suggestedErrorCode = 'DAILY_QUOTA_EXCEEDED'
    isTransient = false // DAILY_QUOTA_EXCEEDED must NEVER automatically retry
  } else if (quotaDetails.category === 'BILLING_REQUIRED') {
    suggestedErrorCode = 'BILLING_REQUIRED'
    isTransient = false // BILLING_REQUIRED must NEVER retry
  } else if (quotaDetails.category === 'TOKEN_QUOTA_EXCEEDED') {
    suggestedErrorCode = 'TOKEN_QUOTA_EXCEEDED'
    isTransient = false // TOKEN_QUOTA_EXCEEDED must not retry without request adjustment
  } else if (quotaDetails.category === 'RATE_LIMIT_EXCEEDED') {
    suggestedErrorCode = 'RATE_LIMIT_EXCEEDED'
    // Bounded retry only if retryDelay is short (<= 30s) or unspecified
    isTransient = quotaDetails.retryDelaySeconds === undefined || quotaDetails.retryDelaySeconds <= 30
  } else if (quotaDetails.category === 'MODEL_OVERLOADED') {
    suggestedErrorCode = 'MODEL_OVERLOADED'
    isTransient = true
  }
  // Authentication & permission failures
  else if (
    statusCode === 401 ||
    statusCode === 403 ||
    lowerMsg.includes('api_key') ||
    lowerMsg.includes('api key') ||
    lowerMsg.includes('api-key') ||
    lowerMsg.includes('unauthorized') ||
    lowerMsg.includes('permission') ||
    lowerCode.includes('unauthenticated') ||
    lowerCode.includes('permission_denied') ||
    lowerCode.includes('api-key') ||
    lowerCode.includes('api_key') ||
    lowerCode.startsWith('auth/')
  ) {
    suggestedErrorCode = 'AUTH_ERROR'
    isTransient = false
  }
  // Other transient network/deadline conditions
  else if (
    statusCode === 503 ||
    lowerMsg.includes('503') ||
    lowerMsg.includes('deadline') ||
    lowerCode.includes('deadline')
  ) {
    suggestedErrorCode = 'TIMEOUT'
    isTransient = true
  } else if (
    statusCode === 502 ||
    statusCode === 504 ||
    lowerMsg.includes('overloaded') ||
    lowerMsg.includes('service unavailable')
  ) {
    suggestedErrorCode = 'SERVICE_UNAVAILABLE'
    isTransient = true
  } else if (
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('networkerror') ||
    lowerMsg.includes('network error')
  ) {
    suggestedErrorCode = 'NETWORK_ERROR'
    isTransient = true
  } else if (
    lowerMsg.includes('parse') ||
    lowerMsg.includes('json') ||
    lowerMsg.includes('schema')
  ) {
    suggestedErrorCode = 'INVALID_RESPONSE'
    isTransient = true
  } else if (!isPermanent) {
    isTransient =
      statusCode === 500 ||
      lowerCode.includes('unavailable') ||
      lowerCode.includes('abort') ||
      lowerMsg.includes('abort')
  }

  return {
    raw: err,
    message,
    codeString: rawCode,
    statusCode,
    isTransient,
    suggestedErrorCode,
    technicalDetails: message !== rawCode ? `${rawCode ? `[Code: ${rawCode}] ` : ''}${message}` : message,
    quotaDetails,
  }
}

/**
 * Safe transient error check for retries. Never throws TypeError.
 */
export function isTransientError(err: unknown): boolean {
  if (!err) return false
  return normalizeAnalysisError(err).isTransient
}

/**
 * Converts any caught error into a valid, strongly-typed AnalysisErrorState.
 */
export function toAnalysisErrorState(
  err: unknown,
  fallbackTitle: string = 'Analysis Error',
  fallbackMessage: string = 'Failed to complete analysis.'
): AnalysisErrorState {
  if (isAnalysisErrorState(err)) {
    return err
  }

  const normalized = normalizeAnalysisError(err)

  let title = fallbackTitle
  let message = normalized.message || fallbackMessage
  let retryable = normalized.isTransient

  switch (normalized.suggestedErrorCode) {
    case 'DAILY_QUOTA_EXCEEDED':
      title = 'Gemini Daily API Quota Exceeded'
      message = normalized.quotaDetails?.retryDelayText
        ? `The free-tier daily request quota for Gemini Cloud has been reached. Provider reset window: ${normalized.quotaDetails.retryDelayText}. You can continue security analysis using Local Rule-Based Analysis.`
        : 'The free-tier daily request quota for Gemini Cloud has been reached (typically resets at midnight Pacific Time). You can continue security analysis using Local Rule-Based Analysis.'
      retryable = false
      break
    case 'RATE_LIMIT_EXCEEDED':
      title = 'API Rate Limit Exceeded'
      message = normalized.quotaDetails?.retryDelayText
        ? `Too many requests were sent in a short window. Please wait ${normalized.quotaDetails.retryDelayText} before retrying.`
        : 'Too many requests were sent in a short window. Please wait a moment before trying again.'
      retryable = normalized.isTransient
      break
    case 'TOKEN_QUOTA_EXCEEDED':
      title = 'Token Quota Exceeded'
      message =
        'The message payload exceeds the per-minute token quota for this model tier. Please shorten the message or reduce prompt size before retrying.'
      retryable = false
      break
    case 'MODEL_OVERLOADED':
      title = 'Cloud AI Model Overloaded'
      message =
        'Gemini Cloud servers are experiencing high traffic (HTTP 503). You can retry after a short delay or run Local Rule-Based Analysis.'
      retryable = true
      break
    case 'BILLING_REQUIRED':
      title = 'Cloud Billing Required'
      message =
        'The Firebase project requires billing enabled or a paid Gemini plan to process cloud requests.'
      retryable = false
      break
    case 'TIMEOUT':
      title = 'Service Temporarily Overloaded'
      message =
        'Gemini Cloud experienced a transient deadline timeout (HTTP 503). The model is temporarily busy. Please try again or use Local Rule-Based Analysis.'
      retryable = true
      break
    case 'SERVICE_UNAVAILABLE':
      title = 'Service Unavailable'
      message =
        'The Cloud AI service is temporarily unavailable. Please retry in a few moments or use Local Rule-Based Analysis.'
      retryable = true
      break
    case 'RATE_LIMITED':
      title = 'API Quota Temporarily Exceeded'
      message =
        'The Gemini Cloud service is temporarily rate-limited. Please wait a moment before trying again.'
      retryable = true
      break
    case 'AUTH_ERROR':
      title = 'Authentication Failure'
      message =
        'Firebase or Gemini API key authentication failed. Please verify your Firebase project credentials in .env.local.'
      retryable = false
      break
    case 'NETWORK_ERROR':
      title = 'Network Connection Failed'
      message =
        'Unable to reach Firebase AI Logic servers. Please verify your internet connection and proxy settings.'
      retryable = true
      break
    case 'INVALID_RESPONSE':
      title = 'Invalid Model Response'
      message =
        'The cloud model returned output that could not be parsed into the structured analysis schema.'
      retryable = true
      break
    case 'MISSING_CONFIG':
      title = 'Configuration Missing'
      retryable = false
      break
    case 'CONSENT_REQUIRED':
      title = 'Consent Required'
      retryable = false
      break
    case 'MESSAGE_CHANGED':
      title = 'Consent Invalidated'
      retryable = false
      break
    case 'EMPTY_PAYLOAD':
      title = 'Empty Message Payload'
      retryable = false
      break
    case 'ON_DEVICE_UNAVAILABLE':
      title = 'On-Device AI Unavailable'
      retryable = false
      break
    default:
      title = fallbackTitle
      message = `Unexpected error: ${normalized.message || fallbackMessage}`
      retryable = normalized.isTransient
      break
  }

  return {
    code: normalized.suggestedErrorCode,
    title,
    message,
    technicalDetails: normalized.technicalDetails,
    retryable,
    quotaDetails: normalized.quotaDetails,
    retryDelaySeconds: normalized.quotaDetails?.retryDelaySeconds,
    retryDelayText: normalized.quotaDetails?.retryDelayText,
  }
}

/**
 * Creates an AnalysisErrorState with explicit parameters.
 */
export function createAnalysisError(
  code: AnalysisErrorCode,
  title: string,
  message: string,
  retryable: boolean,
  technicalDetails?: string
): AnalysisErrorState {
  return { code, title, message, retryable, technicalDetails }
}
