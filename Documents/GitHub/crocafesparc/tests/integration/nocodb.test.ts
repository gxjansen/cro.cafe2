import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NocoDBService } from '@lib/services/nocodb-service'
import type { Episode, Guest, Host, Platform, QueryParams, HealthStatus } from '@lib/types/database'

describe('NocoDB MCP Integration', () => {
  let service: NocoDBService
  
  beforeEach(() => {
    service = new NocoDBService({
      nocodb: {
        server: process.env.NOCODB_BASE_URL || 'http://localhost:8080',
        apiKey: process.env.NOCODB_API_KEY || 'test-key',
        timeout: 5000,
        retryPolicy: {
          maxAttempts: 3,
          backoffStrategy: 'exponential',
          initialDelay: 100,
          maxDelay: 5000
        }
      },
      connection: {
        poolSize: 10,
        keepAlive: true,
        reconnectInterval: 5000
      }
    })
  })

  afterEach(async () => {
    await service.disconnect()
  })

  describe('Connection Management', () => {
    it('should establish connection to NocoDB', async () => {
      await expect(service.connect()).resolves.not.toThrow()
      const status = await service.healthCheck()
      expect(status.connected).toBe(true)
      expect(status.latency).toBeLessThan(200) // < 200ms requirement
    })

    it('should handle connection failures gracefully', async () => {
      const failingService = new NocoDBService({
        nocodb: {
          server: 'http://invalid-host:9999',
          apiKey: 'invalid-key',
          timeout: 1000,
          retryPolicy: {
            maxAttempts: 1,
            backoffStrategy: 'linear',
            initialDelay: 100,
            maxDelay: 1000
          }
        },
        connection: {
          poolSize: 1,
          keepAlive: false,
          reconnectInterval: 1000
        }
      })
      
      await expect(failingService.connect()).rejects.toThrow()
    })

    it('should support automatic reconnection', async () => {
      await service.connect()
      
      // Simulate connection loss
      await service.disconnect()
      
      // Service should auto-reconnect
      const reconnectSpy = vi.spyOn(service, 'connect')
      await new Promise(resolve => setTimeout(resolve, 6000))
      
      expect(reconnectSpy).toHaveBeenCalled()
    }, 10000)
  })

  describe('Data Fetching with TypeScript Types', () => {
    beforeEach(async () => {
      await service.connect()
    })

    describe('Episodes', () => {
      it('should fetch episodes with proper typing', async () => {
        const params: QueryParams = {
          limit: 10,
          offset: 0,
          sort: [{ field: 'publishedAt', order: 'desc' }],
          filters: { status: 'published' }
        }

        const episodes = await service.getEpisodes(params)
        
        expect(Array.isArray(episodes)).toBe(true)
        if (episodes.length > 0) {
          const episode = episodes[0]
          expect(episode).toHaveProperty('id')
          expect(episode).toHaveProperty('transistorId')
          expect(episode).toHaveProperty('title')
          expect(episode).toHaveProperty('description')
          expect(episode).toHaveProperty('duration')
          expect(episode).toHaveProperty('episodeNumber')
          expect(episode).toHaveProperty('publishedAt')
          
          // Check relationships
          expect(Array.isArray(episode.hosts)).toBe(true)
          expect(Array.isArray(episode.guests)).toBe(true)
          expect(Array.isArray(episode.platforms)).toBe(true)
        }
      })

      it('should handle pagination correctly', async () => {
        const page1 = await service.getEpisodes({ limit: 5, offset: 0 })
        const page2 = await service.getEpisodes({ limit: 5, offset: 5 })
        
        // Ensure no duplicate IDs between pages
        const ids1 = page1.map(e => e.id)
        const ids2 = page2.map(e => e.id)
        const intersection = ids1.filter(id => ids2.includes(id))
        
        expect(intersection.length).toBe(0)
      })

      it('should filter episodes by language', async () => {
        const nlEpisodes = await service.getEpisodes({
          filters: { language: 'nl' }
        })
        
        nlEpisodes.forEach(episode => {
          expect(episode.language).toBe('nl')
        })
      })
    })

    describe('Guests', () => {
      it('should fetch guests with complete profiles', async () => {
        const guests = await service.getGuests({ limit: 10 })
        
        expect(Array.isArray(guests)).toBe(true)
        if (guests.length > 0) {
          const guest = guests[0]
          expect(guest).toHaveProperty('id')
          expect(guest).toHaveProperty('slug')
          expect(guest).toHaveProperty('name')
          expect(guest).toHaveProperty('episodeCount')
          expect(Array.isArray(guest.socialLinks)).toBe(true)
          expect(Array.isArray(guest.episodes)).toBe(true)
          expect(Array.isArray(guest.languages)).toBe(true)
        }
      })

      it('should fetch guest with episodes relationship', async () => {
        const params: QueryParams = {
          limit: 1,
          include: ['episodes']
        }
        
        const guests = await service.getGuests(params)
        if (guests.length > 0) {
          const guest = guests[0]
          expect(guest.episodes.length).toBe(guest.episodeCount)
        }
      })
    })

    describe('Hosts', () => {
      it('should fetch hosts with proper data structure', async () => {
        const hosts = await service.getHosts({ limit: 10 })
        
        expect(Array.isArray(hosts)).toBe(true)
        if (hosts.length > 0) {
          const host = hosts[0]
          expect(host).toHaveProperty('id')
          expect(host).toHaveProperty('name')
          expect(host).toHaveProperty('bio')
          expect(Array.isArray(host.socialLinks)).toBe(true)
        }
      })
    })

    describe('Platforms', () => {
      it('should fetch platforms with language-specific URLs', async () => {
        const platforms = await service.getPlatforms({ limit: 20 })
        
        expect(Array.isArray(platforms)).toBe(true)
        platforms.forEach(platform => {
          expect(platform).toHaveProperty('id')
          expect(platform).toHaveProperty('name')
          expect(platform).toHaveProperty('displayOrder')
          expect(platform).toHaveProperty('isActive')
          
          // Check language URLs
          if (platform.urls) {
            expect(platform.urls).toHaveProperty('en')
            expect(platform.urls).toHaveProperty('nl')
            expect(platform.urls).toHaveProperty('de')
            expect(platform.urls).toHaveProperty('es')
          }
        })
      })
    })
  })

  describe('Caching and Performance', () => {
    beforeEach(async () => {
      await service.connect()
    })

    it('should cache repeated queries', async () => {
      const params: QueryParams = { limit: 10, ttl: 5000 }
      
      // First call - should hit the API
      const start1 = Date.now()
      const result1 = await service.getEpisodes(params)
      const time1 = Date.now() - start1
      
      // Second call - should hit cache
      const start2 = Date.now()
      const result2 = await service.getEpisodes(params)
      const time2 = Date.now() - start2
      
      expect(result1).toEqual(result2)
      expect(time2).toBeLessThan(time1 / 2) // Cache should be much faster
    })

    it('should respect TTL for cache expiration', async () => {
      const params: QueryParams = { limit: 5, ttl: 1000 } // 1 second TTL
      
      const result1 = await service.getEpisodes(params)
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const cacheSpy = vi.spyOn(service['cache'], 'get')
      const result2 = await service.getEpisodes(params)
      
      // Should have attempted cache but found expired entry
      expect(cacheSpy).toHaveBeenCalled()
      expect(result2).toEqual(result1) // Data should be the same
    })

    it('should meet performance requirements', async () => {
      await service.connect()
      
      const operations = [
        { name: 'getEpisodes', fn: () => service.getEpisodes({ limit: 10 }) },
        { name: 'getGuests', fn: () => service.getGuests({ limit: 10 }) },
        { name: 'getHosts', fn: () => service.getHosts({ limit: 10 }) },
        { name: 'getPlatforms', fn: () => service.getPlatforms({ limit: 20 }) }
      ]
      
      for (const op of operations) {
        const start = Date.now()
        await op.fn()
        const duration = Date.now() - start
        
        expect(duration).toBeLessThan(200) // < 200ms requirement
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network failure
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      
      await expect(service.connect()).rejects.toThrow('Network error')
      
      global.fetch = originalFetch
    })

    it('should retry failed requests according to policy', async () => {
      await service.connect()
      
      let attempts = 0
      const mockQuery = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          throw new Error('Temporary failure')
        }
        return Promise.resolve([])
      })
      
      service['mcp'].execute = mockQuery
      
      const result = await service.getEpisodes({ limit: 10 })
      
      expect(attempts).toBe(3)
      expect(result).toEqual([])
    })

    it('should handle malformed data gracefully', async () => {
      await service.connect()
      
      // Mock malformed response
      service['mcp'].execute = vi.fn().mockResolvedValue([
        { id: 1, title: 'Valid' },
        { id: 2 }, // Missing required fields
        null, // Null entry
        { id: 3, title: 'Another valid' }
      ])
      
      const result = await service.getEpisodes({ limit: 10 })
      
      // Should filter out invalid entries
      expect(result.length).toBe(2)
      expect(result[0].title).toBe('Valid')
      expect(result[1].title).toBe('Another valid')
    })
  })

  describe('Change Detection', () => {
    beforeEach(async () => {
      await service.connect()
    })

    it('should subscribe to change events', async () => {
      const changeHandler = vi.fn()
      const subscription = service.subscribeToChanges(changeHandler)
      
      expect(subscription).toBeDefined()
      expect(subscription.unsubscribe).toBeInstanceOf(Function)
      
      // Cleanup
      subscription.unsubscribe()
    })

    it('should detect changes since timestamp', async () => {
      const since = new Date(Date.now() - 3600000) // 1 hour ago
      const changes = await service.getChangesSince(since)
      
      expect(Array.isArray(changes)).toBe(true)
      changes.forEach(change => {
        expect(change).toHaveProperty('id')
        expect(change).toHaveProperty('table')
        expect(change).toHaveProperty('operation')
        expect(change).toHaveProperty('timestamp')
        expect(new Date(change.timestamp).getTime()).toBeGreaterThan(since.getTime())
      })
    })
  })
})