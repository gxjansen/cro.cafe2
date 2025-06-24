/**
 * @deprecated This API client is no longer used.
 * 
 * Data now flows: NocoDB → GitHub Action → Markdown files → Astro
 * LinkedIn data is read from static markdown frontmatter, not fetched via API.
 * 
 * See: /scripts/generate-guests.ts for how data is synced from NocoDB to markdown.
 * See: /src/utils/content.ts for how LinkedIn data is read from markdown files.
 * 
 * ============================================
 * ORIGINAL: NocoDB API Client for LinkedIn Data
 * 
 * This module provides a robust API client for fetching guest data with LinkedIn
 * information from NocoDB. It includes caching, retry logic, and comprehensive
 * error handling.
 */

import type { 
  LinkedInDataRaw, 
  GuestWithLinkedIn, 
  LinkedInData 
} from '../types/linkedin.js';
import { transformLinkedInData, mergeGuestWithLinkedIn } from '../types/linkedin.js';

/**
 * NocoDB configuration
 */
const NOCODB_CONFIG = {
  baseUrl: import.meta.env.NOCODB_API_URL || 'https://app.nocodb.com',
  tableId: 'm09pid7tgznxcqs',
  projectId: 'p5mcqm7lvi5ty8i',
  token: import.meta.env.NOCODB_API_TOKEN || '',
  defaultLimit: 1000,
  retryAttempts: 3,
  retryDelay: 1000, // milliseconds
  cacheMaxAge: 5 * 60 * 1000, // 5 minutes
};

/**
 * Custom error types for NocoDB operations
 */
export class NocoDBError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'NocoDBError';
  }
}

export class NocoDBNetworkError extends NocoDBError {
  constructor(message: string, details?: unknown) {
    super(message, undefined, details);
    this.name = 'NocoDBNetworkError';
  }
}

export class NocoDBValidationError extends NocoDBError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details);
    this.name = 'NocoDBValidationError';
  }
}

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Simple in-memory cache implementation
 */
class Cache {
  private store = new Map<string, CacheEntry<any>>();
  private maxAge: number;

  constructor(maxAge: number = NOCODB_CONFIG.cacheMaxAge) {
    this.maxAge = maxAge;
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.maxAge) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.store.clear();
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.clear();
      return;
    }

    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * NocoDB API response interface
 */
interface NocoDBResponse<T> {
  list: T[];
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
    isFirstPage: boolean;
    isLastPage: boolean;
  };
}

/**
 * Guest data interface from NocoDB
 */
interface NocoDBGuest extends LinkedInDataRaw {
  Id: number;
  name: string;
  bio: string;
  company?: string;
  role?: string;
  email?: string;
  website?: string;
  linkedin?: string;
  episodes?: any[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Request options for NocoDB API
 */
interface RequestOptions {
  filters?: string;
  sort?: string;
  fields?: string[];
  limit?: number;
  offset?: number;
}

/**
 * NocoDB API Client
 */
class NocoDBClient {
  private cache = new Cache();
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    if (!NOCODB_CONFIG.token) {
      console.warn('NocoDB API token not configured. Some features may not work.');
    }

    this.baseUrl = `${NOCODB_CONFIG.baseUrl}/api/v2/tables/${NOCODB_CONFIG.tableId}/records`;
    this.headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(NOCODB_CONFIG.token && { 'xc-token': NOCODB_CONFIG.token }),
    };
  }

  /**
   * Make a request with retry logic
   */
  private async requestWithRetry<T>(
    url: string,
    options: RequestInit = {},
    retries = NOCODB_CONFIG.retryAttempts
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: { ...this.headers, ...options.headers },
        });

        if (!response.ok) {
          throw new NocoDBError(
            `NocoDB API error: ${response.statusText}`,
            response.status,
            await response.text().catch(() => null)
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof NocoDBError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }

        // Network error
        if (error instanceof TypeError && error.message.includes('fetch')) {
          lastError = new NocoDBNetworkError('Network error connecting to NocoDB', error);
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, NOCODB_CONFIG.retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError || new NocoDBError('Request failed after all retries');
  }

  /**
   * Build query string from options
   */
  private buildQueryString(options: RequestOptions): string {
    const params = new URLSearchParams();

    if (options.filters) params.append('where', options.filters);
    if (options.sort) params.append('sort', options.sort);
    if (options.fields?.length) params.append('fields', options.fields.join(','));
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Transform NocoDB guest to GuestWithLinkedIn
   */
  private transformGuest(guest: NocoDBGuest): GuestWithLinkedIn {
    const linkedInData: LinkedInData = transformLinkedInData(guest);
    
    const baseGuest = {
      name: guest.name,
      bio: guest.bio,
      company: guest.company,
      role: guest.role,
      email: guest.email,
      website: guest.website,
      linkedin: guest.linkedin,
    };

    return mergeGuestWithLinkedIn(baseGuest, linkedInData);
  }

  /**
   * Fetch a single guest with LinkedIn data by slug
   */
  async fetchGuestWithLinkedIn(slug: string): Promise<GuestWithLinkedIn | null> {
    if (!slug) {
      throw new NocoDBValidationError('Slug is required');
    }

    const cacheKey = `guest:${slug}`;
    const cached = this.cache.get<GuestWithLinkedIn>(cacheKey);
    if (cached) return cached;

    try {
      // NocoDB uses name field as slug in this case
      const filters = `(name,eq,${encodeURIComponent(slug)})`;
      const url = `${this.baseUrl}${this.buildQueryString({ filters, limit: 1 })}`;
      
      const response = await this.requestWithRetry<NocoDBResponse<NocoDBGuest>>(url);
      
      if (!response.list || response.list.length === 0) {
        return null;
      }

      const guest = this.transformGuest(response.list[0]);
      this.cache.set(cacheKey, guest);
      
      return guest;
    } catch (error) {
      console.error(`Error fetching guest ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all guests with LinkedIn data
   */
  async fetchAllGuestsWithLinkedIn(options?: RequestOptions): Promise<GuestWithLinkedIn[]> {
    const cacheKey = `guests:all:${JSON.stringify(options || {})}`;
    const cached = this.cache.get<GuestWithLinkedIn[]>(cacheKey);
    if (cached) return cached;

    try {
      const allGuests: NocoDBGuest[] = [];
      let offset = 0;
      const limit = options?.limit || NOCODB_CONFIG.defaultLimit;
      let hasMore = true;

      // Fetch all pages
      while (hasMore) {
        const url = `${this.baseUrl}${this.buildQueryString({ 
          ...options, 
          limit, 
          offset 
        })}`;
        
        const response = await this.requestWithRetry<NocoDBResponse<NocoDBGuest>>(url);
        
        allGuests.push(...response.list);
        
        hasMore = !response.pageInfo.isLastPage;
        offset += limit;

        // Safety check to prevent infinite loops
        if (allGuests.length > 10000) {
          console.warn('Reached maximum guest limit of 10,000');
          break;
        }
      }

      const transformedGuests = allGuests.map(guest => this.transformGuest(guest));
      this.cache.set(cacheKey, transformedGuests);
      
      return transformedGuests;
    } catch (error) {
      console.error('Error fetching all guests:', error);
      throw error;
    }
  }

  /**
   * Fetch guests by company
   */
  async fetchGuestsByCompany(company: string): Promise<GuestWithLinkedIn[]> {
    if (!company) {
      throw new NocoDBValidationError('Company name is required');
    }

    const cacheKey = `guests:company:${company}`;
    const cached = this.cache.get<GuestWithLinkedIn[]>(cacheKey);
    if (cached) return cached;

    try {
      // Filter by either regular company field or LinkedIn company field
      const filters = `((company,eq,${encodeURIComponent(company)})~or(linkedin_current_company,eq,${encodeURIComponent(company)}))`;
      const url = `${this.baseUrl}${this.buildQueryString({ filters })}`;
      
      const response = await this.requestWithRetry<NocoDBResponse<NocoDBGuest>>(url);
      
      const guests = response.list.map(guest => this.transformGuest(guest));
      this.cache.set(cacheKey, guests);
      
      return guests;
    } catch (error) {
      console.error(`Error fetching guests from company ${company}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache
   */
  invalidateCache(pattern?: string): void {
    this.cache.invalidate(pattern);
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const nocodbClient = new NocoDBClient();

// Export convenience methods
export const fetchGuestWithLinkedIn = nocodbClient.fetchGuestWithLinkedIn.bind(nocodbClient);
export const fetchAllGuestsWithLinkedIn = nocodbClient.fetchAllGuestsWithLinkedIn.bind(nocodbClient);
export const fetchGuestsByCompany = nocodbClient.fetchGuestsByCompany.bind(nocodbClient);
export const invalidateNocoDBCache = nocodbClient.invalidateCache.bind(nocodbClient);
export const clearNocoDBCache = nocodbClient.clearCache.bind(nocodbClient);