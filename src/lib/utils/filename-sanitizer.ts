/**
 * Utility functions for sanitizing filenames to ensure URL compatibility
 * Handles special characters commonly found in names from various languages
 */

/**
 * Sanitizes a filename by replacing special characters with URL-safe equivalents
 * @param filename - The original filename to sanitize
 * @returns The sanitized filename safe for URLs
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return ''
  
  // First, handle common special character replacements
  let sanitized = filename
    // German characters
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
    
    // Spanish/Portuguese characters
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/ã/g, 'a')
    .replace(/õ/g, 'o')
    .replace(/Ã/g, 'A')
    .replace(/Õ/g, 'O')
    
    // French characters
    .replace(/é/g, 'e')
    .replace(/è/g, 'e')
    .replace(/ê/g, 'e')
    .replace(/ë/g, 'e')
    .replace(/É/g, 'E')
    .replace(/È/g, 'E')
    .replace(/Ê/g, 'E')
    .replace(/Ë/g, 'E')
    .replace(/à/g, 'a')
    .replace(/â/g, 'a')
    .replace(/À/g, 'A')
    .replace(/Â/g, 'A')
    .replace(/ô/g, 'o')
    .replace(/Ô/g, 'O')
    .replace(/ù/g, 'u')
    .replace(/û/g, 'u')
    .replace(/Ù/g, 'U')
    .replace(/Û/g, 'U')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    
    // Other diacritics
    .replace(/í/g, 'i')
    .replace(/ì/g, 'i')
    .replace(/î/g, 'i')
    .replace(/ï/g, 'i')
    .replace(/Í/g, 'I')
    .replace(/Ì/g, 'I')
    .replace(/Î/g, 'I')
    .replace(/Ï/g, 'I')
    .replace(/ó/g, 'o')
    .replace(/ò/g, 'o')
    .replace(/Ó/g, 'O')
    .replace(/Ò/g, 'O')
    .replace(/ú/g, 'u')
    .replace(/Ú/g, 'U')
    
    // Nordic characters
    .replace(/å/g, 'a')
    .replace(/Å/g, 'A')
    .replace(/ø/g, 'o')
    .replace(/Ø/g, 'O')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'Ae')
    
  // Replace any remaining non-alphanumeric characters (except dots and hyphens) with hyphens
  sanitized = sanitized.replace(/[^a-zA-Z0-9.-]/g, '-')
  
  // Clean up multiple consecutive hyphens
  sanitized = sanitized.replace(/-+/g, '-')
  
  // Remove leading/trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '')
  
  return sanitized
}

/**
 * Creates a mapping of original to sanitized filenames
 * Useful for debugging and tracking transformations
 */
export function createFilenameMapping(filenames: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  
  for (const filename of filenames) {
    const sanitized = sanitizeFilename(filename)
    if (filename !== sanitized) {
      mapping[filename] = sanitized
    }
  }
  
  return mapping
}

/**
 * Checks if a filename contains special characters that need sanitization
 */
export function needsSanitization(filename: string): boolean {
  return filename !== sanitizeFilename(filename)
}

/**
 * Extracts the base filename without extension and sanitizes it
 * Preserves the file extension
 */
export function sanitizeImageFilename(filename: string): string {
  if (!filename) return ''
  
  // Extract extension
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) {
    // No extension, sanitize the whole filename
    return sanitizeFilename(filename)
  }
  
  const base = filename.substring(0, lastDot)
  const extension = filename.substring(lastDot)
  
  // Sanitize the base and keep the extension
  return sanitizeFilename(base) + extension.toLowerCase()
}