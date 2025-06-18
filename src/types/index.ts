// Re-export Content Collection types
export type { Episode, Guest, Quote, Brand, Platform } from '../content/config';

// Language and utility types
export type Language = 'en' | 'nl' | 'de' | 'es';

export interface EpisodeWithContent {
  data: Episode;
  slug: string;
  body: string;
  render: () => Promise<{
    Content: any;
    headings: Array<{ depth: number; text: string; slug: string }>;
  }>;
}

export interface GuestWithContent {
  data: Guest;
  slug: string;
  body: string;
  render: () => Promise<{
    Content: any;
    headings: Array<{ depth: number; text: string; slug: string }>;
  }>;
}

// Language-specific content types
export interface LanguageContent {
  episodes: EpisodeWithContent[];
  guests: GuestWithContent[];
  quotes: Quote[];
  language: Language;
}

// Navigation and UI types
export interface NavigationItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

// SEO and metadata types
export interface PageMetadata {
  title: string;
  description: string;
  canonical?: string;
  hreflang?: Record<Language, string>;
  ogImage?: string;
  structuredData?: Record<string, any>;
}

// User persona types based on UX research
export interface UserPersona {
  id: string;
  name: string;
  language: Language;
  demographics: {
    ageRange: string;
    location: string;
    income: string;
    company: string;
  };
  behavior: {
    devicePreference: 'mobile' | 'desktop' | 'mixed';
    consumptionPattern: string;
    episodeDuration: string;
    platformPreferences: string[];
  };
  goals: string[];
  painPoints: string[];
}