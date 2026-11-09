/**
 * ContextShield - Firebase Client Configuration
 * Manages Firebase Web App initialization with strict environment validation.
 * Never invents API keys or configuration secrets.
 */

import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app'

export interface FirebaseClientConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export interface FirebaseConfigStatus {
  isConfigured: boolean
  missingKeys: string[]
  config: Partial<FirebaseClientConfig>
}

/**
 * Reads environment variables configured in Vite (.env / .env.local).
 * Never logs or exposes secret values.
 */
export function getFirebaseConfigStatus(): FirebaseConfigStatus {
  const env = import.meta.env

  const config: Partial<FirebaseClientConfig> = {
    apiKey: env.VITE_FIREBASE_API_KEY?.trim() || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID?.trim() || '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '',
    appId: env.VITE_FIREBASE_APP_ID?.trim() || '',
  }

  const missingKeys: string[] = []
  if (!config.apiKey) missingKeys.push('VITE_FIREBASE_API_KEY')
  if (!config.projectId) missingKeys.push('VITE_FIREBASE_PROJECT_ID')
  if (!config.appId) missingKeys.push('VITE_FIREBASE_APP_ID')

  const isConfigured = missingKeys.length === 0

  return {
    isConfigured,
    missingKeys,
    config,
  }
}

/**
 * Returns whether Firebase environment configuration is complete.
 */
export function isFirebaseConfigured(): boolean {
  return getFirebaseConfigStatus().isConfigured
}

/**
 * Singleton cache for the initialized FirebaseApp instance.
 */
let cachedApp: FirebaseApp | null = null

/**
 * Returns strongly-typed initialized FirebaseApp instance.
 * Prevents duplicate initialization and validates environment keys.
 */
export function getFirebaseAppInstance(): FirebaseApp {
  const status = getFirebaseConfigStatus()
  if (!status.isConfigured) {
    throw new Error(
      `Firebase is not configured. Missing required environment variables: ${status.missingKeys.join(', ')}`
    )
  }

  if (cachedApp) {
    return cachedApp
  }

  const existingApps = getApps()
  if (existingApps.length > 0) {
    cachedApp = getApp()
    return cachedApp
  }

  const options: FirebaseOptions = {
    apiKey: status.config.apiKey,
    authDomain: status.config.authDomain,
    projectId: status.config.projectId,
    storageBucket: status.config.storageBucket,
    messagingSenderId: status.config.messagingSenderId,
    appId: status.config.appId,
  }

  cachedApp = initializeApp(options)
  return cachedApp
}
