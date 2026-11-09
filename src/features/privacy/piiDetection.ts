import type {
  DetectedPiiItem,
  DetectionSummary,
  PiiCategory,
} from './types'

/**
 * Validates a numeric string using the standard Luhn checksum algorithm (Mod 10).
 * Used to verify payment card number candidates (Visa, Mastercard, Amex, Discover, etc.).
 */
export function luhnCheck(numStr: string): boolean {
  const clean = numStr.replace(/\D/g, '')
  if (clean.length < 13 || clean.length > 19) return false

  let sum = 0
  let shouldDouble = false

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10)
    if (Number.isNaN(digit)) return false

    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}

/**
 * Detects email addresses conforming to standard internet format.
 */
function detectEmails(text: string): DetectedPiiItem[] {
  const items: DetectedPiiItem[] = []
  // Word bounded email address pattern
  const regex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const originalText = match[0]
    items.push({
      id: `email-${match.index}`,
      category: 'Email',
      originalText,
      startIndex: match.index,
      endIndex: match.index + originalText.length,
      certainty: 'High Certainty (Pattern)',
      suggestedReplacement: '[EMAIL REDACTED]',
      explanation: 'Recognized standard RFC 5322 email address structure.',
    })
  }

  return items
}

/**
 * Detects credit and debit card-like number patterns (13-19 digits).
 * Uses Luhn checksum and structured card chunk validation to prevent false positives
 * on ordinary numbers (years, prices, order IDs).
 */
function detectFinancialCards(text: string): DetectedPiiItem[] {
  const items: DetectedPiiItem[] = []

  // 1. Grouped card numbers (4-4-4-4, 4-6-5, etc.) with spaces or hyphens
  const formattedRegex = /\b(?:\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{1,4}|3[47]\d{2}[ -]\d{6}[ -]\d{5})\b/g
  let match: RegExpExecArray | null

  while ((match = formattedRegex.exec(text)) !== null) {
    const originalText = match[0]
    const passesLuhn = luhnCheck(originalText)

    items.push({
      id: `fin-${match.index}`,
      category: 'Financial Information',
      originalText,
      startIndex: match.index,
      endIndex: match.index + originalText.length,
      certainty: passesLuhn ? 'High Certainty (Pattern)' : 'Moderate Certainty (Heuristic)',
      suggestedReplacement: '[FINANCIAL INFORMATION REDACTED]',
      explanation: passesLuhn
        ? 'Card number pattern verified by Luhn checksum algorithm.'
        : 'Structured 13-19 digit number formatted in payment card blocks.',
    })
  }

  // 2. Contiguous 13-19 digit numbers that pass the Luhn checksum
  const contiguousRegex = /\b\d{13,19}\b/g
  while ((match = contiguousRegex.exec(text)) !== null) {
    const originalText = match[0]
    // Only flag contiguous digits if they pass the Luhn checksum to avoid order IDs / barcodes
    if (luhnCheck(originalText)) {
      items.push({
        id: `fin-luhn-${match.index}`,
        category: 'Financial Information',
        originalText,
        startIndex: match.index,
        endIndex: match.index + originalText.length,
        certainty: 'High Certainty (Pattern)',
        suggestedReplacement: '[FINANCIAL INFORMATION REDACTED]',
        explanation: 'Contiguous 13-19 digit number verified by payment card Luhn checksum.',
      })
    }
  }

  return items
}

/**
 * Detects international and standard regional phone numbers.
 * Strictly avoids dates, times, and small numbers.
 */
function detectPhones(text: string): DetectedPiiItem[] {
  const items: DetectedPiiItem[] = []

  // Pattern 1: International prefix with + or 00, followed by country code and 7-14 digits
  // e.g. +1 202 555 0145, +44 20 7946 0919, +95 9 798 123 456, +65 6123 4567
  const intlRegex = /(?:\+|00)[1-9]\d{0,2}[\s.-]?(?:\(?\d{1,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?:[\s.-]?\d{1,4})?\b/g
  let match: RegExpExecArray | null

  while ((match = intlRegex.exec(text)) !== null) {
    const originalText = match[0]
    const digitsOnly = originalText.replace(/\D/g, '')

    // E.164 phone numbers typically have 8 to 15 digits
    if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
      items.push({
        id: `phone-intl-${match.index}`,
        category: 'Phone',
        originalText,
        startIndex: match.index,
        endIndex: match.index + originalText.length,
        certainty: 'High Certainty (Pattern)',
        suggestedReplacement: '[PHONE REDACTED]',
        explanation: 'International phone number format with country calling code.',
      })
    }
  }

  // Pattern 2: Domestic formatted with parenthesized area code e.g. (202) 555-0145 or (09) 798-123456
  const parenRegex = /\(\d{2,4}\)[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g
  while ((match = parenRegex.exec(text)) !== null) {
    const originalText = match[0]
    const digitsOnly = originalText.replace(/\D/g, '')
    if (digitsOnly.length >= 7 && digitsOnly.length <= 14) {
      items.push({
        id: `phone-paren-${match.index}`,
        category: 'Phone',
        originalText,
        startIndex: match.index,
        endIndex: match.index + originalText.length,
        certainty: 'High Certainty (Pattern)',
        suggestedReplacement: '[PHONE REDACTED]',
        explanation: 'Standard telephone number format with area code.',
      })
    }
  }

  // Pattern 3: Standard 3-part delimited phone numbers e.g. 202-555-0145 or 202.555.0145
  // Must avoid dates like 2026-11-07
  const delimitedRegex = /\b(?!20\d{2}[-/.])\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g
  while ((match = delimitedRegex.exec(text)) !== null) {
    const originalText = match[0]
    items.push({
      id: `phone-delim-${match.index}`,
      category: 'Phone',
      originalText,
      startIndex: match.index,
      endIndex: match.index + originalText.length,
      certainty: 'Moderate Certainty (Heuristic)',
      suggestedReplacement: '[PHONE REDACTED]',
      explanation: '10-digit formatted domestic telephone number.',
    })
  }

  // Pattern 4: Myanmar mobile format e.g. 09798123456 or 09-798-123456
  const myanmarRegex = /\b09[\s.-]?(?:\d{3}[\s.-]?\d{3}[\s.-]?\d{3}|\d{7,9})\b/g
  while ((match = myanmarRegex.exec(text)) !== null) {
    const originalText = match[0]
    const digitsOnly = originalText.replace(/\D/g, '')
    if (digitsOnly.length >= 9 && digitsOnly.length <= 11) {
      items.push({
        id: `phone-mm-${match.index}`,
        category: 'Phone',
        originalText,
        startIndex: match.index,
        endIndex: match.index + originalText.length,
        certainty: 'High Certainty (Pattern)',
        suggestedReplacement: '[PHONE REDACTED]',
        explanation: 'Regional mobile telephone number pattern (09-prefix).',
      })
    }
  }

  return items
}

/**
 * Detects common identification number patterns where reliably recognizable:
 * - US Social Security Numbers (SSN): 000-00-0000 format
 * - Myanmar National Registration Cards (NRC): e.g. 12/DAGAMA(N)123456
 * - Contextual Passport / National ID: keyword-preceded ID patterns
 */
function detectIdentificationNumbers(text: string): DetectedPiiItem[] {
  const items: DetectedPiiItem[] = []

  // 1. US SSN format: 3-2-4 digits with valid ranges (not 000, 666, 900-999)
  const ssnRegex = /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g
  let match: RegExpExecArray | null

  while ((match = ssnRegex.exec(text)) !== null) {
    const originalText = match[0]
    items.push({
      id: `id-ssn-${match.index}`,
      category: 'Identification Number',
      originalText,
      startIndex: match.index,
      endIndex: match.index + originalText.length,
      certainty: 'High Certainty (Pattern)',
      suggestedReplacement: '[IDENTIFICATION NUMBER REDACTED]',
      explanation: 'Recognized standard US Social Security Number (SSN) format.',
    })
  }

  // 2. Myanmar NRC format: e.g. 12/DAGAMA(N)123456 or 9/PAMANA(N)123456
  const nrcRegex = /\b\d{1,2}\/[A-Za-z\u1000-\u102A]+\([A-Za-z\u1000-\u102A]+\)\d{6}\b/g
  while ((match = nrcRegex.exec(text)) !== null) {
    const originalText = match[0]
    items.push({
      id: `id-nrc-${match.index}`,
      category: 'Identification Number',
      originalText,
      startIndex: match.index,
      endIndex: match.index + originalText.length,
      certainty: 'High Certainty (Pattern)',
      suggestedReplacement: '[IDENTIFICATION NUMBER REDACTED]',
      explanation: 'Recognized Myanmar National Registration Card (NRC) format.',
    })
  }

  // 3. Contextually preceded ID / Passport numbers: e.g. "Passport No: A12345678" or "ID: 987654321"
  const contextualIdRegex = /\b(?:passport(?:\s*(?:no\.?|number|#))?|national\s*id(?:\s*(?:no\.?|#))?|id\s*(?:card|no\.?|#))\s*[:=]\s*([A-Za-z0-9-]{6,15})\b/gi
  while ((match = contextualIdRegex.exec(text)) !== null) {
    const fullMatched = match[0]
    const idValue = match[1]
    const valueIndex = match.index + fullMatched.lastIndexOf(idValue)

    items.push({
      id: `id-context-${valueIndex}`,
      category: 'Identification Number',
      originalText: idValue,
      startIndex: valueIndex,
      endIndex: valueIndex + idValue.length,
      certainty: 'Contextual Rule',
      suggestedReplacement: '[IDENTIFICATION NUMBER REDACTED]',
      explanation: 'Identification string preceded by explicit ID/passport keywords.',
    })
  }

  return items
}

/**
 * Detects sensitive URL query parameters (e.g., token=..., email=..., phone=..., api_key=...)
 * within web links.
 */
function detectSensitiveUrlParams(text: string): DetectedPiiItem[] {
  const items: DetectedPiiItem[] = []

  // Look for URL query parameters carrying sensitive keywords
  const paramRegex = /(?<=[?&])(token|access_token|email|phone|mobile|auth|api_key|apikey|secret|password|pwd|ssn|card|account|session|session_id|user_id)=([^&\s#]+)/gi
  let match: RegExpExecArray | null

  while ((match = paramRegex.exec(text)) !== null) {
    const originalText = match[0]
    const paramKey = match[1]

    items.push({
      id: `url-param-${match.index}`,
      category: 'Sensitive URL Parameter',
      originalText,
      startIndex: match.index,
      endIndex: match.index + originalText.length,
      certainty: 'High Certainty (Pattern)',
      suggestedReplacement: '[SENSITIVE URL PARAMETER REDACTED]',
      explanation: `URL query parameter ("${paramKey}") containing potentially sensitive state or credentials.`,
    })
  }

  return items
}

/**
 * Merges and deduplicates candidate items, resolving any overlapping spans safely.
 * When two items collide:
 * - The longer or higher-priority match is preserved.
 * - Slices are strictly non-overlapping and sorted in ascending order of start index.
 */
export function resolveOverlaps(candidates: DetectedPiiItem[]): DetectedPiiItem[] {
  if (candidates.length <= 1) return candidates

  // Sort by start index ascending; if same start, longer match first
  const sorted = [...candidates].sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex
    }
    return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex)
  })

  const resolved: DetectedPiiItem[] = []

  for (const item of sorted) {
    if (resolved.length === 0) {
      resolved.push(item)
      continue
    }

    const last = resolved[resolved.length - 1]

    // Check for overlap: current item starts before the previous item ends
    if (item.startIndex < last.endIndex) {
      // Overlap detected:
      // If the current item is strictly inside `last`, ignore it
      if (item.endIndex <= last.endIndex) {
        continue
      }
      // If current item extends further, compare priority:
      // Sensitive URL Parameter or Luhn-verified card beats simple phone match
      const lastPriority = getCategoryPriority(last.category)
      const currentPriority = getCategoryPriority(item.category)

      if (currentPriority > lastPriority) {
        resolved[resolved.length - 1] = item
      }
      // Otherwise keep `last`
      continue
    }

    resolved.push(item)
  }

  return resolved
}

function getCategoryPriority(category: PiiCategory): number {
  switch (category) {
    case 'Sensitive URL Parameter':
      return 5
    case 'Email':
      return 4
    case 'Financial Information':
      return 3
    case 'Identification Number':
      return 2
    case 'Phone':
      return 1
    default:
      return 0
  }
}

/**
 * Main local PII detection function.
 * Evaluates the input string purely client-side without any network calls or telemetry.
 */
export function detectPii(text: string): DetectionSummary {
  if (!text || text.trim().length === 0) {
    return {
      totalCount: 0,
      categoryCounts: {
        Email: 0,
        Phone: 0,
        'Financial Information': 0,
        'Identification Number': 0,
        'Sensitive URL Parameter': 0,
      },
      items: [],
      hasItems: false,
    }
  }

  const rawCandidates: DetectedPiiItem[] = [
    ...detectEmails(text),
    ...detectSensitiveUrlParams(text),
    ...detectFinancialCards(text),
    ...detectPhones(text),
    ...detectIdentificationNumbers(text),
  ]

  const items = resolveOverlaps(rawCandidates)

  const categoryCounts: Record<PiiCategory, number> = {
    Email: 0,
    Phone: 0,
    'Financial Information': 0,
    'Identification Number': 0,
    'Sensitive URL Parameter': 0,
  }

  for (const item of items) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
  }

  return {
    totalCount: items.length,
    categoryCounts,
    items,
    hasItems: items.length > 0,
  }
}

/**
 * Generates the protected (masked) message string based on the user's active selections.
 * Never mutates or overwrites the original message.
 */
export function generateMaskedText(
  originalText: string,
  items: DetectedPiiItem[],
  selectedIds: Set<string>
): string {
  const activeItems = items.filter(item => selectedIds.has(item.id))
  if (activeItems.length === 0) return originalText

  // Ensure items are sorted in ascending order of start index
  const sorted = [...activeItems].sort((a, b) => a.startIndex - b.startIndex)

  let result = ''
  let cursor = 0

  for (const item of sorted) {
    const start = Math.max(cursor, Math.min(item.startIndex, originalText.length))
    const end = Math.max(start, Math.min(item.endIndex, originalText.length))

    result += originalText.slice(cursor, start)
    result += item.suggestedReplacement
    cursor = end
  }

  result += originalText.slice(cursor)
  return result
}
