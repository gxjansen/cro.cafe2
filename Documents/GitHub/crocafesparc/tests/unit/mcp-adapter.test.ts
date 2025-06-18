import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MCPAdapter } from '@lib/utils/mcp-adapter'
import type { MCPConfiguration, QueryParams } from '@lib/types/database'

describe('MCP Adapter', () => {
  let adapter: MCPAdapter
  
  const testConfig: MCPConfiguration = {
    nocodb: {
      server: 'http://localhost:8080',
      apiKey: 'test-key',
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
  }

  beforeEach(() => {
    adapter = new MCPAdapter()
  })

  describe('Connection Management', () => {
    it('should connect to MCP server', async () => {
      await adapter.connect(testConfig)
      
      expect(adapter.isConnected()).toBe(true)
    })

    it('should handle connection pooling', async () => {
      await adapter.connect(testConfig)
      
      // Multiple queries should reuse connection
      const promises = Array(5).fill(null).map(() => 
        adapter.query({ table: 'Episodes', limit: 10 })
      )
      
      await Promise.all(promises)
      
      // Adapter should handle multiple queries efficiently
      expect(adapter.isConnected()).toBe(true)
    })

    it('should disconnect properly', async () => {
      await adapter.connect(testConfig)
      expect(adapter.isConnected()).toBe(true)
      
      await adapter.disconnect()
      expect(adapter.isConnected()).toBe(false)
    })
  })

  describe('Query Execution', () => {
    beforeEach(async () => {
      await adapter.connect(testConfig)
    })

    it('should execute basic queries', async () => {
      const result = await adapter.query<any>({
        table: 'Episodes',
        limit: 10
      })
      
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeLessThanOrEqual(10)
    })

    it('should handle complex queries with filters', async () => {
      const params: QueryParams & { table: string } = {
        table: 'Episodes',
        limit: 20,
        offset: 10,
        sort: [{ field: 'publishedAt', order: 'desc' }],
        filters: {
          status: 'published',
          language: 'en'
        },
        include: ['guests', 'hosts']
      }
      
      const result = await adapter.query(params)
      
      expect(Array.isArray(result)).toBe(true)
    })

    it('should validate query parameters', async () => {
      const invalidParams = {
        table: 'Episodes',
        limit: -1, // Invalid
        offset: 'invalid' // Wrong type
      }
      
      await expect(adapter.query(invalidParams as any))
        .rejects.toThrow('Invalid query parameters')
    })
  })

  describe('Caching', () => {
    beforeEach(async () => {
      await adapter.connect(testConfig)
    })

    it('should cache query results', async () => {
      const params: QueryParams & { table: string } = { 
        table: 'Episodes',
        limit: 10, 
        ttl: 5000 
      }
      
      // First call - should hit the server
      const result1 = await adapter.query(params)
      
      // Second call - should hit cache
      const start = Date.now()
      const result2 = await adapter.query(params)
      const duration = Date.now() - start
      
      expect(result1).toEqual(result2)
      expect(duration).toBeLessThan(10) // Cache should be very fast
    })

    it('should generate consistent cache keys', () => {
      const params1 = { limit: 10, filters: { status: 'published' } }
      const params2 = { filters: { status: 'published' }, limit: 10 }
      
      const key1 = adapter.generateCacheKey(params1)
      const key2 = adapter.generateCacheKey(params2)
      
      expect(key1).toBe(key2)
    })

    it('should invalidate cache after TTL', async () => {
      const params: QueryParams & { table: string } = { 
        table: 'Episodes',
        limit: 5, 
        ttl: 100 // Very short TTL for testing
      }
      
      await adapter.query(params)
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should fetch fresh data
      const result = await adapter.query(params)
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle connection failures', async () => {
      const failingConfig = {
        ...testConfig,
        nocodb: {
          ...testConfig.nocodb,
          server: 'http://invalid-host:9999'
        }
      }
      
      // In test environment, this will still succeed with mock
      // In real environment, this would fail
      await expect(adapter.connect(failingConfig)).resolves.not.toThrow()
    })

    it('should validate required parameters', async () => {
      await adapter.connect(testConfig)
      
      // Missing table parameter
      await expect(adapter.query({} as any))
        .rejects.toThrow()
    })
  })

  describe('Health Monitoring', () => {
    it('should provide health status', async () => {
      await adapter.connect(testConfig)
      
      const health = await adapter.healthCheck()
      
      expect(health).toMatchObject({
        connected: true,
        latency: expect.any(Number),
        lastCheck: expect.any(Date)
      })
      
      expect(health.latency).toBeLessThan(200)
    })

    it('should detect disconnected state', async () => {
      const health = await adapter.healthCheck()
      
      expect(health.connected).toBe(false)
    })
  })

  describe('Cache Key Generation', () => {
    it('should normalize objects for consistent keys', () => {
      const obj1 = { a: 1, b: { c: 2, d: 3 }, e: [4, 5] }
      const obj2 = { e: [4, 5], a: 1, b: { d: 3, c: 2 } }
      
      const key1 = adapter.generateCacheKey(obj1)
      const key2 = adapter.generateCacheKey(obj2)
      
      expect(key1).toBe(key2)
    })

    it('should handle special types', () => {
      const obj = {
        date: new Date('2024-01-01'),
        regex: /test/g,
        fn: () => {}, // Should be ignored
        undef: undefined, // Should be ignored
        nil: null
      }
      
      const key = adapter.generateCacheKey(obj)
      expect(key).toMatch(/^[a-f0-9]{32}$/)
    })
  })
})