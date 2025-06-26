/**
 * LinkedIn Integration Type Definitions
 * 
 * This module provides comprehensive TypeScript types for LinkedIn profile data
 * integration. It includes raw data types from NocoDB, transformed types for
 * components, type guards, and utility types for safe data handling.
 */

/**
 * LinkedIn Experience data from API
 */
export interface LinkedInExperience {
  /** Job title */
  title: string;
  /** Company name */
  company: string;
  /** Company LinkedIn URL */
  companyUrl?: string;
  /** Location of the position */
  location?: string;
  /** Start date in format YYYY-MM or YYYY */
  startDate?: string;
  /** End date in format YYYY-MM or YYYY, null if current position */
  endDate?: string | null;
  /** Whether this is the current position */
  isCurrent?: boolean;
  /** Job description */
  description?: string;
  /** Duration in human-readable format */
  duration?: string;
}

/**
 * LinkedIn Personal Website data
 */
export interface LinkedInWebsite {
  /** Website URL */
  url: string;
  /** Website type (e.g., 'personal', 'company', 'portfolio') */
  type?: string;
  /** Website title or label */
  label?: string;
}

/**
 * LinkedIn Publication data
 */
export interface LinkedInPublication {
  /** Publication title */
  title: string;
  /** Publisher name */
  publisher?: string;
  /** Publication date */
  date?: string;
  /** Publication URL */
  url?: string;
  /** Authors list */
  authors?: string[];
  /** Publication description */
  description?: string;
}

/**
 * Raw LinkedIn data as stored in NocoDB
 * This represents the data structure exactly as it comes from the database
 */
export interface LinkedInDataRaw {
  /** LinkedIn profile URL */
  linkedin_url?: string | null;
  /** Full name from LinkedIn */
  linkedin_full_name?: string | null;
  /** First name from LinkedIn */
  linkedin_first_name?: string | null;
  /** Professional headline */
  linkedin_headline?: string | null;
  /** Email address from LinkedIn */
  linkedin_email?: string | null;
  /** Biography/summary */
  linkedin_bio?: string | null;
  /** Profile picture URL */
  linkedin_profile_pic?: string | null;
  /** Current job title */
  linkedin_current_role?: string | null;
  /** Current company name */
  linkedin_current_company?: string | null;
  /** Country/location */
  linkedin_country?: string | null;
  /** Skills as comma-separated string or JSON array */
  linkedin_skills?: string | null;
  /** Company website URL */
  linkedin_company_website?: string | null;
  /** Work experiences as JSON string */
  linkedin_experiences?: string | null;
  /** Personal websites as JSON string */
  linkedin_personal_website?: string | null;
  /** Publications as JSON string */
  linkedin_publications?: string | null;
  /** Last synchronization timestamp */
  linkedin_last_modified?: string | Date | null;
}

/**
 * Parsed and validated LinkedIn data for use in components
 * This represents the cleaned and transformed data structure
 */
export interface LinkedInData {
  /** LinkedIn profile URL */
  url?: string;
  /** Full name from LinkedIn */
  fullName?: string;
  /** First name from LinkedIn */
  firstName?: string;
  /** Professional headline */
  headline?: string;
  /** Email address */
  email?: string;
  /** Biography/summary */
  bio?: string;
  /** Profile picture URL */
  profilePicUrl?: string;
  /** Current job title */
  currentRole?: string;
  /** Current company name */
  currentCompany?: string;
  /** Country/location */
  country?: string;
  /** Array of skills */
  skills: string[];
  /** Company website URL */
  companyWebsite?: string;
  /** Array of work experiences */
  experiences: LinkedInExperience[];
  /** Array of personal websites */
  personalWebsites: LinkedInWebsite[];
  /** Array of publications */
  publications: LinkedInPublication[];
  /** Last synchronization date */
  lastSync?: Date;
}

/**
 * Guest data extended with LinkedIn information
 * This combines the existing Guest type with LinkedIn data
 */
export interface GuestWithLinkedIn {
  /** Existing guest data */
  name: string;
  bio: string;
  company?: string;
  role?: string;
  email?: string;
  website?: string;
  linkedin?: string;
  /** LinkedIn enhanced data */
  linkedInData?: LinkedInData;
  /** Raw LinkedIn data for debugging */
  linkedInRaw?: LinkedInDataRaw;
}

/**
 * Type guard to check if a value is a valid LinkedInExperience
 */
export function isLinkedInExperience(value: unknown): value is LinkedInExperience {
  if (typeof value !== 'object' || value === null) return false;
  
  const exp = value as Record<string, unknown>;
  return (
    typeof exp.title === 'string' &&
    typeof exp.company === 'string' &&
    (exp.companyUrl === undefined || typeof exp.companyUrl === 'string') &&
    (exp.location === undefined || typeof exp.location === 'string') &&
    (exp.startDate === undefined || typeof exp.startDate === 'string') &&
    (exp.endDate === undefined || exp.endDate === null || typeof exp.endDate === 'string') &&
    (exp.isCurrent === undefined || typeof exp.isCurrent === 'boolean') &&
    (exp.description === undefined || typeof exp.description === 'string') &&
    (exp.duration === undefined || typeof exp.duration === 'string')
  );
}

/**
 * Type guard to check if a value is a valid LinkedInWebsite
 */
export function isLinkedInWebsite(value: unknown): value is LinkedInWebsite {
  if (typeof value !== 'object' || value === null) return false;
  
  const website = value as Record<string, unknown>;
  return (
    typeof website.url === 'string' &&
    (website.type === undefined || typeof website.type === 'string') &&
    (website.label === undefined || typeof website.label === 'string')
  );
}

/**
 * Type guard to check if a value is a valid LinkedInPublication
 */
export function isLinkedInPublication(value: unknown): value is LinkedInPublication {
  if (typeof value !== 'object' || value === null) return false;
  
  const pub = value as Record<string, unknown>;
  return (
    typeof pub.title === 'string' &&
    (pub.publisher === undefined || typeof pub.publisher === 'string') &&
    (pub.date === undefined || typeof pub.date === 'string') &&
    (pub.url === undefined || typeof pub.url === 'string') &&
    (pub.authors === undefined || (Array.isArray(pub.authors) && pub.authors.every(a => typeof a === 'string'))) &&
    (pub.description === undefined || typeof pub.description === 'string')
  );
}

/**
 * Type guard to check if a value has LinkedIn data
 */
export function hasLinkedInData(value: unknown): value is { linkedInData: LinkedInData } {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  return obj.linkedInData !== undefined && typeof obj.linkedInData === 'object';
}

/**
 * Safely parse JSON string with fallback
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  
  try {
    const parsed = JSON.parse(jsonString);
    
    // If we expect an array but got something else, return fallback
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Parse skills from various formats (comma-separated string or JSON array)
 */
export function parseSkills(skills: string | null | undefined): string[] {
  if (!skills) return [];
  
  // Try parsing as JSON array first
  try {
    const parsed = JSON.parse(skills);
    if (Array.isArray(parsed)) {
      return parsed.filter(skill => typeof skill === 'string');
    }
  } catch {
    // If JSON parsing fails, treat as comma-separated string
    return skills.split(',').map(skill => skill.trim()).filter(Boolean);
  }
  
  return [];
}

/**
 * Transform raw LinkedIn data from NocoDB to clean LinkedInData
 */
export function transformLinkedInData(raw: LinkedInDataRaw): LinkedInData {
  // Parse complex JSON fields - handle both string and object formats
  let experiences: LinkedInExperience[] = [];
  if (raw.linkedin_experiences) {
    try {
      // First, try parsing as JSON string
      const parsed = typeof raw.linkedin_experiences === 'string' 
        ? JSON.parse(raw.linkedin_experiences) 
        : raw.linkedin_experiences;
      
      // Handle the specific structure from MDX files
      if (Array.isArray(parsed)) {
        experiences = parsed.map(exp => ({
          title: exp.title || '',
          company: exp.subtitle?.split(' · ')[0] || exp.company || '',
          companyUrl: exp.companyLink1 || exp.companyUrl,
          location: exp.metadata || exp.location,
          description: exp.subComponents?.[0]?.description?.[0]?.text || exp.description,
          duration: exp.caption || exp.duration,
          isCurrent: exp.caption?.includes('Present') || exp.isCurrent,
        })).filter(exp => exp.title && exp.company);
      }
    } catch (error) {
      console.error('Error parsing experiences:', error);
    }
  }
  
  let personalWebsites: LinkedInWebsite[] = [];
  if (raw.linkedin_personal_website) {
    try {
      const parsed = typeof raw.linkedin_personal_website === 'string' 
        ? JSON.parse(raw.linkedin_personal_website) 
        : raw.linkedin_personal_website;
      
      // Handle single website object format from MDX
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (parsed.link || parsed.url) {
          personalWebsites = [{
            url: parsed.link || parsed.url,
            label: parsed.name || parsed.label,
          }];
        }
      } else if (Array.isArray(parsed)) {
        personalWebsites = parsed.filter(isLinkedInWebsite);
      }
    } catch (error) {
      console.error('Error parsing personal websites:', error);
    }
  }
  
  let publications: LinkedInPublication[] = [];
  if (raw.linkedin_publications) {
    try {
      const parsed = typeof raw.linkedin_publications === 'string' 
        ? JSON.parse(raw.linkedin_publications) 
        : raw.linkedin_publications;
      
      if (Array.isArray(parsed)) {
        publications = parsed.map(pub => ({
          title: pub.title || '',
          publisher: pub.subtitle?.split(' · ')[0] || pub.publisher,
          date: pub.subtitle?.split(' · ')[1] || pub.date,
          description: pub.subComponents?.[0]?.description?.[0]?.text || pub.description,
        })).filter(pub => pub.title);
      }
    } catch (error) {
      console.error('Error parsing publications:', error);
    }
  }
  
  // Parse skills
  const skills = parseSkills(raw.linkedin_skills);
  
  // Parse last sync date
  let lastSync: Date | undefined;
  if (raw.linkedin_last_modified) {
    const date = new Date(raw.linkedin_last_modified);
    lastSync = isNaN(date.getTime()) ? undefined : date;
  }
  
  return {
    url: raw.linkedin_url || undefined,
    fullName: raw.linkedin_full_name || undefined,
    firstName: raw.linkedin_first_name || undefined,
    headline: raw.linkedin_headline || undefined,
    email: raw.linkedin_email || undefined,
    bio: raw.linkedin_bio || undefined,
    profilePicUrl: raw.linkedin_profile_pic || undefined,
    currentRole: raw.linkedin_current_role || undefined,
    currentCompany: raw.linkedin_current_company || undefined,
    country: raw.linkedin_country || undefined,
    skills,
    companyWebsite: raw.linkedin_company_website || undefined,
    experiences,
    personalWebsites,
    publications,
    lastSync,
  };
}

/**
 * Merge LinkedIn data with existing guest data
 * Prioritizes LinkedIn data when available
 */
export function mergeGuestWithLinkedIn(
  guest: { name: string; bio: string; company?: string; role?: string; email?: string },
  linkedInData?: LinkedInData
): GuestWithLinkedIn {
  if (!linkedInData) {
    return { ...guest };
  }
  
  return {
    ...guest,
    // Override with LinkedIn data if available
    name: linkedInData.fullName || guest.name,
    bio: linkedInData.bio || guest.bio,
    company: linkedInData.currentCompany || guest.company,
    role: linkedInData.currentRole || guest.role,
    email: linkedInData.email || guest.email,
    linkedInData,
  };
}

/**
 * Utility type for partial LinkedIn updates
 */
export type PartialLinkedInUpdate = Partial<LinkedInDataRaw>;

/**
 * Utility type for LinkedIn sync status
 */
export interface LinkedInSyncStatus {
  /** Whether LinkedIn data exists */
  hasData: boolean;
  /** Last sync date if available */
  lastSync?: Date;
  /** Whether data is stale (older than specified days) */
  isStale: (days: number) => boolean;
  /** Whether sync is needed */
  needsSync: boolean;
}

/**
 * Get LinkedIn sync status for a guest
 */
export function getLinkedInSyncStatus(linkedInData?: LinkedInData): LinkedInSyncStatus {
  const hasData = Boolean(linkedInData && linkedInData.url);
  const lastSync = linkedInData?.lastSync;
  
  return {
    hasData,
    lastSync,
    isStale: (days: number) => {
      if (!lastSync) return true;
      const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceSync > days;
    },
    needsSync: !hasData || !lastSync || 
      ((Date.now() - (lastSync?.getTime() || 0)) > 30 * 24 * 60 * 60 * 1000), // 30 days
  };
}