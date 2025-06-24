/**
 * LinkedIn Integration Design Utilities
 * Provides consistent styling functions and constants for LinkedIn features
 */

// LinkedIn Brand Colors
export const linkedinColors = {
  primary: '#0077B5',
  hover: '#005885',
  light: '#E8F4F8',
  dark: '#004264',
} as const;

// Sync Status Types
export type SyncStatus = 'success' | 'pending' | 'error' | 'idle';

// Sync Status Color Map
export const syncStatusColors = {
  success: {
    text: 'text-sync-success-700 dark:text-sync-success-200',
    bg: 'bg-sync-success-100 dark:bg-sync-success-900',
    border: 'border-sync-success-200 dark:border-sync-success-700',
    icon: 'text-sync-success-500 dark:text-sync-success-400',
  },
  pending: {
    text: 'text-sync-pending-700 dark:text-sync-pending-200',
    bg: 'bg-sync-pending-100 dark:bg-sync-pending-900',
    border: 'border-sync-pending-200 dark:border-sync-pending-700',
    icon: 'text-sync-pending-500 dark:text-sync-pending-400',
  },
  error: {
    text: 'text-sync-error-700 dark:text-sync-error-200',
    bg: 'bg-sync-error-100 dark:bg-sync-error-900',
    border: 'border-sync-error-200 dark:border-sync-error-700',
    icon: 'text-sync-error-500 dark:text-sync-error-400',
  },
  idle: {
    text: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    icon: 'text-gray-400 dark:text-gray-500',
  },
} as const;

// Get sync status classes
export function getSyncStatusClasses(status: SyncStatus) {
  return syncStatusColors[status];
}

// Get sync badge classes
export function getSyncBadgeClasses(status: SyncStatus): string {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const statusClasses = {
    success: 'text-sync-success-700 bg-sync-success-100 dark:text-sync-success-200 dark:bg-sync-success-900',
    pending: 'text-sync-pending-700 bg-sync-pending-100 dark:text-sync-pending-200 dark:bg-sync-pending-900 animate-pulse-slow',
    error: 'text-sync-error-700 bg-sync-error-100 dark:text-sync-error-200 dark:bg-sync-error-900',
    idle: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
  };
  
  return `${baseClasses} ${statusClasses[status]}`;
}

// Get sync card classes
export function getSyncCardClasses(status: SyncStatus): string {
  const baseClasses = 'p-4 rounded-lg border-2 transition-all duration-250';
  const statusClasses = {
    success: 'bg-sync-success-50 border-sync-success-200 text-sync-success-800 dark:bg-sync-success-900 dark:border-sync-success-700 dark:text-sync-success-200',
    pending: 'bg-sync-pending-50 border-sync-pending-200 text-sync-pending-800 dark:bg-sync-pending-900 dark:border-sync-pending-700 dark:text-sync-pending-200 animate-pulse-slow',
    error: 'bg-sync-error-50 border-sync-error-200 text-sync-error-800 dark:bg-sync-error-900 dark:border-sync-error-700 dark:text-sync-error-200',
    idle: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200',
  };
  
  return `${baseClasses} ${statusClasses[status]}`;
}

// LinkedIn button variants
export type LinkedInButtonVariant = 'primary' | 'outline' | 'ghost';

// Get LinkedIn button classes
export function getLinkedInButtonClasses(variant: LinkedInButtonVariant = 'primary'): string {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-all duration-250 ease-smooth focus:outline-none focus:ring-2 focus:ring-linkedin-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900';
  
  const variantClasses = {
    primary: 'text-white bg-linkedin-500 hover:bg-linkedin-600 active:bg-linkedin-700',
    outline: 'text-linkedin-500 bg-transparent border-2 border-linkedin-500 hover:bg-linkedin-50 dark:hover:bg-linkedin-900 dark:text-linkedin-200 dark:border-linkedin-200',
    ghost: 'text-linkedin-500 bg-transparent hover:bg-linkedin-50 dark:text-linkedin-200 dark:hover:bg-linkedin-900',
  };
  
  return `${baseClasses} ${variantClasses[variant]}`;
}

// LinkedIn card classes with hover effects
export function getLinkedInCardClasses(interactive: boolean = true): string {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg transition-all duration-250 shadow-linkedin';
  const interactiveClasses = interactive ? 'hover:shadow-linkedin-hover active:shadow-linkedin-active cursor-pointer' : '';
  
  return `${baseClasses} ${interactiveClasses}`.trim();
}

// Get sync status icon
export function getSyncStatusIcon(status: SyncStatus): string {
  const icons = {
    success: '✓',
    pending: '⟳',
    error: '✕',
    idle: '○',
  };
  
  return icons[status];
}

// Format sync timestamp
export function formatSyncTimestamp(date: Date | string | null): string {
  if (!date) return 'Never synced';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return dateObj.toLocaleDateString();
}

// LinkedIn profile URL utilities
export function isValidLinkedInUrl(url: string): boolean {
  const linkedInPattern = /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[\w-]+\/?$/i;
  return linkedInPattern.test(url);
}

export function extractLinkedInUsername(url: string): string | null {
  const match = url.match(/linkedin\.com\/(?:in|company)\/([\w-]+)/i);
  return match ? match[1] : null;
}

export function formatLinkedInUrl(username: string, type: 'personal' | 'company' = 'personal'): string {
  const prefix = type === 'personal' ? 'in' : 'company';
  return `https://www.linkedin.com/${prefix}/${username}`;
}

// Animation utility classes
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  pulseSlow: 'animate-pulse-slow',
  syncPulse: 'animate-sync-pulse',
} as const;

// Shadow utility classes
export const shadowClasses = {
  linkedin: 'shadow-linkedin',
  linkedinHover: 'hover:shadow-linkedin-hover',
  linkedinActive: 'active:shadow-linkedin-active',
  syncPending: 'shadow-sync-pending',
  syncSuccess: 'shadow-sync-success',
  syncError: 'shadow-sync-error',
} as const;

// Transition utility classes
export const transitionClasses = {
  fast: 'transition-all duration-150',
  base: 'transition-all duration-250',
  slow: 'transition-all duration-350',
  smooth: 'transition-all duration-250 ease-smooth',
  colors: 'transition-colors duration-250',
  shadow: 'transition-shadow duration-250',
} as const;