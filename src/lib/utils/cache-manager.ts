import crypto from 'crypto'
import type { CachePolicy, CacheEntry } from '../types/database'

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  hitRate: number
}

interface MultiLevelConfig {
  l2?: CachePolicy
  l3?: CachePolicy
}

type CacheLevel = 'l1' | 'l2' | 'l3'

export class CacheManager {
  private stores: Map<CacheLevel, Map<string, CacheEntry<any>>> = new Map()
  private policies: Map<CacheLevel, CachePolicy> = new Map()
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  }
  private cleanupTimer?: NodeJS.Timeout

  constructor(l1Policy: CachePolicy, multiLevel?: MultiLevelConfig) {
    // Initialize L1 cache
    this.policies.set('l1', l1Policy)
    this.stores.set('l1', new Map())

    // Initialize L2 and L3 if configured
    if (multiLevel?.l2) {
      this.policies.set('l2', multiLevel.l2)
      this.stores.set('l2', new Map())
    }

    if (multiLevel?.l3) {
      this.policies.set('l3', multiLevel.l3)
      this.stores.set('l3', new Map())
    }

    // Start cleanup timer
    this.startCleanupTimer()
  }

  async get<T>(key: string, options?: { level?: CacheLevel }): Promise<T | null> {
    const level = options?.level || 'l1'
    const store = this.stores.get(level)
    const policy = this.policies.get(level)

    if (!store || !policy) {return null}

    const entry = store.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check expiration
    if (entry.expiresAt < new Date()) {
      store.delete(key)
      this.stats.misses++
      return null
    }

    // Update stats and access time
    this.stats.hits++
    entry.hitCount++
    entry.lastAccessed = new Date()

    // Update position for LRU (refresh TTL on access)
    if (policy.evictionPolicy === 'lru') {
      // Refresh expiration time on access
      entry.expiresAt = new Date(Date.now() + policy.ttl)
      store.delete(key)
      store.set(key, entry)
    }

    return entry.value
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const level: CacheLevel = 'l1' // Default to L1
    const store = this.stores.get(level)!
    const policy = this.policies.get(level)!

    // Check size limit
    if (store.size >= policy.maxSize) {
      this.evict(level)
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      expiresAt: new Date(Date.now() + (ttl || policy.ttl)),
      hitCount: 0,
      lastAccessed: new Date()
    }

    store.set(key, entry)
  }

  async delete(key: string): Promise<boolean> {
    let deleted = false

    for (const [_, store] of this.stores) {
      if (store.delete(key)) {
        deleted = true
      }
    }

    return deleted
  }

  clear(): void {
    for (const [_, store] of this.stores) {
      store.clear()
    }

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    }

    // Clear cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  size(): number {
    return this.stores.get('l1')?.size || 0
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0
    }
  }

  generateKey(obj: any): string {
    const normalized = this.normalizeObject(obj)
    const json = JSON.stringify(normalized)
    return crypto.createHash('md5').update(json).digest('hex')
  }

  async promote(key: string, toLevel: CacheLevel): Promise<void> {
    // Find entry in lower levels
    let entry: CacheEntry<any> | undefined
    let fromLevel: CacheLevel | undefined

    for (const [level, store] of this.stores) {
      if (store.has(key)) {
        entry = store.get(key)
        fromLevel = level
        break
      }
    }

    if (!entry || !fromLevel) {return}

    // Remove from current level
    this.stores.get(fromLevel)!.delete(key)

    // Add to new level
    const targetStore = this.stores.get(toLevel)
    const targetPolicy = this.policies.get(toLevel)

    if (targetStore && targetPolicy) {
      // Check size limit
      if (targetStore.size >= targetPolicy.maxSize) {
        this.evict(toLevel)
      }

      // Update TTL for new level
      entry.expiresAt = new Date(Date.now() + targetPolicy.ttl)
      targetStore.set(key, entry)
    }
  }

  private evict(level: CacheLevel): void {
    const store = this.stores.get(level)!
    const policy = this.policies.get(level)!

    let keyToEvict: string | undefined

    switch (policy.evictionPolicy) {
      case 'lru':
        // First key is least recently used (Map maintains insertion order)
        keyToEvict = store.keys().next().value
        break

      case 'lfu':
        // Find least frequently used
        let minHits = Infinity
        for (const [key, entry] of store) {
          if (entry.hitCount < minHits) {
            minHits = entry.hitCount
            keyToEvict = key
          }
        }
        break

      case 'fifo':
        // First key is oldest
        keyToEvict = store.keys().next().value
        break
    }

    if (keyToEvict) {
      store.delete(keyToEvict)
      this.stats.evictions++
    }
  }

  private normalizeObject(obj: any): any {
    if (obj === null || obj === undefined) {return obj}
    if (typeof obj !== 'object') {return obj}
    if (obj instanceof Date) {return obj.toISOString()}
    if (obj instanceof RegExp) {return obj.toString()}
    if (Array.isArray(obj)) {
      return obj.map(item => this.normalizeObject(item))
    }

    // Sort object keys for consistent hashing
    const sorted: any = {}
    Object.keys(obj).sort().forEach(key => {
      if (typeof obj[key] !== 'function' && obj[key] !== undefined) {
        sorted[key] = this.normalizeObject(obj[key])
      }
    })

    return sorted
  }

  private startCleanupTimer(): void {
    // Clean up expired entries every minute
    this.cleanupTimer = setInterval(() => {
      for (const [_, store] of this.stores) {
        for (const [key, entry] of store) {
          if (entry.expiresAt < new Date()) {
            store.delete(key)
          }
        }
      }
    }, 60000)
  }
}