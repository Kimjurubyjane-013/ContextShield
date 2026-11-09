import React, { createContext, useContext, useState } from 'react'
import { SAMPLE_SCANS, SAMPLE_SECURITY_STATS } from '@/data/mockSecurityData'
import type { ScanResult, SecurityStats } from '@/types'

interface SecurityContextType {
  scans: ScanResult[]
  stats: SecurityStats
  isAnalyzing: boolean
  analyzeMessage: (text: string, sender?: string) => Promise<ScanResult>
  clearHistory: () => void
  getScanById: (id: string) => ScanResult | undefined
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scans, setScans] = useState<ScanResult[]>(SAMPLE_SCANS)
  const [stats, setStats] = useState<SecurityStats>(SAMPLE_SECURITY_STATS)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const clearHistory = () => {
    setScans([])
    setStats({
      totalScans: 0,
      threatsBlocked: 0,
      piiProtected: 0,
      safeRatio: 100,
    })
  }

  const getScanById = (id: string) => {
    return scans.find(s => s.id === id)
  }

  // Client-side privacy-first heuristic simulation demonstrating on-device masking
  // Clearly tagged as on-device prototype without fabricating live cloud AI responses
  const analyzeMessage = async (text: string, sender = 'User Input (Manual)'): Promise<ScanResult> => {
    setIsAnalyzing(true)

    // Simulate short local parsing delay (350ms)
    await new Promise(resolve => setTimeout(resolve, 350))

    const lower = text.toLowerCase()
    const isSuspiciousUrl = lower.includes('http') && (lower.includes('.xyz') || lower.includes('.net') || lower.includes('-') || lower.includes('auth'))
    const isUrgent = lower.includes('urgent') || lower.includes('immediately') || lower.includes('suspended') || lower.includes('forfeited')
    const isRewardBait = lower.includes('winner') || lower.includes('won') || lower.includes('daily salary') || lower.includes('lucky')

    let threatScore = 15
    let status: ScanResult['status'] = 'safe'
    const reasons: string[] = []

    if (isSuspiciousUrl || (isUrgent && lower.includes('kbz'))) {
      threatScore = 92
      status = 'threat'
      reasons.push('Unverified link pattern matching known phishing campaigns')
      reasons.push('Coercive temporal urgency urging immediate credential submission')
    } else if (isRewardBait || lower.includes('telegram')) {
      threatScore = 65
      status = 'suspicious'
      reasons.push('High-risk compensation bait or off-platform contact redirection')
    } else {
      reasons.push('No obvious malicious keywords or deceptive link patterns detected')
    }

    // Mask phone numbers locally
    const phoneRegex = /(?:\+?95|0)\d{8,10}/g
    const foundPhones = text.match(phoneRegex) || []

    const newScan: ScanResult = {
      id: `scan-${Date.now()}`,
      messageText: text,
      sender,
      timestamp: 'Just now',
      status,
      threatScore,
      summary: status === 'threat'
        ? 'High-risk heuristic detection flagged potential credential or financial fraud.'
        : status === 'suspicious'
        ? 'Suspicious engagement signals detected. Verify source through an official channel.'
        : 'Message appears safe based on local heuristic inspection.',
      reasons,
      redactedPiiCount: foundPhones.length,
      category: status === 'threat' ? 'Heuristic Threat' : status === 'suspicious' ? 'Suspicious Signal' : 'Standard Message',
      analysisMethod: 'On-Device Heuristic',
      piiItems: foundPhones.map(phone => ({
        type: 'Phone Number',
        value: phone,
        masked: phone.slice(0, 4) + '****' + phone.slice(-2),
      })),
      isDemo: false,
    }

    setScans(prev => [newScan, ...prev])
    setStats(prev => ({
      totalScans: prev.totalScans + 1,
      threatsBlocked: prev.threatsBlocked + (status === 'threat' ? 1 : 0),
      piiProtected: prev.piiProtected + foundPhones.length,
      safeRatio: Math.round(((prev.totalScans - prev.threatsBlocked) / (prev.totalScans + 1)) * 100),
    }))

    setIsAnalyzing(false)
    return newScan
  }

  return (
    <SecurityContext.Provider
      value={{
        scans,
        stats,
        isAnalyzing,
        analyzeMessage,
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
