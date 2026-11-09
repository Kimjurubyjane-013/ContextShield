import React, { createContext, useContext, useState } from 'react'
import type { PageId } from '@/types'

interface NavigationContextType {
  currentPage: PageId
  setCurrentPage: (page: PageId) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedScanId: string | null
  setSelectedScanId: (id: string | null) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null)

  const handleSetCurrentPage = (page: PageId) => {
    setCurrentPage(page)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <NavigationContext.Provider
      value={{
        currentPage,
        setCurrentPage: handleSetCurrentPage,
        mobileMenuOpen,
        setMobileMenuOpen,
        searchQuery,
        setSearchQuery,
        selectedScanId,
        setSelectedScanId,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
