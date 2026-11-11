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
  isTransientError,
  normalizeAnalysisError,
  toAnalysisErrorState,
} from './errorUtils.ts'
import { getFirebaseAppInstance, getFirebaseConfigStatus } from './firebaseConfig.ts'

// Concurrency guard: track currently in-flight requests to prevent duplicate parallel executions
const inFlightCloudRequests = new Set<string>()

// Active abort controller for in-flight cloud request
let activeAbortController: AbortController | null = null

/**
 * Aborts any currently active cloud analysis request and releases concurrency locks.
 */
export function abortCloudAiAnalysis(): void {
  if (activeAbortController) {
    try {
      activeAbortController.abort()
    } catch {}
    activeAbortController = null
  }
  inFlightCloudRequests.clear()
}

// Singleton model cache to avoid repeated Firebase AI & SDK instantiation
let cachedCloudModel: any = null
let cachedFirebaseApp: any = null

// SDK single-request timeout in milliseconds (35 seconds).
// Bounds cloud inference to prevent hanging for minutes while allowing reasonable time for response.
const CLOUD_REQUEST_TIMEOUT_MS = 35000

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
      'An analysis for this exact message is already in flight. Please wait for it to complete.',
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

  inFlightCloudRequests.add(trimmed)
  const startTime = performance.now()
  const userContent = buildUserAnalysisContent(trimmed)
  let controller: AbortController | null = null

  try {
    // 1. Measure Firebase Request Initialization latency (near 0ms when cached)
    const tInitStart = performance.now()
    const model = await getCachedCloudModel()
    const initMs = Math.round(performance.now() - tInitStart)

    // 2. Measure Gemini Response Generation latency (with strict bounded retry policy)
    // MAX_RETRIES = 1: Bounded to maximum 1 retry on verified transient errors.
    const MAX_RETRIES = 1
    let attempt = 0
    let retryAttempts = 0
    let totalGenerationTime = 0
    let lastError: unknown = null
    let result: any = null
    const attemptTelemetry: AttemptTelemetry[] = []

    controller = new AbortController()
    activeAbortController = controller

    while (attempt <= MAX_RETRIES) {
      // Re-verify consent and snapshot integrity before each attempt
      if (!consentState.hasConsented || controller.signal.aborted) {
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
        result = await model.generateContent(userContent, {
          timeout: CLOUD_REQUEST_TIMEOUT_MS,
          signal: controller.signal,
        })
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

        const normalized = normalizeAnalysisError(err)
        attemptHttpStatus = normalized.statusCode
        attemptErrorClassification = normalized.suggestedErrorCode
        attemptStatus = normalized.suggestedErrorCode === 'TIMEOUT' ? 'TIMEOUT' : 'ERROR'

        // Check if transient error and bounded retries are available.
        // Fast-fail: only retry if the first attempt was short (< 12s) and not aborted.
        // If the attempt timed out (spent 35s), do NOT retry automatically.
        const shouldRetry =
          attempt < MAX_RETRIES &&
          isTransientError(err) &&
          durationMs < 12000 &&
          totalGenerationTime < 24000 &&
          !controller.signal.aborted

        if (shouldRetry) {
          attempt++
          retryAttempts++

          const serverDelaySec = normalized.quotaDetails?.retryDelaySeconds
          if (serverDelaySec !== undefined && serverDelaySec > 0 && serverDelaySec <= 15) {
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
          await new Promise(resolve => setTimeout(resolve, backoffDurationMs))
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
    }
    inFlightCloudRequests.delete(trimmed)
  }
}
