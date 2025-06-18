import { MCPAdapter } from '../utils/mcp-adapter'
import { CacheManager } from '../utils/cache-manager'
import type {
  MCPConfiguration,
  Episode,
  Guest,
  Host,
  Platform,
  QueryParams,
  HealthStatus,
  Change,
  ChangeCallback,
  Subscription,
  NocoDBError,
  ValidationError
} from '../types/database'

export class NocoDBService {
  private adapter: MCPAdapter
  private cache: CacheManager
  private config: MCPConfiguration
  private subscriptions: Map<string, ChangeCallback> = new Map()
  private reconnectTimer?: NodeJS.Timeout
  private isConnecting = false

  constructor(config: MCPConfiguration) {
    this.config = config
    this.adapter = new MCPAdapter()
    this.cache = new CacheManager({
      ttl: 300000, // 5 minutes default
      maxSize: 1000,
      evictionPolicy: 'lru'
    })
    
    // Start auto-reconnect if configured
    if (config.connection.keepAlive) {
      this.startAutoReconnect()
    }
  }

  async connect(): Promise<void> {
    if (this.isConnecting) {
      throw new Error('Connection already in progress')
    }
    
    this.isConnecting = true
    try {
      await this.adapter.connect(this.config)
      this.isConnecting = false
    } catch (error) {
      this.isConnecting = false
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
    await this.adapter.disconnect()
  }

  async healthCheck(): Promise<HealthStatus> {
    return this.adapter.healthCheck()
  }

  // Episode operations
  async getEpisodes(params: QueryParams = {}): Promise<Episode[]> {
    const cacheKey = this.cache.generateKey({ type: 'episodes', params })
    
    // Check cache first
    const cached = await this.cache.get<Episode[]>(cacheKey)
    if (cached) return cached
    
    // Query through adapter
    const result = await this.adapter.query<Episode>({
      table: 'Episodes',
      ...params
    })
    
    // Validate and filter results
    const validated = result.filter(episode => this.validateEpisode(episode))
    
    // Cache results
    await this.cache.set(cacheKey, validated, params.ttl)
    
    return validated
  }

  // Guest operations
  async getGuests(params: QueryParams = {}): Promise<Guest[]> {
    const cacheKey = this.cache.generateKey({ type: 'guests', params })
    
    const cached = await this.cache.get<Guest[]>(cacheKey)
    if (cached) return cached
    
    const result = await this.adapter.query<Guest>({
      table: 'Guests',
      ...params
    })
    
    const validated = result.filter(guest => this.validateGuest(guest))
    await this.cache.set(cacheKey, validated, params.ttl)
    
    return validated
  }

  // Host operations
  async getHosts(params: QueryParams = {}): Promise<Host[]> {
    const cacheKey = this.cache.generateKey({ type: 'hosts', params })
    
    const cached = await this.cache.get<Host[]>(cacheKey)
    if (cached) return cached
    
    const result = await this.adapter.query<Host>({
      table: 'Hosts',
      ...params
    })
    
    const validated = result.filter(host => this.validateHost(host))
    await this.cache.set(cacheKey, validated, params.ttl)
    
    return validated
  }

  // Platform operations
  async getPlatforms(params: QueryParams = {}): Promise<Platform[]> {
    const cacheKey = this.cache.generateKey({ type: 'platforms', params })
    
    const cached = await this.cache.get<Platform[]>(cacheKey)
    if (cached) return cached
    
    const result = await this.adapter.query<Platform>({
      table: 'Platforms',
      ...params
    })
    
    const validated = result.filter(platform => this.validatePlatform(platform))
    await this.cache.set(cacheKey, validated, params.ttl)
    
    return validated
  }

  // Change tracking
  subscribeToChanges(callback: ChangeCallback): Subscription {
    const id = Math.random().toString(36).substr(2, 9)
    this.subscriptions.set(id, callback)
    
    return {
      id,
      unsubscribe: () => {
        this.subscriptions.delete(id)
      }
    }
  }

  async getChangesSince(timestamp: Date): Promise<Change[]> {
    const result = await this.adapter.query<Change>({
      table: '_changes',
      filters: {
        timestamp: { $gt: timestamp.toISOString() }
      },
      sort: [{ field: 'timestamp', order: 'asc' }]
    })
    
    return result
  }

  // Private methods
  private startAutoReconnect(): void {
    this.reconnectTimer = setInterval(async () => {
      if (!this.adapter.isConnected() && !this.isConnecting) {
        try {
          await this.connect()
        } catch (error) {
          // Silent fail, will retry on next interval
        }
      }
    }, this.config.connection.reconnectInterval)
  }

  private validateEpisode(episode: any): episode is Episode {
    return (
      episode &&
      typeof episode.id === 'number' &&
      typeof episode.transistorId === 'string' &&
      episode.title &&
      Array.isArray(episode.hosts) &&
      Array.isArray(episode.guests) &&
      Array.isArray(episode.platforms)
    )
  }

  private validateGuest(guest: any): guest is Guest {
    return (
      guest &&
      typeof guest.id === 'number' &&
      typeof guest.slug === 'string' &&
      typeof guest.name === 'string' &&
      Array.isArray(guest.socialLinks) &&
      Array.isArray(guest.episodes) &&
      Array.isArray(guest.languages)
    )
  }

  private validateHost(host: any): host is Host {
    return (
      host &&
      typeof host.id === 'number' &&
      typeof host.name === 'string' &&
      Array.isArray(host.socialLinks)
    )
  }

  private validatePlatform(platform: any): platform is Platform {
    return (
      platform &&
      typeof platform.id === 'number' &&
      typeof platform.name === 'string' &&
      typeof platform.displayOrder === 'number' &&
      typeof platform.isActive === 'boolean'
    )
  }
}