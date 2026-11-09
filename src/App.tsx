import React from 'react'
import { NavigationProvider, useNavigation } from '@/context/NavigationContext'
import { SecurityProvider } from '@/context/SecurityContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { AppLayout } from '@/layouts/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { HybridTestPage } from '@/pages/HybridTestPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { ScannerPage } from '@/pages/ScannerPage'
import { SettingsPage } from '@/pages/SettingsPage'

const PageRouter: React.FC = () => {
  const { currentPage } = useNavigation()

  switch (currentPage) {
    case 'dashboard':
      return <DashboardPage />
    case 'scanner':
      return <ScannerPage />
    case 'privacy':
      return <PrivacyPage />
    case 'history':
      return <HistoryPage />
    case 'settings':
      return <SettingsPage />
    case 'hybrid-test':
      return import.meta.env.DEV ? <HybridTestPage /> : <DashboardPage />
    default:
      return <DashboardPage />
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <SecurityProvider>
          <AppLayout>
            <PageRouter />
          </AppLayout>
        </SecurityProvider>
      </NavigationProvider>
    </ThemeProvider>
  )
}
