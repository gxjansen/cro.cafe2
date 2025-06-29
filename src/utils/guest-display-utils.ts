/**
 * Guest Display Utilities
 *
 * Smart deduplication logic for guest professional information display
 */

import type { Language } from '../types'

export interface ProfessionalDisplay {
  primary: string | null;
  secondary: string | null;
  showBoth: boolean;
}

export interface GuestData {
  role?: string;
  company?: string;
  headline?: string;
  isFreelancer?: boolean;
}

/**
 * Normalize text for comparison by removing special characters and standardizing format
 */
function normalizeText(text: string): string {
  if (!text) {return ''}

  return text
    .toLowerCase()
    .replace(/[@&]/g, ' at ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculate similarity between two text strings based on word overlap and semantic similarity
 */
function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) {return 0}

  const norm1 = normalizeText(text1)
  const norm2 = normalizeText(text2)

  if (norm1 === norm2) {return 1}

  // Filter out connector words that are used for localization
  const connectorWords = ['at', 'bij', 'bei', 'en']
  const words1 = norm1.split(' ').filter(w => w.length > 2 && !connectorWords.includes(w))
  const words2 = norm2.split(' ').filter(w => w.length > 2 && !connectorWords.includes(w))

  if (words1.length === 0 && words2.length === 0) {return 1}
  if (words1.length === 0 || words2.length === 0) {return 0}

  // Define semantic similarity groups for common role titles
  const semanticGroups = [
    ['founder', 'owner', 'ceo', 'chief executive'],
    ['director', 'head', 'lead', 'manager'],
    ['developer', 'engineer', 'programmer', 'coder'],
    ['designer', 'ux', 'ui', 'creative'],
    ['consultant', 'advisor', 'specialist', 'expert'],
    ['analyst', 'researcher', 'data scientist'],
    ['marketer', 'marketing', 'growth', 'digital marketer']
  ]

  // Create sets for exact matching
  const set1 = new Set(words1)
  const set2 = new Set(words2)

  // Calculate exact word matches
  const exactMatches = new Set([...set1].filter(w => set2.has(w)))

  // Calculate semantic matches (words that belong to the same semantic group)
  const semanticMatches = new Set()
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 !== word2) {
        // Check if both words belong to the same semantic group
        for (const group of semanticGroups) {
          if (group.includes(word1) && group.includes(word2)) {
            semanticMatches.add(word1)
            semanticMatches.add(word2)
            break
          }
        }
      }
    }
  }

  // Combined similarity: exact matches + semantic matches
  const totalMatches = exactMatches.size + (semanticMatches.size / 2) // Weight semantic matches slightly less
  const totalWords = new Set([...words1, ...words2]).size

  return totalMatches / totalWords
}

/**
 * Check if one text is more informative than another
 */
function isMoreInformative(text1: string, text2: string): boolean {
  if (!text1 || !text2) {return Boolean(text1)}

  // Longer text with meaningful content is generally more informative
  const meaningfulWords1 = normalizeText(text1).split(' ').filter(w => w.length > 2).length
  const meaningfulWords2 = normalizeText(text2).split(' ').filter(w => w.length > 2).length

  if (meaningfulWords1 !== meaningfulWords2) {
    return meaningfulWords1 > meaningfulWords2
  }

  // Prefer more specific role titles
  const specificRoles = ['head', 'director', 'manager', 'founder', 'ceo', 'cto', 'vp', 'vice president']
  const hasSpecific1 = specificRoles.some(role => normalizeText(text1).includes(role))
  const hasSpecific2 = specificRoles.some(role => normalizeText(text2).includes(role))

  if (hasSpecific1 !== hasSpecific2) {
    return hasSpecific1
  }

  // Default to first text if equal
  return true
}

/**
 * Normalize role text that might already contain localized separators
 */
function normalizeRoleText(text: string, language: Language, translations: Record<Language, { at: string }>): string {
  if (!text) {return text}

  // List of all possible "at" variations to replace
  const atVariations = ['at', 'bij', 'bei', 'en']
  const currentAt = translations[language].at

  // Replace any existing "at" variation with the correct localized one
  let normalized = text
  for (const variation of atVariations) {
    if (variation !== currentAt) {
      // Use word boundaries to avoid replacing parts of words
      const regex = new RegExp(`\\b${variation}\\b`, 'gi')
      normalized = normalized.replace(regex, currentAt)
    }
  }

  return normalized
}

/**
 * Get optimal professional display for guest information
 */
export function getOptimalProfessionalDisplay(
  guestData: GuestData,
  language: Language,
  translations: Record<Language, { at: string }>
): ProfessionalDisplay {
  const { role, company, headline, isFreelancer } = guestData

  // Build structured display (role + company)
  let structured = ''
  if (role && company && !isFreelancer) {
    structured = `${role} ${translations[language].at} ${company}`
  } else if (role) {
    // Normalize the role text to use correct localized separators
    structured = normalizeRoleText(role, language, translations)
  } else if (company && !isFreelancer) {
    structured = company
  }

  // If no headline, return structured data only
  if (!headline) {
    return {
      primary: structured || null,
      secondary: null,
      showBoth: false
    }
  }

  // If no structured data, return normalized headline only
  if (!structured) {
    return {
      primary: normalizeRoleText(headline, language, translations),
      secondary: null,
      showBoth: false
    }
  }

  // Normalize the headline for consistency
  const normalizedHeadline = normalizeRoleText(headline, language, translations)

  // Calculate similarity between structured and normalized headline
  const similarity = calculateSimilarity(structured, normalizedHeadline)

  // High similarity threshold - likely redundant
  if (similarity > 0.7) {
    // Prefer structured format when it includes proper localization (contains "at", "bij", "bei", "en")
    const hasLocalizedConnector = /\b(at|bij|bei|en)\b/i.test(structured)
    if (hasLocalizedConnector) {
      return {
        primary: structured,
        secondary: null,
        showBoth: false
      }
    }

    const useStructured = isMoreInformative(structured, normalizedHeadline)
    return {
      primary: useStructured ? structured : normalizedHeadline,
      secondary: null,
      showBoth: false
    }
  }

  // Medium similarity - check for career progression indicators
  if (similarity > 0.4) {
    const careerKeywords = ['former', 'previously', 'ex-', 'past', 'current', 'now']
    const hasCareerContext = careerKeywords.some(keyword =>
      normalizeText(normalizedHeadline).includes(keyword)
    )

    if (hasCareerContext) {
      return {
        primary: structured,
        secondary: normalizedHeadline,
        showBoth: true
      }
    }

    // Check if headline adds meaningful specialization context
    const specializationKeywords = ['expert', 'specialist', 'consultant', 'advisor', 'strategist']
    const hasSpecialization = specializationKeywords.some(keyword =>
      normalizeText(normalizedHeadline).includes(keyword)
    )

    if (hasSpecialization) {
      return {
        primary: structured,
        secondary: normalizedHeadline,
        showBoth: true
      }
    }

    // Default to more informative version for medium similarity
    const useStructured = isMoreInformative(structured, normalizedHeadline)
    return {
      primary: useStructured ? structured : normalizedHeadline,
      secondary: null,
      showBoth: false
    }
  }

  // Low similarity - show both as they provide different value
  return {
    primary: structured,
    secondary: normalizedHeadline,
    showBoth: true
  }
}

/**
 * Helper function to check if guest is a freelancer
 */
export function checkIsFreelancer(headline?: string, role?: string): boolean {
  const checkText = (text: string) =>
    text && text.toLowerCase().includes('freelance')

  return checkText(headline || '') || checkText(role || '')
}