/**
 * Display helpers for LinkedIn data
 * Provides an additional safety layer for displaying LinkedIn content
 */

export function safeDisplayText(text: string | null | undefined): string {
  if (!text) return '';
  
  // Final safety check - remove any remaining problematic characters
  return text
    .replace(/⌆/g, '')
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Remove any remaining emojis
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .trim();
}

export function truncateWithEllipsis(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  
  // Smart truncation at word boundary
  const truncated = text.substr(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return text.substr(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
}

export function parseLinkedInJson<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.warn('Failed to parse LinkedIn JSON:', e);
    return defaultValue;
  }
}

export function getLinkedInValue<T>(
  linkedinValue: T | null | undefined,
  staticValue: T | null | undefined,
  defaultValue: T
): T {
  // Priority: LinkedIn data > static data > default value
  return linkedinValue || staticValue || defaultValue;
}