export type PiiCategory =
  | 'Email'
  | 'Phone'
  | 'Financial Information'
  | 'Identification Number'
  | 'Sensitive URL Parameter'

export type PiiCertainty =
  | 'High Certainty (Pattern)'
  | 'Moderate Certainty (Heuristic)'
  | 'Contextual Rule'

export interface DetectedPiiItem {
  id: string
  category: PiiCategory
  originalText: string
  startIndex: number
  endIndex: number
  certainty: PiiCertainty
  suggestedReplacement: string
  explanation: string
}

export interface DetectionSummary {
  totalCount: number
  categoryCounts: Record<PiiCategory, number>
  items: DetectedPiiItem[]
  hasItems: boolean
}
