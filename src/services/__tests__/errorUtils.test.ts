/**
 * ContextShield - Unit Tests for Error Normalization & Transient Detection
 * Tests all edge cases: numeric error codes (503, 429), objects, nulls, AIError,
 * permanent vs transient classifications, and type safety.
 */

import {
  extractStatusCode,
  isAnalysisErrorState,
  isTransientError,
  normalizeAnalysisError,
  safeString,
  shouldAutoRetryCloudError,
  toAnalysisErrorState,
} from '../errorUtils.ts'

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      `Assertion failed: expected ${String(expected)}, got ${String(actual)}. ${message || ''}`
    )
  }
}

function assertDeepEqual(actual: unknown, expected: unknown, message?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Assertion failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}. ${message || ''}`
    )
  }
}

function assertDoesNotThrow(fn: () => void, message?: string) {
  try {
    fn()
  } catch (err) {
    throw new Error(
      `Assertion failed: expected function not to throw, but threw ${(err as Error).message}. ${message || ''}`
    )
  }
}

export function runErrorUtilsTests() {
  // Test 1: Numeric code property (the exact root cause of the TypeError)
  const numericCodeErr = { code: 503, message: 'Deadline expired' }
  assertDoesNotThrow(() => {
    const isTrans = isTransientError(numericCodeErr)
    assertEqual(isTrans, true, 'Numeric 503 code must be detected as transient')
  })

  const numeric429Err = { code: 429, message: 'Resource exhausted' }
  assertDoesNotThrow(() => {
    const isTrans = isTransientError(numeric429Err)
    assertEqual(isTrans, true, 'Numeric 429 code must be detected as transient')
  })

  // Test 2: Object code property (e.g. { code: { errorId: 'overloaded' } })
  const objectCodeErr = { code: { status: 503 }, message: 'Service unavailable' }
  assertDoesNotThrow(() => {
    const isTrans = isTransientError(objectCodeErr)
    assertEqual(isTrans, true, 'Object code with status 503 must be detected as transient')
  })

  // Test 3: Null, undefined, empty string, primitives
  assertEqual(isTransientError(null), false)
  assertEqual(isTransientError(undefined), false)
  assertEqual(isTransientError(''), false)
  assertEqual(isTransientError(404), false)
  assertEqual(isTransientError(503), true)

  // Test 4: AIError / Firebase error structure with customErrorData
  const firebaseAiError = {
    name: 'AIError',
    code: 'fetch-error',
    message: 'ai: Error fetching from https://firebasevertexai.googleapis.com/...: [503 Service Unavailable]',
    customErrorData: {
      status: 503,
      statusText: 'Service Unavailable',
    },
  }
  assertEqual(extractStatusCode(firebaseAiError), 503)
  assertEqual(isTransientError(firebaseAiError), true)
  const normalizedAiErr = normalizeAnalysisError(firebaseAiError)
  assertEqual(normalizedAiErr.suggestedErrorCode, 'MODEL_OVERLOADED')
  assertEqual(normalizedAiErr.isTransient, true)

  // Test 5: Permanent non-retryable errors
  const authError = {
    code: 'auth/invalid-api-key',
    message: 'API key not valid. Please pass a valid API key.',
  }
  assertEqual(isTransientError(authError), false)
  const normalizedAuth = normalizeAnalysisError(authError)
  assertEqual(normalizedAuth.suggestedErrorCode, 'AUTH_ERROR')
  assertEqual(normalizedAuth.isTransient, false)

  const permissionError = {
    message: 'Permission denied on resource',
    status: 403,
  }
  assertEqual(isTransientError(permissionError), false)

  const badRequestError = {
    message: 'Invalid argument provided',
    status: 400,
  }
  assertEqual(isTransientError(badRequestError), false)

  // Test 6: toAnalysisErrorState returns existing AnalysisErrorState unmodified
  const existingState = {
    code: 'CONSENT_REQUIRED' as const,
    title: 'Consent Required',
    message: 'Cloud AI requires user consent',
    retryable: true,
  }
  assertEqual(isAnalysisErrorState(existingState), true)
  const resultState = toAnalysisErrorState(existingState)
  assertDeepEqual(resultState, existingState)

  // Test 7: toAnalysisErrorState maps unknown / raw errors properly
  const mapped503 = toAnalysisErrorState(numericCodeErr)
  assertEqual(mapped503.code, 'MODEL_OVERLOADED')
  assertEqual(mapped503.retryable, true)
  assertEqual(mapped503.title, 'Cloud AI Model Overloaded')

  const mappedQuota = toAnalysisErrorState({ message: 'Quota exceeded for quota metric' })
  assertEqual(mappedQuota.code, 'RATE_LIMIT_EXCEEDED')
  assertEqual(mappedQuota.retryable, true)

  // Test 8: safeString never throws on any type
  assertEqual(safeString(null), '')
  assertEqual(safeString(undefined), '')
  assertEqual(safeString('hello'), 'hello')
  assertEqual(safeString(503), '503')
  assertEqual(safeString(true), 'true')
  assertEqual(safeString({ a: 1 }), '{"a":1}')
  assertEqual(safeString(Symbol('test')), 'Symbol(test)')

  // Test 9: Firebase SDK DOMException('Timeout has expired.', 'AbortError') with legacy code=20
  const sdkTimeoutDomErr = new DOMException('Timeout has expired.', 'AbortError')
  assertEqual(sdkTimeoutDomErr.code, 20, 'Verify DOMException ABORT_ERR has numeric code 20')
  assertEqual(
    extractStatusCode(sdkTimeoutDomErr),
    undefined,
    'DOMException code 20 must NOT be misread as an HTTP status code'
  )
  const normalizedTimeout = normalizeAnalysisError(sdkTimeoutDomErr)
  assertEqual(normalizedTimeout.suggestedErrorCode, 'TIMEOUT')
  const mappedTimeout = toAnalysisErrorState(sdkTimeoutDomErr)
  assertEqual(mappedTimeout.code, 'TIMEOUT')
  assertEqual(mappedTimeout.title, 'Cloud Request Timed Out')
  assertEqual(shouldAutoRetryCloudError(sdkTimeoutDomErr, 60000, 60000), false)

  // Test 10: Cancellation markers must map cleanly to CANCELLED with retryable=false
  const cancelledErr = new DOMException('CLOUD_ABORT_USER_CANCELLED: Cancelled', 'AbortError')
  const mappedCancel = toAnalysisErrorState(cancelledErr)
  assertEqual(mappedCancel.code, 'CANCELLED')
  assertEqual(mappedCancel.retryable, false)
  assertEqual(shouldAutoRetryCloudError(cancelledErr, 500, 500), false)

  // Test 11: shouldAutoRetryCloudError gates retries accurately
  assertEqual(
    shouldAutoRetryCloudError({ status: 429, message: 'Per-minute quota limit' }, 450, 450),
    true,
    'Fast transient 429 rate-limit hiccup under 12s should retry'
  )
  assertEqual(
    shouldAutoRetryCloudError(
      {
        status: 429,
        message: 'GenerateRequestsPerDayPerProjectPerModel exceeded',
      },
      450,
      450
    ),
    false,
    'Daily quota exhaustion must NEVER auto-retry'
  )
  assertEqual(
    shouldAutoRetryCloudError({ status: 503, message: 'Model overloaded' }, 900, 900),
    false,
    'MODEL_OVERLOADED should skip automatic retries'
  )
  assertEqual(
    shouldAutoRetryCloudError({ message: 'network connection reset' }, 15000, 15000),
    false,
    'Slow errors >= 12000ms must NOT trigger automatic retries'
  )
}

runErrorUtilsTests()
console.log('✓ All 11 errorUtils test suites passed successfully!')
