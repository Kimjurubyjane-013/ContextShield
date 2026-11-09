import type { ScanResult, SecurityStats } from '@/types'

export const SAMPLE_SECURITY_STATS: SecurityStats = {
  totalScans: 142,
  threatsBlocked: 38,
  piiProtected: 119,
  safeRatio: 73,
}

export const SAMPLE_SCANS: ScanResult[] = [
  {
    id: 'demo-001',
    messageText:
      'SECURITY ALERT: Your KBZPay account has been temporarily restricted due to suspicious login. Click here immediately to verify: https://kbz-security-verify-auth.xyz/login',
    sender: '+959798123456 (Unknown SMS)',
    timestamp: '12 mins ago',
    status: 'threat',
    threatScore: 94,
    summary: 'High-risk financial credential harvesting phishing attempt targeting banking users.',
    reasons: [
      'Deceptive lookalike URL imitating legitimate financial institution (kbz-security-verify-auth.xyz)',
      'Artificial urgency urging immediate action under threat of restriction',
      'Unsolicited verification link sent from unverified standard mobile number',
      'Matches known Southeast Asian mobile banking phishing heuristics',
    ],
    redactedPiiCount: 2,
    category: 'Banking Phishing',
    analysisMethod: 'On-Device Heuristic',
    piiItems: [
      { type: 'Phone Number', value: '+959798123456', masked: '+959798****56' },
      { type: 'Target Account', value: 'KBZPay Account', masked: '[REDACTED_ACCOUNT]' },
    ],
    isDemo: true,
  },
  {
    id: 'demo-002',
    messageText:
      'Urgent Telegram offer: Work from home as an Amazon Product Reviewer. Earn $180-$400 daily. No fees or experience required. Contact @SarahRecruiter_Global right now to register.',
    sender: 'WhatsApp Recruiter (Business)',
    timestamp: '1 hour ago',
    status: 'suspicious',
    threatScore: 68,
    summary: 'Suspicious task scam / recruitment advance-fee fraud with off-platform communication redirection.',
    reasons: [
      'Off-platform communication channel pivoting (WhatsApp to Telegram handle)',
      'Unrealistic compensation for low-skill remote review tasks ($180-$400/day)',
      'Lacks verifiable corporate identity or business registration credentials',
    ],
    redactedPiiCount: 1,
    category: 'Employment Task Scam',
    analysisMethod: 'On-Device Heuristic',
    piiItems: [
      { type: 'Handle', value: '@SarahRecruiter_Global', masked: '@Sarah***_Global' },
    ],
    isDemo: true,
  },
  {
    id: 'demo-003',
    messageText:
      'Your WavePay one-time verification code is 482910. Valid for 5 minutes. DO NOT share this code with anyone, including customer service agents.',
    sender: 'WavePay (Verified Sender)',
    timestamp: '3 hours ago',
    status: 'safe',
    threatScore: 8,
    summary: 'Legitimate transactional 2-Factor Authentication OTP code with standard fraud prevention warning.',
    reasons: [
      'Official registered shortcode identity',
      'Explicit security warning instructing user not to share OTP',
      'No clickable phishing links or external URL redirects present',
    ],
    redactedPiiCount: 1,
    category: 'Authentication OTP',
    analysisMethod: 'On-Device Heuristic',
    piiItems: [
      { type: 'OTP Token', value: '482910', masked: '48****' },
    ],
    isDemo: true,
  },
  {
    id: 'demo-004',
    messageText:
      'CONGRATULATIONS! Your telephone number was randomly selected as the lucky winner of 5,000,000 MMK in the ASEAN Telecom Grand Prize. Claim code: WIN779. Call +959951239999 to process your prize transfer fee.',
    sender: '+959951239999 (Unknown)',
    timestamp: 'Yesterday',
    status: 'threat',
    threatScore: 97,
    summary: 'High-risk advance-fee lottery scam designed to extract upfront processing fees.',
    reasons: [
      'Classic lottery advance-fee fraud requesting payment before receiving prize',
      'Unsolicited claim without any prior contest participation',
      'High psychological manipulation using grand prize reward bait',
    ],
    redactedPiiCount: 2,
    category: 'Lottery Advance-Fee',
    analysisMethod: 'On-Device Heuristic',
    piiItems: [
      { type: 'Phone', value: '+959951239999', masked: '+959951****99' },
    ],
    isDemo: true,
  },
  {
    id: 'demo-005',
    messageText:
      'Receipt for your ride with Grab: 4,500 MMK charged to Cash. Driver: Ko Aung (Toyota Probox). Thank you for riding with us!',
    sender: 'Grab (Verified)',
    timestamp: '2 days ago',
    status: 'safe',
    threatScore: 4,
    summary: 'Standard electronic receipt for completed ride with no suspicious payloads.',
    reasons: [
      'Verified corporate service receipt format',
      'Standard factual trip metadata with no coercive language',
      'Zero suspicious calls-to-action or suspicious redirects',
    ],
    redactedPiiCount: 1,
    category: 'Transactional Receipt',
    analysisMethod: 'On-Device Heuristic',
    piiItems: [
      { type: 'Driver Name', value: 'Ko Aung', masked: 'Ko A***' },
    ],
    isDemo: true,
  },
]

export const PRESET_ATTACKS = [
  {
    label: 'Bank Phishing SMS',
    text: 'URGENT KBZPay: Your wallet has been suspended due to policy violation. Re-activate your access in 15 minutes at https://secure-kbzpay-update.net/auth or your balance will be forfeited.',
  },
  {
    label: 'Telegram Task Scam',
    text: 'Hi! You have been shortlisted for YouTube Video Like Assistant. 50,000 - 150,000 MMK/day. Daily instant payment. Contact our hiring director on Telegram: @GlobalJobTask99',
  },
  {
    label: 'Legitimate 2FA Code',
    text: 'Your Google verification code is G-918234. Never share this code with anyone. Google will never call to ask for this code.',
  },
  {
    label: 'Lottery Prize Bait',
    text: 'Lucky Winner! Your mobile number won 10,000,000 MMK in our Grand Lucky Draw. Send 50,000 MMK tax clearance to 09987654321 to claim your bank transfer today.',
  },
]
