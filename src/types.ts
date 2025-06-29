// Language types for the multi-language CRO.CAFE website
export type Language = 'en' | 'nl' | 'de' | 'es';

// Episode related types
export interface Episode {
  title: string;
  description: string;
  pubDate: Date;
  season: number;
  episode: number;
  duration: string;
  audioUrl: string;
  slug: string;
  language: Language;
  imageUrl?: string;
  hosts: string[];
  guests: string[];
  keywords: string[];
  transistorId: string;
  shareUrl: string;
  featured: boolean;
  episodeType: 'full' | 'trailer' | 'bonus';
  summary?: string;
}

// Guest related types
export interface Guest {
  name: string;
  bio: string;
  company?: string;
  website?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  image?: string;
  episodes: string[];
  languages: Language[];
  slug: string;
}

// Quote types
export interface Quote {
  text: string;
  author: string;
  company?: string;
  episode?: string;
  language: Language;
  featured: boolean;
  order?: number;
}

// Brand types
export interface Brand {
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  featured: boolean;
  order?: number;
  description?: string;
}

// Platform types
export interface Platform {
  name: string;
  iconUrl: string;
  category: 'podcast' | 'music' | 'general';
  order?: number;
  urls: {
    en?: string;
    nl?: string;
    de?: string;
    es?: string;
  };
}

// RSS Feed types
export interface RSSEpisode {
  title: string;
  description: string;
  pubDate: string;
  link: string;
  guid: string;
  enclosure: {
    url: string;
    type: string;
    length: string;
  };
  duration?: string;
  episodeNumber?: string;
  seasonNumber?: string;
  episodeType?: string;
  explicit?: boolean;
  keywords?: string;
  author?: string;
  image?: string;
}

// Navigation types
export interface NavigationItem {
  label: string;
  href: string;
  external?: boolean;
}

// SEO types
export interface SEOData {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  hreflang?: Record<Language, string>;
  keywords?: string[];
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Language labels for UI
export const LANGUAGE_LABELS: Record<Language, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' }
}