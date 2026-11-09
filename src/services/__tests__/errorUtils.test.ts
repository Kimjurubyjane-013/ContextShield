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
}

runErrorUtilsTests()
console.log('✓ All 8 test suites passed successfully!')
