// Database Types for NocoDB Integration
// Following the architecture specification from phase_2_architecture.md

export type Language = 'en' | 'nl' | 'de' | 'es'
export type EpisodeStatus = 'draft' | 'published' | 'scheduled'
export type ConflictStrategy = 'local' | 'remote' | 'merge' | 'manual'
export type EventType = 'episode.created' | 'episode.updated' | 'episode.deleted' | 
  'guest.created' | 'guest.updated' | 'guest.deleted' |
  'host.created' | 'host.updated' | 'host.deleted' |
  'platform.created' | 'platform.updated' | 'platform.deleted'

// Translated field support for multi-language content
export interface TranslatedField<T> {
  en?: T
  nl?: T
  de?: T
  es?: T
}

// Core domain entities
export interface Episode {
  id: number
  transistorId: string
  title: TranslatedField<string>
  description: TranslatedField<string>
  summary: TranslatedField<string>
  duration: number
  episodeNumber: number
  season: number
  slug: string
  status: EpisodeStatus
  language: Language
  mediaUrl: string
  imageUrl?: string
  publishedAt: Date
  
  // AI Enhancement Fields
  aiKeywords?: string[]
  aiTopics?: string[]
  aiSummary?: TranslatedField<string>
  aiTranscript?: TranslatedField<string>
  
  // Relationships
  hosts: Host[]
  guests: Guest[]
  platforms: Platform[]
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

export interface Guest {
  id: number
  slug: string
  name: string
  bio?: TranslatedField<string>
  aiBio?: TranslatedField<string>
  company?: string
  role?: string
  imageUrl?: string
  socialLinks: SocialLink[]
  
  // Aggregated Data
  episodeCount: number
  episodes: Episode[]
  languages: Language[]
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

export interface Host {
  id: number
  slug: string
  name: string
  bio: TranslatedField<string>
  imageUrl?: string
  socialLinks: SocialLink[]
  
  // Relationships
  episodes: Episode[]
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

export interface Platform {
  id: number
  name: string
  slug: string
  displayOrder: number
  isActive: boolean
  iconUrl?: string
  
  // Language-specific URLs
  urls: TranslatedField<string>
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

export interface SocialLink {
  platform: string
  url: string
  displayName?: string
}

// Query and filtering types
export interface QueryParams {
  limit?: number
  offset?: number
  sort?: SortOption[]
  filters?: Record<string, any>
  include?: string[]
  ttl?: number // Cache TTL in milliseconds
}

export interface SortOption {
  field: string
  order: 'asc' | 'desc'
}

// Health and monitoring types
export interface HealthStatus {
  connected: boolean
  latency: number
  lastCheck: Date
  errors?: string[]
}

// Change tracking types
export interface Change {
  id: string
  table: 'Episodes' | 'Guests' | 'Hosts' | 'Platforms'
  recordId: number
  operation: 'create' | 'update' | 'delete'
  changes?: Record<string, any>
  timestamp: Date
}

export interface ChangeCallback {
  (change: Change): void | Promise<void>
}

export interface Subscription {
  id: string
  unsubscribe: () => void
}

// Service configuration types
export interface MCPConfiguration {
  nocodb: {
    server: string
    apiKey: string
    timeout: number
    retryPolicy: RetryPolicy
  }
  connection: {
    poolSize: number
    keepAlive: boolean
    reconnectInterval: number
  }
}

export interface RetryPolicy {
  maxAttempts: number
  backoffStrategy: 'linear' | 'exponential'
  initialDelay: number
  maxDelay: number
}

// Content generation types
export interface GeneratedContent {
  type: 'episode' | 'guest' | 'host' | 'platform'
  id: number
  language: Language
  filePath: string
  content: string
  metadata: Record<string, any>
  generatedAt: Date
}

export interface GenerationOptions {
  languages?: Language[]
  force?: boolean
  includeRelated?: boolean
}

export interface GenerationReport {
  total: number
  successful: number
  failed: number
  errors: Array<{
    id: number
    type: string
    error: string
  }>
  duration: number
}

// Sync and conflict types
export interface SyncResult {
  synced: number
  conflicts: number
  errors: number
  details: Array<{
    id: number
    status: 'synced' | 'conflict' | 'error'
    message?: string
  }>
}

export interface Conflict {
  id: string
  type: string
  localVersion: any
  remoteVersion: any
  detectedAt: Date
}

export interface Resolution {
  conflictId: string
  strategy: ConflictStrategy
  resolvedVersion: any
  resolvedAt: Date
}

// Cache types
export interface CachePolicy {
  ttl: number
  maxSize: number
  evictionPolicy: 'lru' | 'lfu' | 'fifo'
}

export interface CacheEntry<T> {
  key: string
  value: T
  expiresAt: Date
  hitCount: number
  lastAccessed: Date
}

// Error types
export class NocoDBError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'NocoDBError'
  }
}

export class ValidationError extends NocoDBError {
  constructor(message: string, public errors: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400, errors)
    this.name = 'ValidationError'
  }
}

export class ConnectionError extends NocoDBError {
  constructor(message: string, public cause?: Error) {
    super(message, 'CONNECTION_ERROR', 503)
    this.name = 'ConnectionError'
  }
}

export class RateLimitError extends NocoDBError {
  constructor(public limit: number, public resetAt: Date) {
    super(`Rate limit exceeded. Limit: ${limit}`, 'RATE_LIMIT_ERROR', 429)
    this.name = 'RateLimitError'
  }
}