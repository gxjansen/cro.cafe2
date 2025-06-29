/**
 * PWA Context Detection and Management
 * Provides utilities to detect and manage PWA vs Browser contexts
 */

export type AppContext = 'browser' | 'pwa';

export interface PWAContextState {
  context: AppContext;
  isStandalone: boolean;
  isPWAInstalled: boolean;
  hasMinimalUI: boolean;
  canInstallPWA: boolean;
}

/**
 * Detects the current app context
 * This works both client-side and can be used for SSR context
 */
export function detectAppContext(): AppContext {
  if (typeof window === 'undefined') {
    // Server-side: default to browser, will be hydrated client-side
    return 'browser'
  }

  // Check if running in standalone mode (PWA)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')

  return isStandalone ? 'pwa' : 'browser'
}

/**
 * Get comprehensive PWA context information
 */
export function getPWAContext(): PWAContextState {
  if (typeof window === 'undefined') {
    return {
      context: 'browser',
      isStandalone: false,
      isPWAInstalled: false,
      hasMinimalUI: false,
      canInstallPWA: false
    }
  }

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')

  const hasMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches

  // Check if PWA can be installed
  let canInstallPWA = false
  if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
    canInstallPWA = true
  }

  return {
    context: isStandalone ? 'pwa' : 'browser',
    isStandalone,
    isPWAInstalled: isStandalone,
    hasMinimalUI,
    canInstallPWA
  }
}

/**
 * Store for reactive PWA context state
 */
import { atom, computed } from 'nanostores'

export const pwaContextStore = atom<PWAContextState>(
  typeof window !== 'undefined'
    ? getPWAContext()
    : {
      context: 'browser',
      isStandalone: false,
      isPWAInstalled: false,
      hasMinimalUI: false,
      canInstallPWA: false
    }
)

// Computed values for easy consumption
export const appContext = computed(pwaContextStore, state => state.context)
export const isPWAMode = computed(pwaContextStore, state => state.context === 'pwa')
export const isBrowserMode = computed(pwaContextStore, state => state.context === 'browser')

/**
 * Initialize PWA context detection
 * Call this on the client-side after hydration
 */
export function initializePWAContext() {
  if (typeof window === 'undefined') {return}

  // Initial detection
  pwaContextStore.set(getPWAContext())

  // Listen for display mode changes
  const mediaQuery = window.matchMedia('(display-mode: standalone)')
  mediaQuery.addEventListener('change', () => {
    pwaContextStore.set(getPWAContext())
  })

  // Listen for app install events
  window.addEventListener('appinstalled', () => {
    pwaContextStore.set(getPWAContext())
  })
}

/**
 * CSS class helpers for conditional styling
 */
export function getPWAContextClasses(): string {
  const context = pwaContextStore.get()
  const classes = [`app-context-${context.context}`]

  if (context.isStandalone) {classes.push('app-standalone')}
  if (context.hasMinimalUI) {classes.push('app-minimal-ui')}
  if (context.canInstallPWA) {classes.push('app-installable')}

  return classes.join(' ')
}

/**
 * Hook for React components
 */
export function usePWAContext() {
  if (typeof window === 'undefined') {
    return {
      context: 'browser' as AppContext,
      isStandalone: false,
      isPWAMode: false,
      isBrowserMode: true
    }
  }

  const state = pwaContextStore.get()
  return {
    context: state.context,
    isStandalone: state.isStandalone,
    isPWAMode: state.context === 'pwa',
    isBrowserMode: state.context === 'browser'
  }
}