import React from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useNavigation } from '@/context/NavigationContext'

export const PrivacyNoticeBanner: React.FC = () => {
  const { setCurrentPage } = useNavigation()

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-[#2E8B57]/15 text-[#2E8B57] shrink-0 mt-0.5 sm:mt-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
            Privacy Guarantee
          </p>
          <p className="text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
            Your privacy matters. Review your message before sending it for analysis. Cloud processing will require your explicit consent.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setCurrentPage('privacy')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-accent)] hover:underline shrink-0 self-start sm:self-center cursor-pointer"
      >
        <span>Visit Privacy Center</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
