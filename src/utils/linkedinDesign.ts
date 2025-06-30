/**
 * LinkedIn Integration Design Utilities
 * Provides consistent styling functions and constants for LinkedIn features
 */

// LinkedIn Brand Colors
export const linkedinColors = {
  primary: '#0077B5',
  hover: '#005885',
  light: '#E8F4F8',
  dark: '#004264'
} as const

// Sync Status Types
export type SyncStatus = 'success' | 'pending' | 'error' | 'idle';

// Sync Status Color Map
export const syncStatusColors = {
  success: {
    text: 'text-green-700 dark:text-green-200',
    bg: 'bg-green-100 dark:bg-green-900',
    border: 'border-green-200 dark:border-green-700',
    icon: 'text-green-500 dark:text-green-400'
  },
  pending: {
    text: 'text-yellow-700 dark:text-yellow-200',
    bg: 'bg-yellow-100 dark:bg-yellow-900',
    border: 'border-yellow-200 dark:border-yellow-700',
    icon: 'text-yellow-500 dark:text-yellow-400'
  },
  error: {
    text: 'text-red-700 dark:text-red-200',
    bg: 'bg-red-100 dark:bg-red-900',
    border: 'border-red-200 dark:border-red-700',
    icon: 'text-red-500 dark:text-red-400'
  },
  idle: {
    text: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    icon: 'text-gray-400 dark:text-gray-500'
  }
} as const

// Get sync status classes
export function getSyncStatusClasses(status: SyncStatus) {
  return syncStatusColors[status]
}

// Get sync badge classes
export function getSyncBadgeClasses(status: SyncStatus): string {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const statusClasses = {
    success: 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-900',
    pending: 'text-yellow-700 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900 animate-pulse',
    error: 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900',
    idle: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'
  }

  return `${baseClasses} ${statusClasses[status]}`
}

// Get sync card classes
export function getSyncCardClasses(status: SyncStatus): string {
  const baseClasses = 'p-4 rounded-lg border-2 transition-all duration-200'
  const statusClasses = {
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200',
    pending: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200 animate-pulse',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200',
    idle: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200'
  }

  return `${baseClasses} ${statusClasses[status]}`
}

// LinkedIn button variants
export type LinkedInButtonVariant = 'primary' | 'outline' | 'ghost';

// Get LinkedIn button classes
export function getLinkedInButtonClasses(variant: LinkedInButtonVariant = 'primary'): string {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'

  const variantClasses = {
    primary: 'text-white bg-[#0077B5] hover:bg-[#005885] active:bg-[#004264]',
    outline: 'text-[#0077B5] bg-transparent border-2 border-[#0077B5] hover:bg-blue-50 dark:hover:bg-blue-900 dark:text-blue-200 dark:border-blue-200',
    ghost: 'text-[#0077B5] bg-transparent hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-900'
  }

  return `${baseClasses} ${variantClasses[variant]}`
}

// LinkedIn card classes with hover effects
export function getLinkedInCardClasses(interactive: boolean = true): string {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 shadow-md'
  const interactiveClasses = interactive ? 'hover:shadow-lg active:shadow-sm cursor-pointer' : ''

  return `${baseClasses} ${interactiveClasses}`.trim()
}

// Get sync status icon
export function getSyncStatusIcon(status: SyncStatus): string {
  const icons = {
    success: '✓',
    pending: '⟳',
    error: '✕',
    idle: '○'
  }

  return icons[status]
}

// Format sync timestamp
export function formatSyncTimestamp(date: Date | string | null): string {
  if (!date) {return 'Never synced'}

  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) {return 'Just now'}
  if (diffMins < 60) {return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`}
  if (diffHours < 24) {return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`}
  if (diffDays < 7) {return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`}

  return dateObj.toLocaleDateString()
}

// LinkedIn profile URL utilities
export function isValidLinkedInUrl(url: string): boolean {
  const linkedInPattern = /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[\w-]+\/?$/i
  return linkedInPattern.test(url)
}

export function extractLinkedInUsername(url: string): string | null {
  const match = url.match(/linkedin\.com\/(?:in|company)\/([\w-]+)/i)
  return match ? match[1] : null
}

export function formatLinkedInUrl(username: string, type: 'personal' | 'company' = 'personal'): string {
  const prefix = type === 'personal' ? 'in' : 'company'
  return `https://www.linkedin.com/${prefix}/${username}`
}

// Animation utility classes
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-in-up',
  pulseSlow: 'animate-pulse',
  syncPulse: 'animate-pulse'
} as const

// Shadow utility classes
export const shadowClasses = {
  linkedin: 'shadow-md',
  linkedinHover: 'hover:shadow-lg',
  linkedinActive: 'active:shadow-sm',
  syncPending: 'shadow-md',
  syncSuccess: 'shadow-md',
  syncError: 'shadow-md'
} as const

// Transition utility classes
export const transitionClasses = {
  fast: 'transition-all duration-150',
  base: 'transition-all duration-200',
  slow: 'transition-all duration-300',
  smooth: 'transition-all duration-200 ease-in-out',
  colors: 'transition-colors duration-200',
  shadow: 'transition-shadow duration-200'
} as const