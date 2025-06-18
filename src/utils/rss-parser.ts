import { parseStringPromise } from 'xml2js';
import type { Language } from '../types';

/**
 * RSS Feed URLs for CRO.CAFE podcasts
 */
export const RSS_FEEDS = {
  en: 'https://feeds.transistor.fm/cro-cafe-english',
  nl: 'https://feeds.transistor.fm/cro-cafe-dutch',
  de: 'https://feeds.transistor.fm/cro-cafe-german',
  es: 'https://feeds.transistor.fm/cro-cafe-spanish',
} as const;

/**
 * Raw RSS item structure from Transistor.FM
 */
export interface RSSItem {
  title: string[];
  description: string[];
  pubDate: string[];
  guid: Array<{ _: string; $: { isPermaLink: string } }>;
  link: string[];
  'itunes:duration': string[];
  'itunes:explicit': string[];
  'itunes:keywords': string[];
  'itunes:author': string[];
  'itunes:summary': string[];
  'itunes:season': string[];
  'itunes:episode': string[];
  'itunes:episodeType': string[];
  enclosure: Array<{ $: { url: string; type: string; length: string } }>;
  'itunes:image': Array<{ $: { href: string } }>;
  'content:encoded': string[];
}

/**
 * Raw RSS channel structure from Transistor.FM
 */
export interface RSSChannel {
  title: string[];
  description: string[];
  link: string[];
  language: string[];
  'itunes:author': string[];
  'itunes:owner': Array<{
    'itunes:name': string[];
    'itunes:email': string[];
  }>;
  'itunes:image': Array<{ $: { href: string } }>;
  'itunes:category': Array<{ $: { text: string } }>;
  'itunes:explicit': string[];
  item: RSSItem[];
}

/**
 * Parsed RSS feed structure
 */
export interface RSSFeed {
  rss: {
    $: { version: string };
    channel: RSSChannel[];
  };
}

/**
 * Parsed episode data
 */
export interface ParsedEpisode {
  // Core metadata
  title: string;
  description: string;
  pubDate: Date;
  season: number;
  episode: number;
  duration: string;
  audioUrl: string;
  
  // Enhanced metadata
  slug: string;
  language: Language;
  imageUrl?: string;
  
  // Episode details
  hosts: string[];
  guests: string[];
  keywords: string[];
  
  // Transistor specific
  transistorId: string;
  shareUrl?: string;
  embedHtml?: string;
  
  // Content flags
  featured: boolean;
  episodeType: 'full' | 'trailer' | 'bonus';
  
  // SEO optimization
  summary?: string;
  transcript?: string;
}

/**
 * Retry configuration for RSS feed fetching
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate retry delay with exponential backoff
 */
const calculateRetryDelay = (attempt: number, config: RetryConfig): number => {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
  return Math.min(delay, config.maxDelay);
};

/**
 * Fetch RSS feed with retry logic and error handling
 */
export async function fetchRSSFeed(
  url: string, 
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`Fetching RSS feed: ${url} (attempt ${attempt + 1}/${config.maxRetries + 1})`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CRO.CAFE RSS Parser/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('xml')) {
        console.warn(`Unexpected content type: ${contentType}`);
      }
      
      const xmlContent = await response.text();
      
      if (!xmlContent.trim()) {
        throw new Error('Empty RSS feed response');
      }
      
      console.log(`Successfully fetched RSS feed: ${url}`);
      return xmlContent;
      
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} failed for ${url}:`, error);
      
      // Don't retry on final attempt
      if (attempt < config.maxRetries) {
        const delay = calculateRetryDelay(attempt, config);
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  throw new Error(`Failed to fetch RSS feed after ${config.maxRetries + 1} attempts: ${lastError?.message}`);
}

/**
 * Parse XML content into RSS feed structure
 */
export async function parseRSSContent(xmlContent: string): Promise<RSSFeed> {
  try {
    const parsed = await parseStringPromise(xmlContent, {
      explicitArray: true,
      mergeAttrs: false,
      ignoreAttrs: false,
      trim: true,
      normalizeTags: false,
      normalize: true,
    });
    
    if (!parsed.rss || !parsed.rss.channel) {
      throw new Error('Invalid RSS structure: missing rss or channel elements');
    }
    
    return parsed as RSSFeed;
    
  } catch (error) {
    console.error('Failed to parse RSS XML:', error);
    throw new Error(`RSS parsing failed: ${(error as Error).message}`);
  }
}

/**
 * Extract guest information from episode description
 */
function extractGuests(description: string, title: string): string[] {
  const guests: string[] = [];
  
  // Common guest patterns in podcast descriptions
  const guestPatterns = [
    /guest:?\s*([^,\n]+)/gi,
    /with\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
    /featuring\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
    /interview\s+with\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
  ];
  
  for (const pattern of guestPatterns) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const guest = match[1].trim();
        if (guest.length > 2 && guest.length < 50) {
          guests.push(guest);
        }
      }
    }
  }
  
  // Remove duplicates and common false positives
  const uniqueGuests = [...new Set(guests)];
  return uniqueGuests.filter(guest => 
    !guest.toLowerCase().includes('cro') &&
    !guest.toLowerCase().includes('cafe') &&
    !guest.toLowerCase().includes('conversion')
  );
}

/**
 * Extract host information from episode metadata
 */
function extractHosts(authorField?: string): string[] {
  if (!authorField) return ['Guido Jansen']; // Default host
  
  const hosts = authorField
    .split(',')
    .map(host => host.trim())
    .filter(host => host.length > 0);
    
  return hosts.length > 0 ? hosts : ['Guido Jansen'];
}

/**
 * Generate episode slug from title
 */
function generateSlug(title: string, season: number, episode: number): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
    
  return `s${season}e${episode}-${baseSlug}`;
}

/**
 * Extract Transistor ID from GUID
 */
function extractTransistorId(guid?: string): string {
  if (!guid) return '';
  
  // Extract ID from Transistor GUID format
  const match = guid.match(/transistor\.fm\/([a-f0-9]+)/);
  return match ? match[1] : '';
}

/**
 * Parse individual RSS item into episode data
 */
export function parseEpisodeItem(item: RSSItem, language: Language): ParsedEpisode {
  const title = item.title?.[0] || 'Untitled Episode';
  const description = item.description?.[0] || '';
  const pubDate = new Date(item.pubDate?.[0] || Date.now());
  const season = parseInt(item['itunes:season']?.[0] || '1', 10);
  const episode = parseInt(item['itunes:episode']?.[0] || '1', 10);
  const duration = item['itunes:duration']?.[0] || '00:00:00';
  const audioUrl = item.enclosure?.[0]?.$?.url || '';
  const imageUrl = item['itunes:image']?.[0]?.$?.href;
  const keywords = item['itunes:keywords']?.[0]?.split(',').map(k => k.trim()) || [];
  const author = item['itunes:author']?.[0];
  const summary = item['itunes:summary']?.[0];
  const guid = item.guid?.[0]?._ || '';
  const episodeType = (item['itunes:episodeType']?.[0] as 'full' | 'trailer' | 'bonus') || 'full';
  
  const slug = generateSlug(title, season, episode);
  const transistorId = extractTransistorId(guid);
  const hosts = extractHosts(author);
  const guests = extractGuests(description, title);
  
  return {
    title,
    description,
    pubDate,
    season,
    episode,
    duration,
    audioUrl,
    slug,
    language,
    imageUrl,
    hosts,
    guests,
    keywords,
    transistorId,
    shareUrl: guid,
    featured: false,
    episodeType,
    summary,
  };
}

/**
 * Parse RSS feed and extract all episode data
 */
export async function parseRSSFeed(
  url: string, 
  language: Language,
  config?: RetryConfig
): Promise<ParsedEpisode[]> {
  try {
    console.log(`Parsing RSS feed for ${language}: ${url}`);
    
    // Fetch RSS content with retry logic
    const xmlContent = await fetchRSSFeed(url, config);
    
    // Parse XML structure
    const rssFeed = await parseRSSContent(xmlContent);
    
    // Extract channel data
    const channel = rssFeed.rss.channel[0];
    if (!channel || !channel.item) {
      throw new Error('No episodes found in RSS feed');
    }
    
    // Parse each episode
    const episodes = channel.item.map(item => parseEpisodeItem(item, language));
    
    console.log(`Successfully parsed ${episodes.length} episodes for ${language}`);
    return episodes;
    
  } catch (error) {
    console.error(`Failed to parse RSS feed for ${language}:`, error);
    throw error;
  }
}

/**
 * Parse all RSS feeds for all languages
 */
export async function parseAllRSSFeeds(
  config?: RetryConfig
): Promise<Record<Language, ParsedEpisode[]>> {
  const results: Record<Language, ParsedEpisode[]> = {} as Record<Language, ParsedEpisode[]>;
  const errors: Array<{ language: Language; error: Error }> = [];
  
  // Parse feeds concurrently
  const parsePromises = (Object.entries(RSS_FEEDS) as Array<[Language, string]>).map(
    async ([language, url]) => {
      try {
        const episodes = await parseRSSFeed(url, language, config);
        results[language] = episodes;
      } catch (error) {
        errors.push({ language, error: error as Error });
      }
    }
  );
  
  await Promise.all(parsePromises);
  
  // Report any errors
  if (errors.length > 0) {
    console.error('RSS parsing errors:', errors);
    // Don't throw if we have at least one successful parse
    if (Object.keys(results).length === 0) {
      throw new Error('Failed to parse any RSS feeds');
    }
  }
  
  return results;
}

/**
 * Validate episode data structure
 */
export function validateEpisodeData(episode: ParsedEpisode): boolean {
  const required = ['title', 'description', 'pubDate', 'audioUrl', 'slug', 'language'];
  
  for (const field of required) {
    if (!episode[field as keyof ParsedEpisode]) {
      console.warn(`Missing required field: ${field} in episode ${episode.title}`);
      return false;
    }
  }
  
  // Validate URL format
  try {
    new URL(episode.audioUrl);
  } catch {
    console.warn(`Invalid audio URL in episode ${episode.title}: ${episode.audioUrl}`);
    return false;
  }
  
  return true;
}

/**
 * Filter and sort episodes
 */
export function processEpisodes(episodes: ParsedEpisode[]): ParsedEpisode[] {
  return episodes
    .filter(validateEpisodeData)
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
}