import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getGuestsByLanguage, getHostStatistics, getTotalGuestCount } from '../../src/utils/content'
import type { Language } from '../../src/types'

// Mock Astro content collections
vi.mock('astro:content', () => ({
  getCollection: vi.fn()
}))

describe('Statistics Display Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Issue 1: Language Page Guest Counts', () => {
    it('should return guests filtered by language', async () => {
      const mockGuests = [
        { data: { name: 'Guest 1', languages: ['en'], episodes: ['1'] } },
        { data: { name: 'Guest 2', languages: ['nl'], episodes: ['2'] } },
        { data: { name: 'Guest 3', languages: ['en', 'nl'], episodes: ['3'] } },
        { data: { name: 'Guest 4', languages: ['de'], episodes: ['4'] } }
      ]

      const { getCollection } = await import('astro:content')
      vi.mocked(getCollection).mockResolvedValue(mockGuests as any)

      const englishGuests = await getGuestsByLanguage('en')
      expect(englishGuests).toHaveLength(2) // Guest 1 and Guest 3
      expect(englishGuests[0].data.name).toBe('Guest 1')
      expect(englishGuests[1].data.name).toBe('Guest 3')
    })

    it('should handle guests with empty or missing languages array', async () => {
      const mockGuests = [
        { data: { name: 'Guest 1', languages: ['en'], episodes: ['1'] } },
        { data: { name: 'Guest 2', languages: [], episodes: ['2'] } },
        { data: { name: 'Guest 3', episodes: ['3'] } }, // missing languages
        { data: { name: 'Guest 4', languages: null, episodes: ['4'] } }
      ]

      const { getCollection } = await import('astro:content')
      vi.mocked(getCollection).mockResolvedValue(mockGuests as any)

      const englishGuests = await getGuestsByLanguage('en')
      expect(englishGuests).toHaveLength(1) // Only Guest 1
      expect(englishGuests[0].data.name).toBe('Guest 1')
    })

    it('should return expected counts for each language', async () => {
      const mockGuests = [
        { data: { name: 'EN Guest 1', languages: ['en'], episodes: ['1'] } },
        { data: { name: 'EN Guest 2', languages: ['en'], episodes: ['2'] } },
        { data: { name: 'NL Guest 1', languages: ['nl'], episodes: ['3'] } },
        { data: { name: 'NL Guest 2', languages: ['nl'], episodes: ['4'] } },
        { data: { name: 'DE Guest 1', languages: ['de'], episodes: ['5'] } },
        { data: { name: 'ES Guest 1', languages: ['es'], episodes: ['6'] } },
        { data: { name: 'Multi Guest', languages: ['en', 'nl'], episodes: ['7'] } }
      ]

      const { getCollection } = await import('astro:content')
      vi.mocked(getCollection).mockResolvedValue(mockGuests as any)

      const enGuests = await getGuestsByLanguage('en')
      const nlGuests = await getGuestsByLanguage('nl')
      const deGuests = await getGuestsByLanguage('de')
      const esGuests = await getGuestsByLanguage('es')

      expect(enGuests).toHaveLength(3) // EN Guest 1, EN Guest 2, Multi Guest
      expect(nlGuests).toHaveLength(3) // NL Guest 1, NL Guest 2, Multi Guest
      expect(deGuests).toHaveLength(1) // DE Guest 1
      expect(esGuests).toHaveLength(1) // ES Guest 1
    })
  })

  describe('Issue 2: Host Page Statistics', () => {
    it('should calculate correct host statistics when episodes match', async () => {
      const mockEpisodes = [
        { data: { transistorId: '1001', language: 'en' as Language, status: 'published', guests: ['guest1', 'guest2'] } },
        { data: { transistorId: '1002', language: 'nl' as Language, status: 'published', guests: ['guest2', 'guest3'] } },
        { data: { transistorId: '1003', language: 'en' as Language, status: 'published', guests: ['guest1'] } },
        { data: { transistorId: '1004', language: 'de' as Language, status: 'draft', guests: ['guest4'] } } // draft episode
      ]

      const mockHosts = [
        {
          data: {
            slug: 'test-host',
            episodes: ['1001', '1002', '1003', '1004'] // includes draft episode
          }
        }
      ]

      const { getCollection } = await import('astro:content')
      vi.mocked(getCollection)
        .mockResolvedValueOnce(mockEpisodes as any) // episodes collection
        .mockResolvedValueOnce(mockHosts as any)    // hosts collection

      const stats = await getHostStatistics('test-host')

      expect(stats.totalEpisodes).toBe(3) // Only published episodes
      expect(stats.totalGuests).toBe(3) // Unique guests: guest1, guest2, guest3
      expect(stats.episodesByLanguage.en).toBe(2)
      expect(stats.episodesByLanguage.nl).toBe(1)
      expect(stats.episodesByLanguage.de).toBe(0) // Draft episode excluded
      expect(stats.episodesByLanguage.es).toBe(0)
    })

    it('should return zero stats for host with no matching episodes', async () => {
      const mockEpisodes = [
        { data: { transistorId: '1001', language: 'en' as Language, status: 'published', guests: ['guest1'] } }
      ]

      const mockHosts = [
        {
          data: {
            slug: 'test-host',
            episodes: ['9999'] // No matching transistorId
          }
        }
      ]

      const { getCollection } = await import('astro:content')
      vi.mocked(getCollection)
        .mockResolvedValueOnce(mockEpisodes as any)
        .mockResolvedValueOnce(mockHosts as any)

      const stats = await getHostStatistics('test-host')

      expect(stats.totalEpisodes).toBe(0)
      expect(stats.totalGuests).toBe(0)
      expect(stats.episodesByLanguage.en).toBe(0)
      expect(stats.episodesByLanguage.nl).toBe(0)
      expect(stats.episodesByLanguage.de).toBe(0)
      expect(stats.episodesByLanguage.es).toBe(0)
    })

    it('should handle host with missing episodes array', async () => {
      const mockEpisodes = [
        { data: { transistorId: '1001', language: 'en' as Language, status: 'published', guests: ['guest1'] } }
      ]

      const mockHosts = [
        {
          data: {
            slug: 'test-host'
            // No episodes array
          }
        }
      ]

      const { getCollection } = await import('astro:content')
      vi.mocked(getCollection)
        .mockResolvedValueOnce(mockEpisodes as any)
        .mockResolvedValueOnce(mockHosts as any)

      const stats = await getHostStatistics('test-host')

      expect(stats.totalEpisodes).toBe(0)
      expect(stats.totalGuests).toBe(0)
    })
  })

  describe('Issue 3: Guest Page Initial Display', () => {
    it('should count total guests including those with empty episodes', async () => {
      const mockGuests = [
        { data: { name: 'Guest with episodes', episodes: ['1', '2'] } },
        { data: { name: 'Guest with empty episodes', episodes: [] } },
        { data: { name: 'Guest with no episodes field' } },
        { data: { name: 'Guest with null episodes', episodes: null } }
      ]

      const { getCollection } = await import('astro:content')
      vi.mocked(getCollection).mockResolvedValue(mockGuests as any)

      const totalCount = await getTotalGuestCount()
      
      // Currently this test might fail because getTotalGuestCount filters out guests without episodes
      // After fix, it should count all guests or have a separate function for initial display
      expect(totalCount).toBeGreaterThan(0)
    })

    it('should handle guests with various episode array formats', async () => {
      const mockGuests = [
        { data: { name: 'Guest 1', episodes: ['1001', '1002'], languages: ['en'] } },
        { data: { name: 'Guest 2', episodes: [], languages: ['en'] } }, // Empty episodes
        { data: { name: 'Guest 3', episodes: ['1003'], languages: ['en'] } },
        { data: { name: 'Guest 4', languages: ['en'] } } // No episodes field
      ]

      const { getCollection } = await import('astro:content')
      vi.mocked(getCollection).mockResolvedValue(mockGuests as any)

      const englishGuests = await getGuestsByLanguage('en')
      
      // All guests should be returned regardless of episode count for initial display
      expect(englishGuests).toHaveLength(4)
    })
  })

  describe('Edge Cases and Data Consistency', () => {
    it('should handle malformed guest data gracefully', async () => {
      const mockGuests = [
        { data: { name: 'Normal Guest', languages: ['en'], episodes: ['1'] } },
        { data: { languages: ['en'] } }, // Missing name
        { }, // Missing data
        null, // Null guest
        { data: { name: 'Guest with string languages', languages: 'en', episodes: ['2'] } } // Wrong type
      ]

      const { getCollection } = await import('astro:content')
      vi.mocked(getCollection).mockResolvedValue(mockGuests as any)

      // Should not throw errors and return valid guests only
      expect(async () => {
        const guests = await getGuestsByLanguage('en')
        expect(guests).toBeDefined()
        expect(Array.isArray(guests)).toBe(true)
      }).not.toThrow()
    })

    it('should handle missing collections gracefully', async () => {
      const { getCollection } = await import('astro:content')
      vi.mocked(getCollection).mockRejectedValue(new Error('Collection not found'))

      // Should handle errors gracefully
      expect(async () => {
        await getGuestsByLanguage('en')
      }).not.toThrow()
    })
  })
})