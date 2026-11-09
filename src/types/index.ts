export type PageId = 'dashboard' | 'scanner' | 'privacy' | 'history' | 'settings' | 'hybrid-test'

export type Theme = 'light' | 'dark'

export type ScanStatus = 'safe' | 'suspicious' | 'threat'

export interface PiiItem {
  type: string
  value: string
  masked: string
}

export interface ScanResult {
  id: string
  messageText: string
  sender: string
  timestamp: string
  status: ScanStatus
  threatScore: number // 0-100
  summary: string
  reasons: string[]
  redactedPiiCount: number
  category: string
  analysisMethod: 'On-Device Heuristic' | 'Simulated Hybrid Engine'
  piiItems?: PiiItem[]
  isDemo?: boolean
}

export interface SecurityStats {
  totalScans: number
  threatsBlocked: number
  piiProtected: number
  safeRatio: number
}

export interface UserSettings {
  theme: Theme
  onDeviceOnly: boolean
  cloudFallback: boolean
  sensitivityLevel: 'standard' | 'strict' | 'paranoid'
  notificationSounds: boolean
  autoRedactPII: boolean
}
