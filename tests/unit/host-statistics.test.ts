import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getHostStatistics } from '../../src/utils/content'
import type { Language } from '../../src/types'

// Mock the Astro content module
vi.mock('astro:content', () => ({
  getCollection: vi.fn()
}))

describe('Host Statistics Calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getHostStatistics', () => {
    it('should never return zero episodes for hosts with episodes', async () => {
      const { getCollection } = await import('astro:content')
      const mockGetCollection = vi.mocked(getCollection)
      
      // Mock episodes collection where host appears in hosts array
      const mockEpisodes = [
        {
          data: {
            transistorId: '762635',
            language: 'es',
            status: 'published',
            hosts: ['ricardotayar'], // Host appears in hosts array
            guests: ['guest1', 'guest2'],
            pubDate: new Date('2024-01-01')
          }
        },
        {
          data: {
            transistorId: '762636',
            language: 'es',
            status: 'published',
            hosts: ['ricardotayar'], // Host appears in hosts array
            guests: ['guest3'],
            pubDate: new Date('2024-01-02')
          }
        },
        {
          data: {
            transistorId: '762637',
            language: 'es',
            status: 'published',
            hosts: ['ricardotayar'], // Host appears in hosts array
            guests: ['guest1', 'guest4'],
            pubDate: new Date('2024-01-03')
          }
        }
      ]
      
      // Set up mocks to return episodes
      mockGetCollection.mockResolvedValue(mockEpisodes as any)

      const stats = await getHostStatistics('ricardotayar')
      
      // Host should have 3 episodes and 4 unique guests
      expect(stats.totalEpisodes).toBe(3)
      expect(stats.totalEpisodes).toBeGreaterThan(0)
      expect(stats.totalGuests).toBe(4)
      expect(stats.totalGuests).toBeGreaterThan(0)
      expect(stats.episodesByLanguage.es).toBe(3)
    })

    it('should handle hosts without episodes gracefully', async () => {
      const { getCollection } = await import('astro:content')
      const mockGetCollection = vi.mocked(getCollection)
      
      // Return empty episodes array (no episodes for this host)
      mockGetCollection.mockResolvedValue([] as any)

      const stats = await getHostStatistics('newhost')
      
      // Should return zeros for a host with no episodes
      expect(stats.totalEpisodes).toBe(0)
      expect(stats.totalGuests).toBe(0)
    })

    it('should only count published episodes', async () => {
      const { getCollection } = await import('astro:content')
      const mockGetCollection = vi.mocked(getCollection)
      
      const mockEpisodes = [
        {
          data: {
            transistorId: '123',
            language: 'en',
            status: 'published',
            hosts: ['testhost'],
            guests: ['guest1'],
            pubDate: new Date('2024-01-01')
          }
        },
        {
          data: {
            transistorId: '124',
            language: 'en',
            status: 'draft',
            hosts: ['testhost'],
            guests: ['guest2'],
            pubDate: new Date('2024-01-02')
          }
        },
        {
          data: {
            transistorId: '125',
            language: 'en',
            status: 'published',
            hosts: ['testhost'],
            guests: ['guest3'],
            pubDate: new Date('2024-01-03')
          }
        }
      ]
      
      mockGetCollection.mockResolvedValue(mockEpisodes as any)

      const stats = await getHostStatistics('testhost')
      
      // Should only count published episodes (2 out of 3)
      expect(stats.totalEpisodes).toBe(2)
      expect(stats.totalGuests).toBe(2)
    })

    it('should count unique guests across all languages', async () => {
      const { getCollection } = await import('astro:content')
      const mockGetCollection = vi.mocked(getCollection)
      
      const mockEpisodes = [
        {
          data: {
            transistorId: '201',
            language: 'en',
            status: 'published',
            hosts: ['multihost'],
            guests: ['guest1', 'guest2'],
            pubDate: new Date('2024-01-01')
          }
        },
        {
          data: {
            transistorId: '202',
            language: 'nl',
            status: 'published',
            hosts: ['multihost'],
            guests: ['guest1', 'guest3'], // guest1 appears again
            pubDate: new Date('2024-01-02')
          }
        },
        {
          data: {
            transistorId: '203',
            language: 'en',
            status: 'published',
            hosts: ['multihost'],
            guests: ['guest2', 'guest4'], // guest2 appears again
            pubDate: new Date('2024-01-03')
          }
        },
        {
          data: {
            transistorId: '204',
            language: 'de',
            status: 'published',
            hosts: ['multihost'],
            guests: ['guest5'],
            pubDate: new Date('2024-01-04')
          }
        }
      ]
      
      mockGetCollection.mockResolvedValue(mockEpisodes as any)

      const stats = await getHostStatistics('multihost')
      
      // Should have 4 episodes across 3 languages with 5 unique guests total
      expect(stats.totalEpisodes).toBe(4)
      expect(stats.totalGuests).toBe(5) // guest1, guest2, guest3, guest4, guest5
      expect(stats.episodesByLanguage.en).toBe(2)
      expect(stats.episodesByLanguage.nl).toBe(1)
      expect(stats.episodesByLanguage.de).toBe(1)
      expect(stats.episodesByLanguage.es).toBe(0)
    })
  })

  describe('Production Host Statistics - Never Zero', () => {
    it('should fail if any production host has zero episodes', async () => {
      const { getCollection } = await import('astro:content')
      const mockGetCollection = vi.mocked(getCollection)
      
      // Mock episodes for each production host
      
      // Mock episodes for each host
      const mockEpisodes = [
        // Guido's episodes
        { data: { transistorId: '100', language: 'en', status: 'published', hosts: ['gxjansen'], guests: ['g1'], pubDate: new Date() } },
        { data: { transistorId: '101', language: 'en', status: 'published', hosts: ['gxjansen'], guests: ['g2'], pubDate: new Date() } },
        { data: { transistorId: '102', language: 'nl', status: 'published', hosts: ['gxjansen'], guests: ['g3'], pubDate: new Date() } },
        { data: { transistorId: '103', language: 'nl', status: 'published', hosts: ['gxjansen'], guests: ['g4'], pubDate: new Date() } },
        { data: { transistorId: '104', language: 'en', status: 'published', hosts: ['gxjansen'], guests: ['g5'], pubDate: new Date() } },
        // Ricardo's episodes
        { data: { transistorId: '200', language: 'es', status: 'published', hosts: ['ricardotayar'], guests: ['g6'], pubDate: new Date() } },
        { data: { transistorId: '201', language: 'es', status: 'published', hosts: ['ricardotayar'], guests: ['g7'], pubDate: new Date() } },
        { data: { transistorId: '202', language: 'es', status: 'published', hosts: ['ricardotayar'], guests: ['g8'], pubDate: new Date() } },
        // Michael's episodes
        { data: { transistorId: '300', language: 'de', status: 'published', hosts: ['michaelwitzenleiter'], guests: ['g9'], pubDate: new Date() } },
        { data: { transistorId: '301', language: 'de', status: 'published', hosts: ['michaelwitzenleiter'], guests: ['g10'], pubDate: new Date() } },
        // Yvonne's episodes
        { data: { transistorId: '400', language: 'de', status: 'published', hosts: ['yvonneteufel'], guests: ['g11'], pubDate: new Date() } }
      ]
      
      mockGetCollection.mockResolvedValue(mockEpisodes as any)

      // Test each production host
      const hostSlugs = ['gxjansen', 'ricardotayar', 'michaelwitzenleiter', 'yvonneteufel']
      const expectedMinimums = {
        'gxjansen': { episodes: 5, guests: 5 },
        'ricardotayar': { episodes: 3, guests: 3 },
        'michaelwitzenleiter': { episodes: 2, guests: 2 },
        'yvonneteufel': { episodes: 1, guests: 1 }
      }
      
      for (const hostSlug of hostSlugs) {
        const stats = await getHostStatistics(hostSlug)
        const expected = expectedMinimums[hostSlug]
        
        // Each host must have at least the expected number of episodes
        expect(stats.totalEpisodes).toBeGreaterThanOrEqual(expected.episodes)
        expect(stats.totalEpisodes).toBeGreaterThan(0)
        
        // Each host must have at least one guest
        expect(stats.totalGuests).toBeGreaterThanOrEqual(expected.guests)
        expect(stats.totalGuests).toBeGreaterThan(0)
        
        // Fail with a clear message if any host has zero episodes
        if (stats.totalEpisodes === 0) {
          throw new Error(`CRITICAL: Host ${hostSlug} has 0 episodes! This should never happen in production.`)
        }
        
        if (stats.totalGuests === 0) {
          throw new Error(`CRITICAL: Host ${hostSlug} has 0 guests! This should never happen in production.`)
        }
      }
    })
  })
})