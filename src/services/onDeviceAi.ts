/**
 * ContextShield - On-Device AI Service (Privacy-First)
 * Uses Firebase AI Logic Web SDK with InferenceMode.ONLY_ON_DEVICE.
 * Backed by Chrome Prompt API (Gemini Nano) locally in the user's browser.
 * NEVER sends message text over the network.
 */

import {
  type AnalysisErrorState,
  type AnalysisRecord,
  type OnDeviceModelReadiness,
} from '@/features/analysis/types'
import { buildAnalysisPrompt, parseAndValidateAiResponse } from './aiPromptUtils'
import { getFirebaseAppInstance, getFirebaseConfigStatus } from './firebaseConfig'

// Window AI type extensions for Chrome Prompt API diagnostics
interface WindowWithAi extends Window {
  LanguageModel?: {
    availability?: () => Promise<'readily' | 'after-download' | 'no'>
    capabilities?: () => Promise<{ available: 'readily' | 'after-download' | 'no' }>
    create?: (options?: unknown) => Promise<{
      prompt: (text: string) => Promise<string>
      destroy?: () => void
    }>
  }
  ai?: {
    languageModel?: {
      availability?: () => Promise<'readily' | 'after-download' | 'no'>
      capabilities?: () => Promise<{ available: 'readily' | 'after-download' | 'no' }>
      create?: (options?: unknown) => Promise<{
        prompt: (text: string) => Promise<string>
        destroy?: () => void
      }>
    }
  }
}

/**
 * Checks whether the browser provides the Chrome Prompt API (Gemini Nano) locally.
 */
export function hasOnDevicePromptApiSupport(): boolean {
  if (typeof window === 'undefined') return false
  const win = window as unknown as WindowWithAi
  return Boolean(win.LanguageModel || (win.ai && win.ai.languageModel))
}

let cachedReadiness: OnDeviceModelReadiness | null = null

/**
 * Checks on-device model availability.
 */
export async function checkOnDeviceReadiness(forceRefresh = false): Promise<OnDeviceModelReadiness> {
  if (cachedReadiness && !forceRefresh) {
    return cachedReadiness
  }

  if (typeof window === 'undefined') {
    return {
      status: 'unsupported',
      statusMessage: 'On-device AI is only available in supported browser environments.',
    }
  }

  const win = window as unknown as WindowWithAi
  const lm = win.LanguageModel || win.ai?.languageModel

  // 1. Check direct browser Prompt API support
  if (!lm) {
    return {
      status: 'unsupported',
      statusMessage:
        'Browser does not support the Chrome Prompt API. On-device Gemini Nano requires Chrome 128+ with flags enabled.',
    }
  }

  try {
    let avail: 'readily' | 'after-download' | 'no' = 'no'

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Prompt API probe timed out')), 1500)
    )

    if (typeof lm.availability === 'function') {
      avail = await Promise.race([lm.availability(), timeoutPromise])
    } else if (typeof lm.capabilities === 'function') {
      const caps = await Promise.race([lm.capabilities(), timeoutPromise])
      avail = caps.available
    }

    let result: OnDeviceModelReadiness
    if (avail === 'readily') {
      result = {
        status: 'readily',
        statusMessage: 'On-device Gemini Nano is downloaded and ready for instant private inference.',
      }
    } else if (avail === 'after-download') {
      result = {
        status: 'after-download',
        statusMessage:
          'On-device Gemini Nano model requires an initial one-time download to your device.',
      }
    } else {
      result = {
        status: 'no',
        statusMessage:
          'On-device AI is disabled or unsupported on this hardware configuration.',
      }
    }
    cachedReadiness = result
    return result
  } catch (err) {
    const result: OnDeviceModelReadiness = {
      status: 'unsupported',
      statusMessage: `Browser Prompt API (Gemini Nano) is unready or unresponsive (${(err as Error).message}).`,
    }
    cachedReadiness = result
    return result
  }
}

/**
 * Executes on-device analysis strictly on the protected/masked message.
 * NEVER sends content over the network.
 */
export async function runOnDeviceAnalysis(
  protectedMessage: string,
  onDownloadProgress?: (progress: number) => void
): Promise<AnalysisRecord> {
  if (!protectedMessage || !protectedMessage.trim()) {
    throw createOnDeviceError(
      'EMPTY_PAYLOAD',
      'No Protected Message',
      'Cannot analyze an empty message payload. Please provide and redact a message first.',
      false
    )
  }

  // Pre-execution Guard: Check if Chrome Prompt API exists in this browser environment.
  // If the browser lacks on-device Prompt API, DO NOT invoke Firebase AI Logic because
  // Firebase AI Logic's callCloudOrDevice silently executes inCloudCall() when chromeAdapter is missing!
  if (!hasOnDevicePromptApiSupport()) {
    throw createOnDeviceError(
      'ON_DEVICE_UNAVAILABLE',
      'On-Device AI Unavailable',
      'Browser does not support the Chrome Prompt API. On-device Gemini Nano requires Chrome 128+ with flags enabled. No on-device model is available.',
      false
    )
  }

  // Inspect readiness
  const readiness = await checkOnDeviceReadiness()
  if (readiness.status === 'unsupported' || readiness.status === 'no') {
    throw createOnDeviceError(
      'ON_DEVICE_UNAVAILABLE',
      'On-Device AI Unavailable',
      readiness.statusMessage,
      false
    )
  }

  const startTime = performance.now()
  const prompt = buildAnalysisPrompt(protectedMessage)

  // Path A: Check if Firebase AI Logic is configured
  const fbStatus = getFirebaseConfigStatus()

  if (fbStatus.isConfigured) {
    try {
      const app = (await getFirebaseAppInstance()) as import('firebase/app').FirebaseApp
      const { getAI, GoogleAIBackend, getGenerativeModel, InferenceMode, InferenceSource } =
        await import('firebase/ai')

      const ai = getAI(app, { backend: new GoogleAIBackend() })
      // Explicitly configure ONLY_ON_DEVICE and do NOT provide cloud fallback parameters
      const model = getGenerativeModel(ai, {
        mode: InferenceMode.ONLY_ON_DEVICE,
      })

      // If initializeDeviceModel is supported by the SDK, invoke it with progress tracking
      if (typeof model.initializeDeviceModel === 'function') {
        await model.initializeDeviceModel((progressValue: number) => {
          if (onDownloadProgress) {
            const pct = progressValue <= 1 ? Math.round(progressValue * 100) : Math.round(progressValue)
            onDownloadProgress(pct)
          }
        })
      }

      const result = await model.generateContent(prompt)

      // Post-execution Source Verification:
      // Ensure the SDK actually executed on-device. If it returned in_cloud, reject it immediately!
      const reportedSource = (result.response as { inferenceSource?: string }).inferenceSource
      if (reportedSource !== 'on_device' && reportedSource !== InferenceSource.ON_DEVICE) {
        throw createOnDeviceError(
          'ON_DEVICE_UNAVAILABLE',
          'On-Device Execution Rejected',
          'Firebase AI Logic returned a non-device inference source during on-device execution. Network transmission was rejected to preserve privacy.',
          false
        )
      }

      const rawText = result.response.text()
      const structured = parseAndValidateAiResponse(rawText)

      return {
        ...structured,
        id: `ondevice-${Date.now()}`,
        mode: 'on-device',
        modelName: 'Gemini Nano (Firebase AI Logic On-Device)',
        actualInferenceSource: 'on_device',
        analyzedAt: new Date().toISOString(),
        protectedMessageLength: protectedMessage.length,
        latencyMs: Math.round(performance.now() - startTime),
      }
    } catch (fbErr) {
      const errObj = fbErr as AnalysisErrorState
      if (errObj && errObj.code === 'ON_DEVICE_UNAVAILABLE') {
        throw fbErr
      }
      console.warn('Firebase AI Logic on-device execution failed, checking browser Prompt API fallback:', fbErr)
      // If Firebase fails with an unexpected initialization error, proceed to direct Prompt API
    }
  }

  // Path B: Direct Chrome Prompt API fallback (runs 100% on-device in browser)
  const win = window as unknown as WindowWithAi
  const lm = win.LanguageModel || win.ai?.languageModel
  if (!lm || typeof lm.create !== 'function') {
    throw createOnDeviceError(
      'ON_DEVICE_UNAVAILABLE',
      'On-Device AI Unavailable',
      'Your browser does not have the Chrome Prompt API (Gemini Nano) enabled, and on-device inference cannot execute.',
      false
    )
  }

  try {
    const session = await lm.create({
      monitor(m: { addEventListener: (event: string, cb: (e: { loaded: number; total: number }) => void) => void }) {
        m.addEventListener('downloadprogress', (e: { loaded: number; total: number }) => {
          if (e.total > 0 && onDownloadProgress) {
            onDownloadProgress(Math.round((e.loaded / e.total) * 100))
          }
        })
      },
    })

    const rawResult = await session.prompt(prompt)
    if (session.destroy) session.destroy()

    const structured = parseAndValidateAiResponse(rawResult)

    return {
      ...structured,
      id: `ondevice-${Date.now()}`,
      mode: 'on-device',
      modelName: 'Chrome Prompt API (Gemini Nano On-Device)',
      actualInferenceSource: 'on_device',
      analyzedAt: new Date().toISOString(),
      protectedMessageLength: protectedMessage.length,
      latencyMs: Math.round(performance.now() - startTime),
    }
  } catch (promptErr) {
    throw createOnDeviceError(
      'DEVICE_MODEL_NOT_READY',
      'On-Device Inference Failed',
      `Failed to execute on-device inference: ${(promptErr as Error).message}`,
      true
    )
  }
}

function createOnDeviceError(
  code: AnalysisErrorState['code'],
  title: string,
  message: string,
  retryable: boolean
): AnalysisErrorState {
  return { code, title, message, retryable }
}
