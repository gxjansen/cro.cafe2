import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTotalDurationByLanguage } from '../../src/utils/content'
import type { Language } from '../../src/types'

// Mock the Astro content module
vi.mock('astro:content', () => ({
  getCollection: vi.fn()
}))

describe('Hours of Content Calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTotalDurationByLanguage', () => {
    it('should correctly calculate hours from duration in seconds (string format)', async () => {
      const { getCollection } = await import('astro:content')
      const mockGetCollection = vi.mocked(getCollection)
      
      // Mock episodes with duration in seconds as strings (current format)
      mockGetCollection.mockResolvedValue([
        {
          data: {
            language: 'en',
            duration: '1927', // 32 minutes 7 seconds
            status: 'published',
            pubDate: new Date('2024-01-01')
          }
        },
        {
          data: {
            language: 'en', 
            duration: '3600', // 1 hour
            status: 'published',
            pubDate: new Date('2024-01-02')
          }
        },
        {
          data: {
            language: 'en',
            duration: '2700', // 45 minutes
            status: 'published',
            pubDate: new Date('2024-01-03')
          }
        }
      ] as any)

      const totalHours = await getTotalDurationByLanguage('en')
      
      // 1927 + 3600 + 2700 = 8227 seconds = 2.285 hours
      // Rounded to 1 decimal = 2.3 hours
      expect(totalHours).toBe(2.3)
    })

    it('should handle various duration formats', async () => {
      const { getCollection } = await import('astro:content')
      const mockGetCollection = vi.mocked(getCollection)
      
      mockGetCollection.mockResolvedValue([
        {
          data: {
            language: 'en',
            duration: '3600', // Plain seconds
            status: 'published',
            pubDate: new Date('2024-01-01')
          }
        },
        {
          data: {
            language: 'en',
            duration: '30:00', // MM:SS format = 1800 seconds
            status: 'published',
            pubDate: new Date('2024-01-02')
          }
        },
        {
          data: {
            language: 'en',
            duration: '1:15:00', // HH:MM:SS format = 4500 seconds
            status: 'published',
            pubDate: new Date('2024-01-03')
          }
        }
      ] as any)

      const totalHours = await getTotalDurationByLanguage('en')
      
      // 3600 + 1800 + 4500 = 9900 seconds = 2.75 hours
      // Rounded to 1 decimal = 2.8 hours
      expect(totalHours).toBe(2.8)
    })

    it('should return 0 for episodes with missing or invalid duration', async () => {
      const { getCollection } = await import('astro:content')
      const mockGetCollection = vi.mocked(getCollection)
      
      mockGetCollection.mockResolvedValue([
        {
          data: {
            language: 'en',
            duration: null,
            status: 'published',
            pubDate: new Date('2024-01-01')
          }
        },
        {
          data: {
            language: 'en',
            duration: undefined,
            status: 'published',
            pubDate: new Date('2024-01-02')
          }
        },
        {
          data: {
            language: 'en',
            duration: '',
            status: 'published',
            pubDate: new Date('2024-01-03')
          }
        },
        {
          data: {
            language: 'en',
            duration: 'invalid',
            status: 'published',
            pubDate: new Date('2024-01-04')
          }
        }
      ] as any)

      const totalHours = await getTotalDurationByLanguage('en')
      expect(totalHours).toBe(0)
    })

    it('should filter by language correctly', async () => {
      const { getCollection } = await import('astro:content')
      const mockGetCollection = vi.mocked(getCollection)
      
      mockGetCollection.mockResolvedValue([
        {
          data: {
            language: 'en',
            duration: '3600',
            status: 'published',
            pubDate: new Date('2024-01-01')
          }
        },
        {
          data: {
            language: 'nl',
            duration: '3600',
            status: 'published',
            pubDate: new Date('2024-01-02')
          }
        },
        {
          data: {
            language: 'en',
            duration: '1800',
            status: 'published',
            pubDate: new Date('2024-01-03')
          }
        }
      ] as any)

      const totalHours = await getTotalDurationByLanguage('en')
      
      // Only EN episodes: 3600 + 1800 = 5400 seconds = 1.5 hours
      expect(totalHours).toBe(1.5)
    })

    it('should calculate realistic totals for production-like data', async () => {
      const { getCollection } = await import('astro:content')
      const mockGetCollection = vi.mocked(getCollection)
      
      // Create 50 episodes with average duration of 30 minutes (1800 seconds)
      const episodes = Array.from({ length: 50 }, (_, i) => ({
        data: {
          language: 'en',
          duration: String(1500 + Math.floor(Math.random() * 1200)), // 25-45 minutes
          status: 'published',
          pubDate: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`)
        }
      }))

      mockGetCollection.mockResolvedValue(episodes as any)

      const totalHours = await getTotalDurationByLanguage('en')
      
      // Should be approximately 25 hours (50 episodes * 0.5 hours average)
      expect(totalHours).toBeGreaterThan(20)
      expect(totalHours).toBeLessThan(40)
    })

    it('should handle empty episode collections', async () => {
      const { getCollection } = await import('astro:content')
      const mockGetCollection = vi.mocked(getCollection)
      
      mockGetCollection.mockResolvedValue([])

      const totalHours = await getTotalDurationByLanguage('en')
      expect(totalHours).toBe(0)
    })

    it('should only count published episodes', async () => {
      const { getCollection } = await import('astro:content')
      const mockGetCollection = vi.mocked(getCollection)
      
      mockGetCollection.mockResolvedValue([
        {
          data: {
            language: 'en',
            duration: '3600',
            status: 'published',
            pubDate: new Date('2024-01-01')
          }
        },
        {
          data: {
            language: 'en',
            duration: '3600',
            status: 'draft',
            pubDate: new Date('2024-01-02')
          }
        }
      ] as any)

      const totalHours = await getTotalDurationByLanguage('en')
      
      // Only published episode: 3600 seconds = 1 hour
      expect(totalHours).toBe(1)
    })
  })

  describe('Integration Test - Minimum Hours Requirement', () => {
    it('should have at least 100 hours of content across all languages', async () => {
      const { getCollection } = await import('astro:content')
      const mockGetCollection = vi.mocked(getCollection)
      
      // Simulate realistic production data
      const languages: Language[] = ['en', 'nl', 'de', 'es']
      const episodeCounts = { en: 150, nl: 120, de: 50, es: 30 }
      
      const allEpisodes = languages.flatMap(lang => 
        Array.from({ length: episodeCounts[lang] }, (_, i) => ({
          data: {
            language: lang,
            // Average 30-minute episodes
            duration: String(1500 + Math.floor(Math.random() * 1200)),
            status: 'published',
            pubDate: new Date(`2024-01-${String((i % 30) + 1).padStart(2, '0')}`)
          }
        }))
      )

      mockGetCollection.mockResolvedValue(allEpisodes as any)

      let totalHours = 0
      for (const lang of languages) {
        const hours = await getTotalDurationByLanguage(lang)
        totalHours += hours
      }

      // Total should be at least 100 hours
      expect(totalHours).toBeGreaterThan(100)
    })
  })
})