import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CacheManager } from '@lib/utils/cache-manager'
import type { CachePolicy, CacheEntry } from '@lib/types/database'

describe('Cache Manager', () => {
  let cacheManager: CacheManager
  
  const defaultPolicy: CachePolicy = {
    ttl: 5000,
    maxSize: 100,
    evictionPolicy: 'lru'
  }

  beforeEach(() => {
    cacheManager = new CacheManager(defaultPolicy)
  })

  afterEach(() => {
    cacheManager.clear()
  })

  describe('Basic Operations', () => {
    it('should set and get cache entries', async () => {
      const key = 'test-key'
      const value = { id: 1, name: 'Test Item' }
      
      await cacheManager.set(key, value)
      const retrieved = await cacheManager.get(key)
      
      expect(retrieved).toEqual(value)
    })

    it('should return null for non-existent keys', async () => {
      const result = await cacheManager.get('non-existent')
      expect(result).toBeNull()
    })

    it('should delete cache entries', async () => {
      const key = 'delete-test'
      await cacheManager.set(key, 'value')
      
      const deleted = await cacheManager.delete(key)
      expect(deleted).toBe(true)
      
      const result = await cacheManager.get(key)
      expect(result).toBeNull()
    })

    it('should clear all cache entries', async () => {
      await cacheManager.set('key1', 'value1')
      await cacheManager.set('key2', 'value2')
      await cacheManager.set('key3', 'value3')
      
      cacheManager.clear()
      
      expect(await cacheManager.get('key1')).toBeNull()
      expect(await cacheManager.get('key2')).toBeNull()
      expect(await cacheManager.get('key3')).toBeNull()
      expect(cacheManager.size()).toBe(0)
    })
  })

  describe('TTL Management', () => {
    it('should respect TTL for cache entries', async () => {
      const key = 'ttl-test'
      const value = 'test-value'
      
      await cacheManager.set(key, value, 100) // 100ms TTL for faster test
      
      // Should exist immediately
      expect(await cacheManager.get(key)).toBe(value)
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should be expired
      expect(await cacheManager.get(key)).toBeNull()
    })

    it('should use default TTL when not specified', async () => {
      const key = 'default-ttl'
      await cacheManager.set(key, 'value')
      
      // Should use policy TTL (5000ms)
      await new Promise(resolve => setTimeout(resolve, 3000))
      expect(await cacheManager.get(key)).toBe('value')
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      expect(await cacheManager.get(key)).toBeNull()
    }, 10000)

    it('should update expiration on access for LRU', async () => {
      const key = 'lru-test'
      await cacheManager.set(key, 'value', 2000)
      
      // Access after 1 second
      await new Promise(resolve => setTimeout(resolve, 1000))
      const value = await cacheManager.get(key)
      expect(value).toBe('value')
      
      // Should still exist after original TTL due to access
      await new Promise(resolve => setTimeout(resolve, 1500))
      expect(await cacheManager.get(key)).toBe('value')
    })
  })

  describe('Size Management', () => {
    it('should enforce max size limit', async () => {
      const smallCache = new CacheManager({
        ttl: 60000,
        maxSize: 3,
        evictionPolicy: 'lru'
      })
      
      await smallCache.set('key1', 'value1')
      await smallCache.set('key2', 'value2')
      await smallCache.set('key3', 'value3')
      
      expect(smallCache.size()).toBe(3)
      
      // Adding fourth item should evict the least recently used
      await smallCache.set('key4', 'value4')
      
      expect(smallCache.size()).toBe(3)
      expect(await smallCache.get('key1')).toBeNull() // Evicted
      expect(await smallCache.get('key4')).toBe('value4')
    })

    it('should track cache size accurately', async () => {
      expect(cacheManager.size()).toBe(0)
      
      await cacheManager.set('key1', 'value1')
      expect(cacheManager.size()).toBe(1)
      
      await cacheManager.set('key2', 'value2')
      expect(cacheManager.size()).toBe(2)
      
      await cacheManager.delete('key1')
      expect(cacheManager.size()).toBe(1)
    })
  })

  describe('Eviction Policies', () => {
    describe('LRU (Least Recently Used)', () => {
      it('should evict least recently used items', async () => {
        const lruCache = new CacheManager({
          ttl: 60000,
          maxSize: 3,
          evictionPolicy: 'lru'
        })
        
        await lruCache.set('a', 1)
        await lruCache.set('b', 2)
        await lruCache.set('c', 3)
        
        // Access 'a' and 'b'
        await lruCache.get('a')
        await lruCache.get('b')
        
        // Add new item, 'c' should be evicted
        await lruCache.set('d', 4)
        
        expect(await lruCache.get('c')).toBeNull()
        expect(await lruCache.get('a')).toBe(1)
        expect(await lruCache.get('b')).toBe(2)
        expect(await lruCache.get('d')).toBe(4)
      })
    })

    describe('LFU (Least Frequently Used)', () => {
      it('should evict least frequently used items', async () => {
        const lfuCache = new CacheManager({
          ttl: 60000,
          maxSize: 3,
          evictionPolicy: 'lfu'
        })
        
        await lfuCache.set('a', 1)
        await lfuCache.set('b', 2)
        await lfuCache.set('c', 3)
        
        // Access 'a' three times, 'b' twice, 'c' once
        await lfuCache.get('a')
        await lfuCache.get('a')
        await lfuCache.get('a')
        await lfuCache.get('b')
        await lfuCache.get('b')
        await lfuCache.get('c')
        
        // Add new item, 'c' should be evicted (least frequent)
        await lfuCache.set('d', 4)
        
        expect(await lfuCache.get('c')).toBeNull()
        expect(await lfuCache.get('a')).toBe(1)
        expect(await lfuCache.get('b')).toBe(2)
        expect(await lfuCache.get('d')).toBe(4)
      })
    })

    describe('FIFO (First In First Out)', () => {
      it('should evict oldest items first', async () => {
        const fifoCache = new CacheManager({
          ttl: 60000,
          maxSize: 3,
          evictionPolicy: 'fifo'
        })
        
        await fifoCache.set('a', 1)
        await new Promise(resolve => setTimeout(resolve, 10))
        await fifoCache.set('b', 2)
        await new Promise(resolve => setTimeout(resolve, 10))
        await fifoCache.set('c', 3)
        
        // Access doesn't matter for FIFO
        await fifoCache.get('a')
        await fifoCache.get('a')
        
        // Add new item, 'a' should be evicted (oldest)
        await fifoCache.set('d', 4)
        
        expect(await fifoCache.get('a')).toBeNull()
        expect(await fifoCache.get('b')).toBe(2)
        expect(await fifoCache.get('c')).toBe(3)
        expect(await fifoCache.get('d')).toBe(4)
      })
    })
  })

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', async () => {
      await cacheManager.set('key1', 'value1')
      
      // Hits
      await cacheManager.get('key1')
      await cacheManager.get('key1')
      
      // Misses
      await cacheManager.get('key2')
      await cacheManager.get('key3')
      
      const stats = cacheManager.getStats()
      
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(2)
      expect(stats.hitRate).toBe(0.5)
    })

    it('should track evictions', async () => {
      const smallCache = new CacheManager({
        ttl: 60000,
        maxSize: 2,
        evictionPolicy: 'lru'
      })
      
      await smallCache.set('key1', 'value1')
      await smallCache.set('key2', 'value2')
      await smallCache.set('key3', 'value3') // Evicts key1
      await smallCache.set('key4', 'value4') // Evicts key2
      
      const stats = smallCache.getStats()
      expect(stats.evictions).toBe(2)
    })
  })

  describe('Multi-Level Cache', () => {
    it('should support L1/L2/L3 cache hierarchy', async () => {
      const l1Policy: CachePolicy = { ttl: 300000, maxSize: 10, evictionPolicy: 'lru' }
      const l2Policy: CachePolicy = { ttl: 3600000, maxSize: 100, evictionPolicy: 'lru' }
      const l3Policy: CachePolicy = { ttl: 86400000, maxSize: 1000, evictionPolicy: 'fifo' }
      
      const multiCache = new CacheManager(l1Policy, {
        l2: l2Policy,
        l3: l3Policy
      })
      
      const key = 'multi-test'
      const value = { data: 'test' }
      
      // Set in L1
      await multiCache.set(key, value)
      
      // Should be in L1
      const l1Result = await multiCache.get(key, { level: 'l1' })
      expect(l1Result).toEqual(value)
      
      // Promote to L2
      await multiCache.promote(key, 'l2')
      
      // Should be in L2
      const l2Result = await multiCache.get(key, { level: 'l2' })
      expect(l2Result).toEqual(value)
    })
  })

  describe('Cache Key Generation', () => {
    it('should generate consistent keys for objects', () => {
      const obj1 = { a: 1, b: 2, c: { d: 3 } }
      const obj2 = { b: 2, a: 1, c: { d: 3 } } // Different order
      
      const key1 = cacheManager.generateKey(obj1)
      const key2 = cacheManager.generateKey(obj2)
      
      expect(key1).toBe(key2)
    })

    it('should generate unique keys for different objects', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { a: 1, b: 3 }
      
      const key1 = cacheManager.generateKey(obj1)
      const key2 = cacheManager.generateKey(obj2)
      
      expect(key1).not.toBe(key2)
    })

    it('should handle arrays and complex types', () => {
      const complex = {
        arr: [1, 2, 3],
        date: new Date('2024-01-01'),
        regex: /test/g,
        fn: () => {}, // Should be ignored
        undef: undefined // Should be ignored
      }
      
      const key = cacheManager.generateKey(complex)
      expect(key).toMatch(/^[a-f0-9]{32}$/) // MD5 hash
    })
  })
})