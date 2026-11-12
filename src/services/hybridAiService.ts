/**
 * ContextShield - Unified Hybrid AI Service
 * Powered by Firebase AI Logic Web SDK (SDK v13.2.0)
 *
 * Implements two privacy-enforced execution paths:
 *
 * Path A: NO CLOUD CONSENT
 * - Strictly executes using InferenceMode.ONLY_ON_DEVICE.
 * - Zero network requests dispatched to cloud services.
 * - Returns clear ON_DEVICE_UNAVAILABLE error if on-device Gemini Nano is not ready.
 *
 * Path B: EXPLICIT CLOUD CONSENT GRANTED
 * - Strictly validates consent against the exact message snapshot.
 * - Executes using InferenceMode.PREFER_ON_DEVICE.
 * - Evaluates locally when available, gracefully falling back to Gemini Cloud.
 * - Inspects result.response.inferenceSource to verify whether inference ran on-device or in-cloud.
 *
 * Hardware Notes:
 * - Compatible with 8GB RAM Windows systems (does not mandate Gemini Nano or Chrome flags).
 * - Never transmits raw unmasked PII, credentials, or screenshots.
 */

import {
  type ActualInferenceSource,
  type AttemptTelemetry,
  type CloudConsentState,
  type HybridAnalysisResult,
  type HybridInferenceMode,
  type LatencyBreakdown,
} from '@/features/analysis/types'
import {
  SYSTEM_ANALYSIS_INSTRUCTION,
  buildAnalysisPrompt,
  buildUserAnalysisContent,
  parseAndValidateAiResponse,
} from './aiPromptUtils'
import {
  createAnalysisError,
  isAnalysisErrorState,
  normalizeAnalysisError,
  shouldAutoRetryCloudError,
  toAnalysisErrorState,
} from './errorUtils'
import {
  CLOUD_REQUEST_TIMEOUT_MS,
  type CloudAbortReason,
  runWithAbortAndTimeout,
  sleepWithAbort,
} from './cloudAi'
import { getFirebaseAppInstance, getFirebaseConfigStatus } from './firebaseConfig'
import { hasOnDevicePromptApiSupport } from './onDeviceAi'

// Concurrency guard: track active hybrid analysis requests by snapshot -> request token
const inFlightHybridRequests = new Map<string, symbol>()

// Active abort controller & cancellation reason for in-flight hybrid request
let activeHybridAbortController: AbortController | null = null
let activeHybridAbortReason: CloudAbortReason | null = null

/**
 * Aborts any currently active hybrid AI request and releases concurrency locks.
 */
export function abortHybridAiAnalysis(reason: CloudAbortReason = 'USER_CANCELLED'): void {
  activeHybridAbortReason = reason
  if (activeHybridAbortController) {
    try {
      const marker =
        reason === 'CONSENT_REVOKED'
          ? 'CLOUD_ABORT_CONSENT_REVOKED: Consent revoked during active hybrid analysis.'
          : 'CLOUD_ABORT_USER_CANCELLED: Hybrid analysis cancelled by user.'
      activeHybridAbortController.abort(new DOMException(marker, 'AbortError'))
    } catch {
      // Ignore secondary abort errors
    }
    activeHybridAbortController = null
  }
  inFlightHybridRequests.clear()
}

// Cached model singletons for hybrid service
let cachedHybridAi: any = null
let cachedHybridApp: any = null
const cachedModels = new Map<string, any>()

async function getCachedHybridModel(mode: HybridInferenceMode): Promise<any> {
  const app = getFirebaseAppInstance()
  const { getAI, GoogleAIBackend, getGenerativeModel, InferenceMode, ThinkingLevel } =
    await import('firebase/ai')

  if (cachedHybridApp !== app) {
    cachedHybridAi = getAI(app, { backend: new GoogleAIBackend() })
    cachedHybridApp = app
    cachedModels.clear()
  }

  if (cachedModels.has(mode)) {
    return cachedModels.get(mode)
  }

  const modelConfig: {
    mode: (typeof InferenceMode)[keyof typeof InferenceMode]
    inCloudParams?: {
      model: string
      systemInstruction?: string
      generationConfig?: {
        maxOutputTokens?: number
        responseMimeType?: string
        thinkingConfig?: {
          thinkingLevel?: (typeof ThinkingLevel)[keyof typeof ThinkingLevel]
        }
      }
    }
  } = {
    mode:
      mode === 'PREFER_ON_DEVICE'
        ? InferenceMode.PREFER_ON_DEVICE
        : InferenceMode.ONLY_ON_DEVICE,
  }

  if (mode === 'PREFER_ON_DEVICE') {
    modelConfig.inCloudParams = {
      model: 'gemini-3.5-flash-lite',
      systemInstruction: SYSTEM_ANALYSIS_INSTRUCTION,
      generationConfig: {
        maxOutputTokens: 768,
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    }
  }

  const model = getGenerativeModel(cachedHybridAi, modelConfig, {
    timeout: CLOUD_REQUEST_TIMEOUT_MS,
  })
  cachedModels.set(mode, model)
  return model
}

export interface HybridAnalysisOptions {
  protectedMessage: string
  consentState?: CloudConsentState | null
  onDownloadProgress?: (progress: number) => void
}

/**
 * Executes unified hybrid AI analysis following strict privacy consent boundaries.
 */
export async function runHybridAiAnalysis({
  protectedMessage,
  consentState,
  onDownloadProgress,
}: HybridAnalysisOptions): Promise<HybridAnalysisResult> {
  const trimmed = protectedMessage.trim()

  // 1. Payload validation
  if (!trimmed) {
    throw createAnalysisError(
      'EMPTY_PAYLOAD',
      'Empty Payload',
      'Cannot analyze an empty message payload. Please provide and redact a message first.',
      false
    )
  }

  // 2. Strict Consent Boundary Evaluation
  // Cloud transmission is ONLY permitted if explicit consent is true AND matches current snapshot.
  const hasExplicitConsent =
    consentState?.hasConsented === true &&
    consentState.consentedMessageSnapshot === trimmed

  // Select inference mode strictly based on consent
  const targetMode: HybridInferenceMode = hasExplicitConsent
    ? 'PREFER_ON_DEVICE'
    : 'ONLY_ON_DEVICE'

  // Pre-check for local prompt API when running in no-consent (ONLY_ON_DEVICE) mode
  const isLocalPromptSupported = hasOnDevicePromptApiSupport()
  if (targetMode === 'ONLY_ON_DEVICE' && !isLocalPromptSupported) {
    throw createAnalysisError(
      'ON_DEVICE_UNAVAILABLE',
      'On-device analysis unavailable',
      'On-device Gemini Nano is not available on this device or browser. To analyze this message, please grant consent for enhanced cloud processing.',
      false
    )
  }

  const startTime = performance.now()
  const prompt = buildAnalysisPrompt(trimmed)

  // 4. Validate Firebase Configuration
  const fbStatus = getFirebaseConfigStatus()
  if (!fbStatus.isConfigured) {
    // If user has no consent, we can check for standalone Chrome Prompt API before failing
    if (!hasExplicitConsent) {
      return executeBrowserPromptApiFallback(trimmed, prompt, startTime)
    }

    throw createAnalysisError(
      'MISSING_CONFIG',
      'Firebase Configuration Missing',
      `Firebase credentials are required for Cloud fallback. Missing: ${fbStatus.missingKeys.join(', ')}. Please configure these in .env.local.`,
      false,
      'See .env.example for required configuration properties.'
    )
  }

  // 5. Concurrency guard: prevent simultaneous duplicate requests for the same message
  if (inFlightHybridRequests.has(trimmed)) {
    throw createAnalysisError(
      'RATE_LIMITED',
      'Analysis in Progress',
      'A hybrid analysis for this exact message is already in flight. Please wait for it to complete.',
      false
    )
  }

  const requestToken = Symbol('hybrid-analysis-request')
  inFlightHybridRequests.set(trimmed, requestToken)
  const controller = new AbortController()
  activeHybridAbortController = controller
  activeHybridAbortReason = null

  try {
    // 1. Measure Firebase Request Initialization latency
    const tInitStart = performance.now()
    const { InferenceSource } = await import('firebase/ai')
    const model = await runWithAbortAndTimeout(
      getCachedHybridModel(targetMode),
      controller.signal,
      CLOUD_REQUEST_TIMEOUT_MS
    )
    const initMs = Math.round(performance.now() - tInitStart)

    // Attempt on-device initialization if supported
    if (typeof model.initializeDeviceModel === 'function') {
      try {
        await model.initializeDeviceModel((progressValue: number) => {
          if (onDownloadProgress) {
            const pct =
              progressValue <= 1 ? Math.round(progressValue * 100) : Math.round(progressValue)
            onDownloadProgress(pct)
          }
        })
      } catch (initErr) {
        // In ONLY_ON_DEVICE mode, failed on-device initialization is fatal
        if (targetMode === 'ONLY_ON_DEVICE') {
          console.warn('On-device model initialization failed in ONLY_ON_DEVICE mode:', initErr)
          throw createAnalysisError(
            'ON_DEVICE_UNAVAILABLE',
            'On-device analysis unavailable',
            'On-device Gemini Nano is not available on this device or browser. To analyze this message, please grant consent for enhanced cloud processing.',
            true,
            (initErr as Error).message
          )
        }
        // In PREFER_ON_DEVICE mode, continue to allow cloud fallback
        console.info('On-device initialization skipped/unavailable; proceeding with cloud fallback.')
      }
    }

    // 2. Measure Response Generation latency (with strict bounded retry policy)
    const activePromptPayload =
      targetMode === 'PREFER_ON_DEVICE' ? buildUserAnalysisContent(trimmed) : prompt

    const MAX_RETRIES = targetMode === 'PREFER_ON_DEVICE' ? 1 : 0
    let attempt = 0
    let retryAttempts = 0
    let totalGenerationTime = 0
    let lastError: unknown = null
    let result: any = null
    const attemptTelemetry: AttemptTelemetry[] = []

    while (attempt <= MAX_RETRIES) {
      if (controller.signal.aborted) {
        if (activeHybridAbortReason === 'CONSENT_REVOKED') {
          throw createAnalysisError(
            'CONSENT_REQUIRED',
            'Consent Revoked',
            'Cloud consent was revoked. The active request was aborted.',
            false
          )
        }
        throw createAnalysisError(
          'CANCELLED',
          'Analysis Cancelled',
          'The in-flight request was cancelled and all locks were released.',
          false
        )
      }

      if (targetMode === 'PREFER_ON_DEVICE') {
        // Verify consent snapshot has not been revoked or changed during retries
        if (!consentState?.hasConsented) {
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
            'The message content was modified after consent was granted. Retries aborted.',
            true
          )
        }
      }

      const attemptNumber = attempt + 1
      const tGenStart = performance.now()
      let attemptStatus: 'SUCCESS' | 'ERROR' | 'TIMEOUT' = 'SUCCESS'
      let attemptHttpStatus: number | undefined
      let attemptErrorClassification: string | undefined
      let backoffDurationMs = 0

      try {
        result = await runWithAbortAndTimeout(
          model.generateContent(activePromptPayload, {
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
      } catch (generateErr) {
        const durationMs = Math.round(performance.now() - tGenStart)
        totalGenerationTime += durationMs
        lastError = generateErr

        if (controller.signal.aborted) {
          throw createAnalysisError(
            activeHybridAbortReason === 'CONSENT_REVOKED' ? 'CONSENT_REQUIRED' : 'CANCELLED',
            activeHybridAbortReason === 'CONSENT_REVOKED'
              ? 'Consent Revoked'
              : 'Analysis Cancelled',
            activeHybridAbortReason === 'CONSENT_REVOKED'
              ? 'Cloud consent was revoked before completion.'
              : 'The request was cancelled by the user.',
            false
          )
        }

        const normalized = normalizeAnalysisError(generateErr)
        attemptHttpStatus = normalized.statusCode
        attemptErrorClassification = normalized.suggestedErrorCode
        attemptStatus = normalized.suggestedErrorCode === 'TIMEOUT' ? 'TIMEOUT' : 'ERROR'

        if (
          attempt < MAX_RETRIES &&
          shouldAutoRetryCloudError(generateErr, durationMs, totalGenerationTime)
        ) {
          attempt++
          retryAttempts++

          const serverDelaySec = normalized.quotaDetails?.retryDelaySeconds
          if (serverDelaySec !== undefined && serverDelaySec > 0 && serverDelaySec <= 30) {
            backoffDurationMs = Math.round(serverDelaySec * 1000)
          } else {
            const baseDelay = 1500 * attempt
            const jitter = Math.random() * 500
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
            `[HybridAI Telemetry] Attempt ${attemptNumber} encountered fast transient error (${attemptErrorClassification}${
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
        throw generateErr
      }
    }

    if (controller.signal.aborted) {
      throw createAnalysisError(
        activeHybridAbortReason === 'CONSENT_REVOKED' ? 'CONSENT_REQUIRED' : 'CANCELLED',
        activeHybridAbortReason === 'CONSENT_REVOKED' ? 'Consent Revoked' : 'Analysis Cancelled',
        activeHybridAbortReason === 'CONSENT_REVOKED'
          ? 'Cloud consent was revoked before completion.'
          : 'The request was cancelled by the user.',
        false
      )
    }

    if (!result) {
      throw lastError || new Error('Inference execution failed without a result.')
    }

    // 3. Measure Report Synthesis latency
    const tSynthStart = performance.now()
    const rawText = result.response.text()

    if (!rawText || !rawText.trim()) {
      throw new Error('Received an empty response from AI engine.')
    }

    const structured = parseAndValidateAiResponse(rawText)
    const synthesisMs = Math.round(performance.now() - tSynthStart)

    // 4. Calculate Total Latency
    const generationMs = Math.round(totalGenerationTime)
    const totalMs = Math.round(performance.now() - startTime)

    // Determine actual execution source using result.response.inferenceSource
    const reportedSource = result.response.inferenceSource as string | undefined
    let actualInferenceSource: ActualInferenceSource = 'in_cloud'

    if (reportedSource === 'on_device' || reportedSource === InferenceSource.ON_DEVICE) {
      actualInferenceSource = 'on_device'
    } else if (reportedSource === 'in_cloud' || reportedSource === InferenceSource.IN_CLOUD) {
      actualInferenceSource = 'in_cloud'
    } else {
      actualInferenceSource = 'in_cloud'
    }

    // Strict privacy boundary: If running in ONLY_ON_DEVICE mode and inference did NOT execute on-device,
    // reject the result immediately to ensure no unconsented cloud data is accepted or misattributed.
    if (targetMode === 'ONLY_ON_DEVICE' && actualInferenceSource !== 'on_device') {
      throw createAnalysisError(
        'ON_DEVICE_UNAVAILABLE',
        'On-Device Execution Rejected',
        'The AI engine could not execute on-device and attempted non-local processing without consent. Network result was blocked.',
        false
      )
    }

    const modelName =
      actualInferenceSource === 'on_device'
        ? 'Gemini Nano (Firebase AI Logic On-Device)'
        : 'Gemini 3.5 Flash-Lite (Firebase AI Logic Cloud)'

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
      id: `hybrid-${Date.now()}`,
      mode: 'hybrid',
      modelName,
      analyzedAt: new Date().toISOString(),
      protectedMessageLength: trimmed.length,
      latencyMs: totalMs,
      latencyBreakdown,
      actualInferenceSource,
      usedInferenceMode: targetMode,
      cloudConsentGranted: hasExplicitConsent,
    }
  } catch (err) {
    return handleAnalysisError(err, targetMode, trimmed, prompt, startTime)
  } finally {
    if (activeHybridAbortController === controller) {
      activeHybridAbortController = null
      activeHybridAbortReason = null
    }
    if (inFlightHybridRequests.get(trimmed) === requestToken) {
      inFlightHybridRequests.delete(trimmed)
    }
  }
}

/**
 * Handles errors and maps them to user-friendly, privacy-safe error states.
 */
function handleAnalysisError(
  err: unknown,
  targetMode: HybridInferenceMode,
  trimmed: string,
  prompt: string,
  startTime: number
): Promise<HybridAnalysisResult> {
  // If already a valid AnalysisErrorState, throw directly
  if (isAnalysisErrorState(err)) {
    throw err
  }

  // If ONLY_ON_DEVICE failed, attempt browser Prompt API or return ON_DEVICE_UNAVAILABLE
  if (targetMode === 'ONLY_ON_DEVICE') {
    return executeBrowserPromptApiFallback(trimmed, prompt, startTime)
  }

  throw toAnalysisErrorState(
    err,
    'Analysis Execution Failed',
    'Unexpected error occurred during hybrid inference.'
  )
}

/**
 * Fallback execution path directly querying Chrome Prompt API when running in no-consent (on-device only) mode.
 */
async function executeBrowserPromptApiFallback(
  trimmed: string,
  prompt: string,
  startTime: number
): Promise<HybridAnalysisResult> {
  const win = window as unknown as {
    LanguageModel?: {
      create?: () => Promise<{
        prompt: (text: string) => Promise<string>
        destroy?: () => void
      }>
    }
    ai?: {
      languageModel?: {
        create?: () => Promise<{
          prompt: (text: string) => Promise<string>
          destroy?: () => void
        }>
      }
    }
  }

  const lm = win.LanguageModel || win.ai?.languageModel

  if (lm?.create) {
    try {
      const session = await lm.create()
      const rawResult = await session.prompt(prompt)
      if (session.destroy) session.destroy()

      const structured = parseAndValidateAiResponse(rawResult)
      return {
        ...structured,
        id: `local-${Date.now()}`,
        mode: 'hybrid',
        modelName: 'Chrome Prompt API (Local Gemini Nano)',
        analyzedAt: new Date().toISOString(),
        protectedMessageLength: trimmed.length,
        latencyMs: Math.round(performance.now() - startTime),
        actualInferenceSource: 'on_device',
        usedInferenceMode: 'ONLY_ON_DEVICE',
        cloudConsentGranted: false,
      }
    } catch (promptErr) {
      console.warn('Browser Prompt API failed:', promptErr)
    }
  }

  // Prompt API is unavailable
  throw createAnalysisError(
    'ON_DEVICE_UNAVAILABLE',
    'On-device analysis unavailable',
    'On-device Gemini Nano is not available on this device or browser. To analyze this message, please enable Enhanced Cloud Analysis with your explicit consent.',
    true,
    'Chrome Prompt API requires Chrome 128+ with flags enabled, and typically 16GB RAM.'
  )
}
