import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { useNavigation } from '@/context/NavigationContext'
import { Sidebar } from './Sidebar'

export const MobileDrawer: React.FC = () => {
  const { mobileMenuOpen, setMobileMenuOpen } = useNavigation()

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  if (!mobileMenuOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop with Cyber Blur */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Sidebar Container */}
      <div className="relative w-[280px] max-w-[85vw] h-full z-10 shadow-2xl flex flex-col animate-in slide-in-from-left duration-250 bg-[var(--bg-sidebar)]">
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-3 z-20 p-2 rounded-xl text-[var(--text-muted)] hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>
    </div>
  )
}
