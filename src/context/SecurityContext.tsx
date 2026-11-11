import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { detectPii, generateMaskedText } from '@/features/privacy/piiDetection'
import type { AnalysisRecord } from '@/features/analysis/types'
import { runLocalRuleBasedAnalysis } from '@/services/localSecurityEngine'
import type { ScanResult, SecurityStats } from '@/types'

const STORAGE_KEY = 'cs_scan_history_v1'

export interface RecordAnalysisInput {
  protectedMessage: string
  maskedCount: number
  record: AnalysisRecord
  sender?: string
}

interface SecurityContextType {
  scans: ScanResult[]
  stats: SecurityStats
  isAnalyzing: boolean
  analyzeMessage: (text: string, sender?: string) => Promise<ScanResult>
  recordAnalysisScan: (input: RecordAnalysisInput) => void
  clearHistory: () => void
  getScanById: (id: string) => ScanResult | undefined
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

function loadInitialScans(): ScanResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function mapRiskToScanStatus(riskLevel: AnalysisRecord['riskLevel']): ScanResult['status'] {
  if (riskLevel === 'HIGH') return 'threat'
  if (riskLevel === 'MEDIUM' || riskLevel === 'UNKNOWN') return 'suspicious'
  return 'safe'
}

function mapRiskToThreatScore(riskLevel: AnalysisRecord['riskLevel']): number {
  if (riskLevel === 'HIGH') return 88
  if (riskLevel === 'MEDIUM') return 58
  if (riskLevel === 'UNKNOWN') return 40
  return 15
}

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scans, setScans] = useState<ScanResult[]>(loadInitialScans)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scans.slice(0, 50)))
    } catch {
      // Ignore storage quota errors
    }
  }, [scans])

  const stats: SecurityStats = useMemo(() => {
    const totalScans = scans.length
    const threatsBlocked = scans.filter(s => s.status === 'threat').length
    const safeCount = scans.filter(s => s.status === 'safe').length
    const piiProtected = scans.reduce((sum, s) => sum + (s.redactedPiiCount || 0), 0)
    const safeRatio = totalScans === 0 ? 100 : Math.round((safeCount / totalScans) * 100)
    return {
      totalScans,
      threatsBlocked,
      piiProtected,
      safeRatio,
    }
  }, [scans])

  const clearHistory = () => {
    setScans([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }
  }

  const getScanById = (id: string) => {
    return scans.find(s => s.id === id)
  }

  const recordAnalysisScan = ({
    protectedMessage,
    maskedCount,
    record,
    sender = 'Message Scanner',
  }: RecordAnalysisInput) => {
    const status = mapRiskToScanStatus(record.riskLevel)
    const methodLabel: ScanResult['analysisMethod'] =
      record.actualInferenceSource === 'in_cloud'
        ? 'Cloud AI (Gemini 3.8 Flash)'
        : record.actualInferenceSource === 'on_device'
        ? 'On-Device AI (Gemini Nano)'
        : 'Local Rule-Based Analysis'

    const entry: ScanResult = {
      id: record.id,
      messageText: protectedMessage,
      sender,
      timestamp: new Date(record.analyzedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status,
      threatScore: mapRiskToThreatScore(record.riskLevel),
      summary: record.summary,
      reasons:
        record.suspiciousIndicators.length > 0
          ? record.suspiciousIndicators.slice(0, 4)
          : ['No high-risk security indicators detected.'],
      redactedPiiCount: maskedCount,
      category:
        record.actualInferenceSource === 'in_cloud'
          ? 'Cloud Threat Assessment'
          : record.actualInferenceSource === 'on_device'
          ? 'On-Device AI Assessment'
          : 'Local Security Audit',
      analysisMethod: methodLabel,
      actualInferenceSource: record.actualInferenceSource,
      isDemo: false,
    }

    setScans(prev => {
      if (prev.some(s => s.id === entry.id)) return prev
      return [entry, ...prev].slice(0, 50)
    })
  }

  const analyzeMessage = async (
    text: string,
    sender = 'Quick Scanner'
  ): Promise<ScanResult> => {
    setIsAnalyzing(true)
    try {
      const pii = detectPii(text)
      const selectedIds = new Set(pii.items.map(i => i.id))
      const maskedText = generateMaskedText(text, pii.items, selectedIds)
      const localRecord = runLocalRuleBasedAnalysis(maskedText)
      const status = mapRiskToScanStatus(localRecord.riskLevel)

      const newScan: ScanResult = {
        id: localRecord.id,
        messageText: maskedText,
        sender,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status,
        threatScore: mapRiskToThreatScore(localRecord.riskLevel),
        summary: localRecord.summary,
        reasons:
          localRecord.suspiciousIndicators.length > 0
            ? localRecord.suspiciousIndicators
            : ['No malicious keywords, phishing links, or social engineering cues detected.'],
        redactedPiiCount: pii.totalCount,
        category:
          status === 'threat'
            ? 'Local High-Risk Detection'
            : status === 'suspicious'
            ? 'Suspicious Indicator'
            : 'Verified Safe',
        analysisMethod: 'Local Rule-Based Analysis',
        actualInferenceSource: 'local_rules',
        piiItems: pii.items.map(item => ({
          type: item.category,
          value: item.suggestedReplacement,
          masked: item.suggestedReplacement,
        })),
        isDemo: false,
      }

      setScans(prev => [newScan, ...prev].slice(0, 50))
      return newScan
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <SecurityContext.Provider
      value={{
        scans,
        stats,
        isAnalyzing,
        analyzeMessage,
        recordAnalysisScan,
        clearHistory,
        getScanById,
      }}
    >
      {children}
    </SecurityContext.Provider>
  )
}

export const useSecurity = () => {
  const context = useContext(SecurityContext)
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider')
  }
  return context
}
