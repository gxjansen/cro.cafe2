/**
 * Guest Display Utilities
 * 
 * Smart deduplication logic for guest professional information display
 */

import type { Language } from '../types';

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
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[@&]/g, ' at ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity between two text strings based on word overlap
 */
function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);
  
  if (norm1 === norm2) return 1;
  
  const words1 = new Set(norm1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(norm2.split(' ').filter(w => w.length > 2));
  
  if (words1.size === 0 && words2.size === 0) return 1;
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Check if one text is more informative than another
 */
function isMoreInformative(text1: string, text2: string): boolean {
  if (!text1 || !text2) return Boolean(text1);
  
  // Longer text with meaningful content is generally more informative
  const meaningfulWords1 = normalizeText(text1).split(' ').filter(w => w.length > 2).length;
  const meaningfulWords2 = normalizeText(text2).split(' ').filter(w => w.length > 2).length;
  
  if (meaningfulWords1 !== meaningfulWords2) {
    return meaningfulWords1 > meaningfulWords2;
  }
  
  // Prefer more specific role titles
  const specificRoles = ['head', 'director', 'manager', 'founder', 'ceo', 'cto', 'vp', 'vice president'];
  const hasSpecific1 = specificRoles.some(role => normalizeText(text1).includes(role));
  const hasSpecific2 = specificRoles.some(role => normalizeText(text2).includes(role));
  
  if (hasSpecific1 !== hasSpecific2) {
    return hasSpecific1;
  }
  
  // Default to first text if equal
  return true;
}

/**
 * Get optimal professional display for guest information
 */
export function getOptimalProfessionalDisplay(
  guestData: GuestData,
  language: Language,
  translations: Record<Language, { at: string }>
): ProfessionalDisplay {
  const { role, company, headline, isFreelancer } = guestData;
  
  // Build structured display (role + company)
  let structured = '';
  if (role && company && !isFreelancer) {
    structured = `${role} ${translations[language].at} ${company}`;
  } else if (role) {
    structured = role;
  } else if (company && !isFreelancer) {
    structured = company;
  }
  
  // If no headline, return structured data only
  if (!headline) {
    return {
      primary: structured || null,
      secondary: null,
      showBoth: false
    };
  }
  
  // If no structured data, return headline only
  if (!structured) {
    return {
      primary: headline,
      secondary: null,
      showBoth: false
    };
  }
  
  // Calculate similarity between structured and headline
  const similarity = calculateSimilarity(structured, headline);
  
  // High similarity threshold - likely redundant
  if (similarity > 0.7) {
    const useStructured = isMoreInformative(structured, headline);
    return {
      primary: useStructured ? structured : headline,
      secondary: null,
      showBoth: false
    };
  }
  
  // Medium similarity - check for career progression indicators
  if (similarity > 0.4) {
    const careerKeywords = ['former', 'previously', 'ex-', 'past', 'current', 'now'];
    const hasCareerContext = careerKeywords.some(keyword => 
      normalizeText(headline).includes(keyword)
    );
    
    if (hasCareerContext) {
      return {
        primary: structured,
        secondary: headline,
        showBoth: true
      };
    }
    
    // Check if headline adds meaningful specialization context
    const specializationKeywords = ['expert', 'specialist', 'consultant', 'advisor', 'strategist'];
    const hasSpecialization = specializationKeywords.some(keyword => 
      normalizeText(headline).includes(keyword)
    );
    
    if (hasSpecialization) {
      return {
        primary: structured,
        secondary: headline,
        showBoth: true
      };
    }
    
    // Default to more informative version for medium similarity
    const useStructured = isMoreInformative(structured, headline);
    return {
      primary: useStructured ? structured : headline,
      secondary: null,
      showBoth: false
    };
  }
  
  // Low similarity - show both as they provide different value
  return {
    primary: structured,
    secondary: headline,
    showBoth: true
  };
}

/**
 * Helper function to check if guest is a freelancer
 */
export function checkIsFreelancer(headline?: string, role?: string): boolean {
  const checkText = (text: string) => 
    text && text.toLowerCase().includes('freelance');
  
  return checkText(headline || '') || checkText(role || '');
}