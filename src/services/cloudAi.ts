/**
 * ContextShield - Cloud AI Analysis Service (Gemini Cloud via Firebase AI Logic)
 * Strictly uses InferenceMode.ONLY_IN_CLOUD.
 * Operates ONLY with explicit, non-persisted user consent and ONLY on privacy-protected text.
 * Never transmits unmasked message content or screenshots.
 */

import {
  type AnalysisRecord,
  type AttemptTelemetry,
  type CloudConsentState,
  type LatencyBreakdown,
} from '../features/analysis/types.ts'
import {
  SYSTEM_ANALYSIS_INSTRUCTION,
  buildUserAnalysisContent,
  parseAndValidateAiResponse,
} from './aiPromptUtils.ts'
import {
  createAnalysisError,
  shouldAutoRetryCloudError,
  normalizeAnalysisError,
  toAnalysisErrorState,
} from './errorUtils.ts'
import { getFirebaseAppInstance, getFirebaseConfigStatus } from './firebaseConfig.ts'

export type CloudAbortReason = 'USER_CANCELLED' | 'CONSENT_REVOKED'

// Concurrency guard: track currently in-flight requests by payload -> request token
const inFlightCloudRequests = new Map<string, symbol>()

// Active abort controller & cancellation reason for in-flight cloud request
let activeAbortController: AbortController | null = null
let activeAbortReason: CloudAbortReason | null = null

/**
 * Aborts any currently active cloud analysis request and releases concurrency locks.
 */
export function abortCloudAiAnalysis(reason: CloudAbortReason = 'USER_CANCELLED'): void {
  activeAbortReason = reason
  if (activeAbortController) {
    try {
      const marker =
        reason === 'CONSENT_REVOKED'
          ? 'CLOUD_ABORT_CONSENT_REVOKED: Consent revoked during active cloud analysis.'
          : 'CLOUD_ABORT_USER_CANCELLED: Cloud analysis cancelled by user.'
      activeAbortController.abort(new DOMException(marker, 'AbortError'))
    } catch {
      // Ignore secondary abort errors
    }
    activeAbortController = null
  }
  inFlightCloudRequests.clear()
}

// Singleton model cache to avoid repeated Firebase AI & SDK instantiation
let cachedCloudModel: any = null
let cachedFirebaseApp: any = null

// Unified SDK & client safety timeout in milliseconds (60 seconds).
// Reconciled across cloudAi.ts and hybridAiService.ts: allows slow Gemini 3.8 Flash responses
// while guaranteeing requests cannot hang for 180s+ (SDK default).
export const CLOUD_REQUEST_TIMEOUT_MS = 60000

/**
 * Races an async SDK operation against an external AbortSignal and a hard safety timeout.
 * Ensures that pre-fetch steps (e.g., SDK/header initialization) also obey cancellation & timeout.
 */
export function runWithAbortAndTimeout<T>(
  operation: Promise<T>,
  signal: AbortSignal,
  timeoutMs: number
): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(
      signal.reason ?? new DOMException('CLOUD_ABORT_USER_CANCELLED', 'AbortError')
    )
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new DOMException('Timeout has expired.', 'TimeoutError'))
    }, timeoutMs)

    const onAbort = () => {
      cleanup()
      reject(signal.reason ?? new DOMException('CLOUD_ABORT_USER_CANCELLED', 'AbortError'))
    }

    const cleanup = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', onAbort)
    }

    signal.addEventListener('abort', onAbort, { once: true })

    operation.then(
      val => {
        cleanup()
        resolve(val)
      },
      err => {
        cleanup()
        reject(err)
      }
    )
  })
}

/**
 * Abort-aware backoff delay so user cancellation during retry wait resolves immediately.
 */
export function sleepWithAbort(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(
      signal.reason ?? new DOMException('CLOUD_ABORT_USER_CANCELLED', 'AbortError')
    )
  }
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal.reason ?? new DOMException('CLOUD_ABORT_USER_CANCELLED', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Returns a cached, compiled GenerativeModel singleton instance for ONLY_IN_CLOUD Gemini 3.8 Flash inference.
 * Reusing this instance saves initialization latency on every request and retry.
 */
async function getCachedCloudModel(): Promise<any> {
  const app = (await getFirebaseAppInstance()) as import('firebase/app').FirebaseApp

  if (cachedCloudModel && cachedFirebaseApp === app) {
    return cachedCloudModel
  }

  const { getAI, GoogleAIBackend, getGenerativeModel, InferenceMode, ThinkingLevel } = await import(
    'firebase/ai'
  )

  const ai = getAI(app, { backend: new GoogleAIBackend() })
  cachedCloudModel = getGenerativeModel(
    ai,
    {
      mode: InferenceMode.ONLY_IN_CLOUD,
      inCloudParams: {
        model: 'gemini-3.8-flash',
        systemInstruction: SYSTEM_ANALYSIS_INSTRUCTION,
        generationConfig: {
          maxOutputTokens: 768, // Bounded token budget preventing runaway reasoning loops
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      },
    },
    { timeout: CLOUD_REQUEST_TIMEOUT_MS }
  )
  cachedFirebaseApp = app
  return cachedCloudModel
}

/**
 * Executes Cloud AI analysis using Gemini via Firebase AI Logic.
 * Strict precondition: Requires active, valid consent strictly tied to the current protected text.
 */
export async function runCloudAiAnalysis(
  protectedMessage: string,
  consentState: CloudConsentState
): Promise<AnalysisRecord> {
  const trimmed = protectedMessage.trim()

  // 1. Validate payload
  if (!trimmed) {
    throw createAnalysisError(
      'EMPTY_PAYLOAD',
      'Empty Message Payload',
      'Cannot submit an empty message for cloud analysis. Please provide and redact a message first.',
      false
    )
  }

  // 2. Validate explicit consent
  if (!consentState.hasConsented) {
    throw createAnalysisError(
      'CONSENT_REQUIRED',
      'Consent Required',
      'Cloud AI analysis requires explicit user consent before data transmission. Please review the consent disclosure and confirm.',
      true
    )
  }

  // 3. Verify message integrity against consent snapshot
  if (consentState.consentedMessageSnapshot !== trimmed) {
    throw createAnalysisError(
      'MESSAGE_CHANGED',
      'Consent Invalidated',
      'The protected message content was altered after consent was granted. To protect your privacy, please review the updated preview and re-consent.',
      true
    )
  }

  // 4. Concurrency Guard: Prevent duplicate simultaneous requests for the exact same payload
  if (inFlightCloudRequests.has(trimmed)) {
    throw createAnalysisError(
      'RATE_LIMITED',
      'Analysis in Progress',
      'An analysis for this exact message is already in flight. Please wait for it to complete or cancel it first.',
      false
    )
  }

  // 5. Validate Firebase configuration
  const fbStatus = getFirebaseConfigStatus()
  if (!fbStatus.isConfigured) {
    throw createAnalysisError(
      'MISSING_CONFIG',
      'Firebase Configuration Missing',
      `Cloud AI requires Firebase project credentials. Missing: ${fbStatus.missingKeys.join(', ')}. Please configure these variables in .env.local to enable Gemini Cloud analysis.`,
      false,
      'See .env.example for required configuration properties.'
    )
  }

  const requestToken = Symbol('cloud-analysis-request')
  inFlightCloudRequests.set(trimmed, requestToken)
  const startTime = performance.now()
  const userContent = buildUserAnalysisContent(trimmed)
  const controller = new AbortController()
  activeAbortController = controller
  activeAbortReason = null

  try {
    // 1. Measure Firebase Request Initialization latency (near 0ms when cached)
    const tInitStart = performance.now()
    const model = await runWithAbortAndTimeout(
      getCachedCloudModel(),
      controller.signal,
      CLOUD_REQUEST_TIMEOUT_MS
    )
    const initMs = Math.round(performance.now() - tInitStart)

    // 2. Measure Gemini Response Generation latency (with strict bounded retry policy)
    // MAX_RETRIES = 1: Bounded to maximum 1 retry on fast, genuinely transient errors only.
    const MAX_RETRIES = 1
    let attempt = 0
    let retryAttempts = 0
    let totalGenerationTime = 0
    let lastError: unknown = null
    let result: any = null
    const attemptTelemetry: AttemptTelemetry[] = []

    while (attempt <= MAX_RETRIES) {
      if (controller.signal.aborted) {
        if (activeAbortReason === 'CONSENT_REVOKED') {
          throw createAnalysisError(
            'CONSENT_REQUIRED',
            'Consent Revoked',
            'Cloud consent was revoked. The active cloud request has been aborted.',
            false
          )
        }
        throw createAnalysisError(
          'CANCELLED',
          'Cloud Analysis Cancelled',
          'The in-flight cloud request was cancelled and all locks were released.',
          false
        )
      }

      if (!consentState.hasConsented) {
        throw createAnalysisError(
          'CONSENT_REQUIRED',
          'Consent Required',
          'Cloud AI analysis requires explicit user consent before data transmission.',
          true
        )
      }
      if (consentState.consentedMessageSnapshot !== trimmed) {
        throw createAnalysisError(
          'MESSAGE_CHANGED',
          'Consent Invalidated',
          'The protected message content was altered. Retries aborted to protect your privacy.',
          true
        )
      }

      const attemptNumber = attempt + 1
      const tGenStart = performance.now()
      let attemptStatus: 'SUCCESS' | 'ERROR' | 'TIMEOUT' = 'SUCCESS'
      let attemptHttpStatus: number | undefined
      let attemptErrorClassification: string | undefined
      let backoffDurationMs = 0

      try {
        result = await runWithAbortAndTimeout(
          model.generateContent(userContent, {
            timeout: CLOUD_REQUEST_TIMEOUT_MS,
            signal: controller.signal,
          }),
          controller.signal,
          CLOUD_REQUEST_TIMEOUT_MS
        )
        const durationMs = Math.round(performance.now() - tGenStart)
        totalGenerationTime += durationMs

        attemptTelemetry.push({
          attemptNumber,
          startTimeMs: Math.round(tGenStart - startTime),
          completionTimeMs: Math.round(performance.now() - startTime),
          durationMs,
          status: 'SUCCESS',
          retryType: 'APPLICATION',
        })
        break
      } catch (err) {
        const durationMs = Math.round(performance.now() - tGenStart)
        totalGenerationTime += durationMs
        lastError = err

        if (controller.signal.aborted) {
          if (activeAbortReason === 'CONSENT_REVOKED') {
            throw createAnalysisError(
              'CONSENT_REQUIRED',
              'Consent Revoked',
              'Cloud consent was revoked and the active request was aborted.',
              false
            )
          }
          throw createAnalysisError(
            'CANCELLED',
            'Cloud Analysis Cancelled',
            'The in-flight cloud request was cancelled and all locks were released.',
            false
          )
        }

        const normalized = normalizeAnalysisError(err)
        attemptHttpStatus = normalized.statusCode
        attemptErrorClassification = normalized.suggestedErrorCode
        attemptStatus = normalized.suggestedErrorCode === 'TIMEOUT' ? 'TIMEOUT' : 'ERROR'

        const shouldRetry =
          attempt < MAX_RETRIES &&
          shouldAutoRetryCloudError(err, durationMs, totalGenerationTime) &&
          !controller.signal.aborted

        if (shouldRetry) {
          attempt++
          retryAttempts++

          const serverDelaySec = normalized.quotaDetails?.retryDelaySeconds
          if (serverDelaySec !== undefined && serverDelaySec > 0 && serverDelaySec <= 10) {
            backoffDurationMs = Math.round(serverDelaySec * 1000)
          } else {
            const baseDelay = 1200 * attempt
            const jitter = Math.random() * 400
            backoffDurationMs = Math.round(baseDelay + jitter)
          }

          attemptTelemetry.push({
            attemptNumber,
            startTimeMs: Math.round(tGenStart - startTime),
            completionTimeMs: Math.round(performance.now() - startTime),
            durationMs,
            status: attemptStatus,
            httpStatus: attemptHttpStatus,
            errorClassification: attemptErrorClassification,
            backoffDurationMs,
            retryType: 'APPLICATION',
          })

          console.warn(
            `[CloudAI Telemetry] Attempt ${attemptNumber} encountered transient error (${attemptErrorClassification}${
              attemptHttpStatus ? `, HTTP ${attemptHttpStatus}` : ''
            }). Retrying attempt ${attempt + 1} in ${backoffDurationMs}ms... (duration: ${durationMs}ms)`
          )
          await sleepWithAbort(backoffDurationMs, controller.signal)
          continue
        }

        attemptTelemetry.push({
          attemptNumber,
          startTimeMs: Math.round(tGenStart - startTime),
          completionTimeMs: Math.round(performance.now() - startTime),
          durationMs,
          status: attemptStatus,
          httpStatus: attemptHttpStatus,
          errorClassification: attemptErrorClassification,
          retryType: 'APPLICATION',
        })
        break
      }
    }

    if (controller.signal.aborted) {
      throw createAnalysisError(
        activeAbortReason === 'CONSENT_REVOKED' ? 'CONSENT_REQUIRED' : 'CANCELLED',
        activeAbortReason === 'CONSENT_REVOKED' ? 'Consent Revoked' : 'Cloud Analysis Cancelled',
        activeAbortReason === 'CONSENT_REVOKED'
          ? 'Cloud consent was revoked before completion.'
          : 'The cloud request was cancelled by user.',
        false
      )
    }

    if (!result) {
      throw lastError || new Error('Received an empty response from Gemini Cloud.')
    }

    // 3. Measure Report Synthesis latency (JSON parsing, schema validation, normalization)
    const tSynthStart = performance.now()
    const responseText = result.response.text()

    if (!responseText) {
      throw new Error('Received an empty response from Gemini Cloud.')
    }

    const structured = parseAndValidateAiResponse(responseText)
    const synthesisMs = Math.round(performance.now() - tSynthStart)

    // 4. Calculate Total Latency and format breakdown
    const generationMs = Math.round(totalGenerationTime)
    const totalMs = Math.round(performance.now() - startTime)

    // Verify reported inference source from Firebase AI Logic
    const reportedSource = (result.response as { inferenceSource?: string }).inferenceSource
    const actualInferenceSource = reportedSource === 'on_device' ? 'on_device' : 'in_cloud'

    const latencyBreakdown: LatencyBreakdown = {
      initMs,
      generationMs,
      synthesisMs,
      totalMs,
      retryAttempts,
      attemptTelemetry,
    }

    return {
      ...structured,
      id: `cloud-${Date.now()}`,
      mode: 'cloud',
      modelName: 'Gemini 3.8 Flash (Firebase AI Logic Cloud)',
      actualInferenceSource,
      cloudConsentGranted: true,
      analyzedAt: new Date().toISOString(),
      protectedMessageLength: trimmed.length,
      latencyMs: totalMs,
      latencyBreakdown,
    }
  } catch (err) {
    throw toAnalysisErrorState(err, 'Cloud Analysis Failed', 'Failed to complete cloud analysis.')
  } finally {
    if (activeAbortController === controller) {
      activeAbortController = null
      activeAbortReason = null
    }
    if (inFlightCloudRequests.get(trimmed) === requestToken) {
      inFlightCloudRequests.delete(trimmed)
    }
  }
}
