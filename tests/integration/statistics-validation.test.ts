import { describe, it, expect } from 'vitest'
import {
  getTotalGuestCount,
  getTotalEpisodeCount,
  getEpisodeCountByLanguage,
  getGuestCountByLanguage,
  getTotalDurationByLanguage,
  getLanguageCounts,
  getHostStatistics,
  getEpisodesByLanguage,
  getGuestsByLanguage
} from '../../src/utils/content'
import type { Language } from '../../src/types'

// Minimum expected values based on current data (as of December 2024)
// These numbers should only increase over time
const MINIMUM_STATS = {
  global: {
    episodes: 300, // Current: ~600+
    guests: 250,   // Current: ~400+
    hours: 200     // Current: ~400+ hours
  },
  languages: {
    en: { episodes: 100, guests: 100, hours: 50 },
    nl: { episodes: 50, guests: 50, hours: 25 },
    de: { episodes: 30, guests: 30, hours: 15 },
    es: { episodes: 20, guests: 20, hours: 10 }
  },
  hosts: {
    gxjansen: { episodes: 150, guests: 150 },
    michaelwitzenleiter: { episodes: 20, guests: 20 },
    ricardotayar: { episodes: 15, guests: 15 },
    yvonneteufel: { episodes: 10, guests: 10 }
  }
}

describe('Statistics Validation', () => {
  describe('Global Statistics', () => {
    it('should have minimum total episode count', async () => {
      const totalEpisodes = await getTotalEpisodeCount()
      expect(totalEpisodes).toBeGreaterThanOrEqual(MINIMUM_STATS.global.episodes)
      expect(totalEpisodes).toBeGreaterThan(0)
    })

    it('should have minimum total guest count', async () => {
      const totalGuests = await getTotalGuestCount()
      expect(totalGuests).toBeGreaterThanOrEqual(MINIMUM_STATS.global.guests)
      expect(totalGuests).toBeGreaterThan(0)
    })

    it('should have minimum total hours of content', async () => {
      const languages: Language[] = ['en', 'nl', 'de', 'es']
      let totalHours = 0
      
      for (const lang of languages) {
        const hours = await getTotalDurationByLanguage(lang)
        totalHours += hours
      }
      
      expect(totalHours).toBeGreaterThanOrEqual(MINIMUM_STATS.global.hours)
      expect(totalHours).toBeGreaterThan(0)
    })
  })

  describe('Language-Specific Statistics', () => {
    const languages: Language[] = ['en', 'nl', 'de', 'es']

    languages.forEach(lang => {
      describe(`${lang.toUpperCase()} Language`, () => {
        it(`should have minimum episode count for ${lang}`, async () => {
          const episodeCount = await getEpisodeCountByLanguage(lang)
          expect(episodeCount).toBeGreaterThanOrEqual(MINIMUM_STATS.languages[lang].episodes)
          expect(episodeCount).toBeGreaterThan(0)
        })

        it(`should have minimum guest count for ${lang}`, async () => {
          const guests = await getGuestsByLanguage(lang)
          expect(guests.length).toBeGreaterThanOrEqual(MINIMUM_STATS.languages[lang].guests)
          expect(guests.length).toBeGreaterThan(0)
        })

        it(`should have minimum hours of content for ${lang}`, async () => {
          const hours = await getTotalDurationByLanguage(lang)
          expect(hours).toBeGreaterThanOrEqual(MINIMUM_STATS.languages[lang].hours)
          expect(hours).toBeGreaterThan(0)
        })

        it(`should have proper episode duration parsing for ${lang}`, async () => {
          const episodes = await getEpisodesByLanguage(lang)
          // Check that at least some episodes have valid durations
          const validDurations = episodes.filter(ep => {
            const duration = ep.data.duration
            return duration && duration.includes(':')
          })
          expect(validDurations.length).toBeGreaterThan(0)
        })
      })
    })
  })

  describe('Host Statistics', () => {
    const hosts = ['gxjansen', 'michaelwitzenleiter', 'ricardotayar', 'yvonneteufel']

    hosts.forEach(hostSlug => {
      describe(`Host: ${hostSlug}`, () => {
        it(`should have minimum statistics for ${hostSlug}`, async () => {
          const stats = await getHostStatistics(hostSlug)
          
          expect(stats.totalEpisodes).toBeGreaterThanOrEqual(MINIMUM_STATS.hosts[hostSlug].episodes)
          expect(stats.totalEpisodes).toBeGreaterThan(0)
          
          expect(stats.totalGuests).toBeGreaterThanOrEqual(MINIMUM_STATS.hosts[hostSlug].guests)
          expect(stats.totalGuests).toBeGreaterThan(0)
        })

        it(`should have episodes in expected languages for ${hostSlug}`, async () => {
          const stats = await getHostStatistics(hostSlug)
          
          // Check specific language expectations
          if (hostSlug === 'gxjansen') {
            expect(stats.episodesByLanguage.en).toBeGreaterThan(0)
            expect(stats.episodesByLanguage.nl).toBeGreaterThan(0)
          } else if (hostSlug === 'michaelwitzenleiter' || hostSlug === 'yvonneteufel') {
            expect(stats.episodesByLanguage.de).toBeGreaterThan(0)
          } else if (hostSlug === 'ricardotayar') {
            expect(stats.episodesByLanguage.es).toBeGreaterThan(0)
          }
        })
      })
    })
  })

  describe('Language Counts (Navigation Dropdown)', () => {
    it('should have proper language counts for navigation', async () => {
      const counts = await getLanguageCounts()
      
      // Global counts
      expect(counts.global.episodes).toBeGreaterThanOrEqual(MINIMUM_STATS.global.episodes)
      expect(counts.global.guests).toBeGreaterThanOrEqual(MINIMUM_STATS.global.guests)
      
      // Per-language counts
      const languages: Language[] = ['en', 'nl', 'de', 'es']
      languages.forEach(lang => {
        expect(counts[lang].episodes).toBeGreaterThanOrEqual(MINIMUM_STATS.languages[lang].episodes)
        expect(counts[lang].guests).toBeGreaterThanOrEqual(MINIMUM_STATS.languages[lang].guests)
      })
    })
  })

  describe('Data Integrity Checks', () => {
    it('should have consistent guest counts', async () => {
      const totalGuestCount = await getTotalGuestCount()
      const languageCounts = await getLanguageCounts()
      
      // Total guest count should be reasonable compared to language counts
      // (guests can appear in multiple languages, so total should be less than sum)
      const sumOfLanguageGuests = Object.values(languageCounts)
        .filter(count => typeof count === 'object' && 'guests' in count)
        .reduce((sum, count) => sum + (count as any).guests, 0)
      
      expect(totalGuestCount).toBeLessThanOrEqual(sumOfLanguageGuests)
      expect(totalGuestCount).toBeGreaterThan(0)
    })

    it('should have reasonable duration values', async () => {
      const languages: Language[] = ['en', 'nl', 'de', 'es']
      
      for (const lang of languages) {
        const episodes = await getEpisodesByLanguage(lang)
        const hours = await getTotalDurationByLanguage(lang)
        
        if (episodes.length > 0) {
          // Average episode duration should be between 10 minutes and 2 hours
          const avgHoursPerEpisode = hours / episodes.length
          expect(avgHoursPerEpisode).toBeGreaterThan(0.16) // > 10 minutes
          expect(avgHoursPerEpisode).toBeLessThan(2) // < 2 hours
        }
      }
    })

    it('should not have any zero statistics on active languages', async () => {
      const counts = await getLanguageCounts()
      const languages: Language[] = ['en', 'nl', 'de', 'es']
      
      languages.forEach(lang => {
        // All languages should have at least some content
        expect(counts[lang].episodes).toBeGreaterThan(0)
        expect(counts[lang].guests).toBeGreaterThan(0)
      })
    })
  })

  describe('Critical Statistics Failures', () => {
    it('should fail if any primary statistic is zero', async () => {
      const totalEpisodes = await getTotalEpisodeCount()
      const totalGuests = await getTotalGuestCount()
      
      // These should NEVER be zero
      expect(totalEpisodes).not.toBe(0)
      expect(totalGuests).not.toBe(0)
    })

    it('should fail if language pages would show zero content', async () => {
      const languages: Language[] = ['en', 'nl', 'de', 'es']
      
      for (const lang of languages) {
        const episodes = await getEpisodesByLanguage(lang)
        const guests = await getGuestsByLanguage(lang)
        const hours = await getTotalDurationByLanguage(lang)
        
        // Language pages should never show all zeros
        const hasContent = episodes.length > 0 || guests.length > 0 || hours > 0
        expect(hasContent).toBe(true)
      }
    })
  })
})