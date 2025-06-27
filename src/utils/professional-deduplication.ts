/**
 * Professional Information Deduplication Utilities
 * 
 * This module provides intelligent deduplication for guest professional information
 * to prevent showing redundant role/company combinations and LinkedIn headlines.
 */

import type { Language } from '../types';

/**
 * Normalized text for comparison - removes punctuation, extra spaces, and converts to lowercase
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
    .trim();
}

/**
 * Calculate text similarity using Jaccard similarity coefficient
 * Based on word overlap between two strings
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const words1 = new Set(normalizeText(text1).split(' ').filter(word => word.length > 2));
  const words2 = new Set(normalizeText(text2).split(' ').filter(word => word.length > 2));
  
  if (words1.size === 0 && words2.size === 0) return 1;
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set(Array.from(words1).filter(word => words2.has(word)));
  const union = new Set(Array.from(words1).concat(Array.from(words2)));
  
  return intersection.size / union.size;
}

/**
 * Check if two professional descriptions are substantially similar
 */
function areSimilarProfessionalDescriptions(desc1: string, desc2: string): boolean {
  const similarity = calculateTextSimilarity(desc1, desc2);
  return similarity > 0.6; // 60% similarity threshold
}

/**
 * Score the informativeness of a professional description
 * Higher score = more informative
 */
function scoreInformativeness(text: string): number {
  if (!text) return 0;
  
  let score = 0;
  const normalized = normalizeText(text);
  const words = normalized.split(' ').filter(word => word.length > 2);
  
  // Base score from word count (more words = more informative)
  score += Math.min(words.length * 2, 20);
  
  // Bonus for specific terms that indicate seniority/expertise
  const seniorityTerms = [
    'head', 'director', 'chief', 'lead', 'senior', 'principal', 
    'manager', 'founder', 'owner', 'ceo', 'cto', 'cmo', 'vp', 'vice president'
  ];
  seniorityTerms.forEach(term => {
    if (normalized.includes(term)) score += 5;
  });
  
  // Bonus for company/industry context
  const contextTerms = [
    'at', 'bij', 'bei', 'en', // Language-specific "at" words
    'group', 'company', 'corp', 'inc', 'ltd', 'gmbh', 'bv'
  ];
  contextTerms.forEach(term => {
    if (normalized.includes(term)) score += 3;
  });
  
  // Penalty for generic terms
  const genericTerms = ['freelance', 'consultant', 'expert', 'specialist'];
  genericTerms.forEach(term => {
    if (normalized.includes(term)) score -= 2;
  });
  
  return Math.max(score, 0);
}

/**
 * Interface for professional information
 */
export interface ProfessionalInfo {
  role?: string | null;
  company?: string | null;
  headline?: string | null;
  isFreelancer?: boolean;
}

/**
 * Interface for optimized professional display
 */
export interface OptimizedProfessionalDisplay {
  primaryText: string | null;
  secondaryText: string | null;
  headline: string | null;
  showHeadline: boolean;
  debugInfo?: {
    similarity: number;
    structuredScore: number;
    headlineScore: number;
    wasDeduped: boolean;
  };
}

/**
 * Get localized "at" text for role/company combinations
 */
function getAtText(language: Language): string {
  const translations = {
    en: 'at',
    nl: 'bij',
    de: 'bei',
    es: 'en'
  };
  return translations[language] || 'at';
}

/**
 * Create structured professional text from role and company
 */
function createStructuredText(role: string | null, company: string | null, language: Language): string | null {
  if (!role && !company) return null;
  if (!role) return company;
  if (!company) return role;
  
  const atText = getAtText(language);
  return `${role} ${atText} ${company}`;
}

/**
 * Optimize professional information display by intelligently handling duplicates
 */
export function optimizeProfessionalDisplay(
  professionalInfo: ProfessionalInfo,
  language: Language = 'en',
  enableDebug: boolean = false
): OptimizedProfessionalDisplay {
  const { role, company, headline, isFreelancer } = professionalInfo;
  
  // Handle freelancer case - only show headline if available
  if (isFreelancer) {
    return {
      primaryText: headline || role || null,
      secondaryText: null,
      headline: null,
      showHeadline: false,
      ...(enableDebug && {
        debugInfo: {
          similarity: 0,
          structuredScore: 0,
          headlineScore: headline ? scoreInformativeness(headline) : 0,
          wasDeduped: false
        }
      })
    };
  }
  
  // Create structured text from role/company
  const structuredText = createStructuredText(role, company, language);
  
  // If no headline or no structured text, return what we have
  if (!headline || !structuredText) {
    return {
      primaryText: structuredText || headline,
      secondaryText: null,
      headline: headline && structuredText ? headline : null,
      showHeadline: Boolean(headline && structuredText),
      ...(enableDebug && {
        debugInfo: {
          similarity: 0,
          structuredScore: structuredText ? scoreInformativeness(structuredText) : 0,
          headlineScore: headline ? scoreInformativeness(headline) : 0,
          wasDeduped: false
        }
      })
    };
  }
  
  // Calculate similarity between structured text and headline
  const similarity = calculateTextSimilarity(structuredText, headline);
  const structuredScore = scoreInformativeness(structuredText);
  const headlineScore = scoreInformativeness(headline);
  
  // If they're very similar (>80%), choose the more informative one
  if (similarity > 0.8) {
    const useHeadline = headlineScore > structuredScore;
    return {
      primaryText: useHeadline ? headline : structuredText,
      secondaryText: null,
      headline: null,
      showHeadline: false,
      ...(enableDebug && {
        debugInfo: {
          similarity,
          structuredScore,
          headlineScore,
          wasDeduped: true
        }
      })
    };
  }
  
  // If they're moderately similar (>60%), show the more informative as primary
  if (similarity > 0.6) {
    const useHeadlineAsPrimary = headlineScore > structuredScore;
    return {
      primaryText: useHeadlineAsPrimary ? headline : structuredText,
      secondaryText: null,
      headline: null,
      showHeadline: false,
      ...(enableDebug && {
        debugInfo: {
          similarity,
          structuredScore,
          headlineScore,
          wasDeduped: true
        }
      })
    };
  }
  
  // They're different enough - show both
  return {
    primaryText: structuredText,
    secondaryText: null,
    headline: headline,
    showHeadline: true,
    ...(enableDebug && {
      debugInfo: {
        similarity,
        structuredScore,
        headlineScore,
        wasDeduped: false
      }
    })
  };
}

/**
 * Extract professional information from guest data
 */
export function extractProfessionalInfo(guestData: any): ProfessionalInfo {
  // Get LinkedIn data with priority: LinkedIn data first, then fallback to static data
  const role = guestData.linkedin_current_role || guestData.role || guestData.title;
  const headline = guestData.linkedin_headline || null;
  
  // Check if guest is a freelancer
  const isFreelancer = (
    (headline && headline.toLowerCase().includes('freelance')) ||
    (role && role.toLowerCase().includes('freelance'))
  );
  
  // Only use company if not freelancer and linkedin_current_company exists
  const company = isFreelancer ? null : (guestData.linkedin_current_company || null);
  
  return {
    role,
    company,
    headline,
    isFreelancer
  };
}

/**
 * Convenience function to get optimized professional display from guest data
 */
export function getOptimizedGuestDisplay(
  guestData: any, 
  language: Language = 'en',
  enableDebug: boolean = false
): OptimizedProfessionalDisplay {
  const professionalInfo = extractProfessionalInfo(guestData);
  return optimizeProfessionalDisplay(professionalInfo, language, enableDebug);
}

/**
 * Legacy compatibility function - mimics the old role/company logic for backwards compatibility
 */
export function getLegacyRoleCompanyDisplay(guestData: any, language: Language = 'en'): {
  role: string | null;
  company: string | null;
  combinedText: string | null;
} {
  const { role, company, isFreelancer } = extractProfessionalInfo(guestData);
  
  const actualCompany = isFreelancer ? null : company;
  const combinedText = createStructuredText(role, actualCompany, language);
  
  return {
    role,
    company: actualCompany,
    combinedText
  };
}