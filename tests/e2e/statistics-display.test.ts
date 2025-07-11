import { test, expect } from '@playwright/test'

// Minimum expected values for statistics
const MIN_STATS = {
  episodes: 300,
  guests: 250,
  hours: 200,
  countries: 15
}

// Language-specific minimums
const MIN_LANG_STATS = {
  en: { episodes: 100, guests: 100, hours: 50 },
  nl: { episodes: 50, guests: 50, hours: 25 },
  de: { episodes: 30, guests: 30, hours: 15 },
  es: { episodes: 20, guests: 20, hours: 10 }
}

// Host-specific minimums
const MIN_HOST_STATS = {
  gxjansen: { episodes: 150, guests: 150 },
  michaelwitzenleiter: { episodes: 20, guests: 20 },
  ricardotayar: { episodes: 15, guests: 15 },
  yvonneteufel: { episodes: 10, guests: 10 }
}

test.describe('Statistics Display Validation', () => {
  test.describe('Homepage Statistics', () => {
    test('should display valid statistics in hero section', async ({ page }) => {
      await page.goto('/')
      
      // Wait for statistics to load
      await page.waitForSelector('[data-counter-target]', { timeout: 10000 })
      
      // Check Episodes count
      const episodesElement = await page.locator('text=Episodes').locator('..').locator('[data-counter-target]')
      const episodesText = await episodesElement.textContent()
      const episodesCount = parseInt(episodesText?.replace(/[^0-9]/g, '') || '0')
      expect(episodesCount).toBeGreaterThanOrEqual(MIN_STATS.episodes)
      expect(episodesCount).toBeGreaterThan(0)
      
      // Check Expert Guests count
      const guestsElement = await page.locator('text=Expert Guests').locator('..').locator('[data-counter-target]')
      const guestsText = await guestsElement.textContent()
      const guestsCount = parseInt(guestsText?.replace(/[^0-9]/g, '') || '0')
      expect(guestsCount).toBeGreaterThanOrEqual(MIN_STATS.guests)
      expect(guestsCount).toBeGreaterThan(0)
      
      // Check Hours of Content
      const hoursElement = await page.locator('text=Hours of Content').locator('..').locator('[data-counter-target]')
      const hoursText = await hoursElement.textContent()
      const hoursCount = parseInt(hoursText?.replace(/[^0-9]/g, '') || '0')
      expect(hoursCount).toBeGreaterThanOrEqual(MIN_STATS.hours)
      expect(hoursCount).toBeGreaterThan(0)
      
      // Check Guest Countries
      const countriesElement = await page.locator('text=Guest Countries').locator('..').locator('[data-counter-target]')
      const countriesText = await countriesElement.textContent()
      const countriesCount = parseInt(countriesText?.replace(/[^0-9]/g, '') || '0')
      expect(countriesCount).toBeGreaterThanOrEqual(MIN_STATS.countries)
      expect(countriesCount).toBeGreaterThan(0)
    })

    test('should not display zero for any statistic', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('[data-counter-target]', { timeout: 10000 })
      
      // Get all counter elements
      const counters = await page.locator('[data-counter-target]').all()
      
      for (const counter of counters) {
        const text = await counter.textContent()
        const value = parseInt(text?.replace(/[^0-9]/g, '') || '0')
        expect(value).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Language Landing Pages', () => {
    const languages = [
      { code: 'en', path: '/en/' },
      { code: 'nl', path: '/nl/' },
      { code: 'de', path: '/de/' },
      { code: 'es', path: '/es/' }
    ]

    languages.forEach(({ code, path }) => {
      test(`should display valid statistics on ${code.toUpperCase()} landing page`, async ({ page }) => {
        await page.goto(path)
        await page.waitForSelector('.stats-section', { timeout: 10000 })
        
        // Check episode count
        const episodesElement = await page.locator('.stats-item:has-text("episodes")').first()
        const episodesText = await episodesElement.textContent()
        const episodesCount = parseInt(episodesText?.match(/\d+/)?.[0] || '0')
        expect(episodesCount).toBeGreaterThanOrEqual(MIN_LANG_STATS[code].episodes)
        expect(episodesCount).toBeGreaterThan(0)
        
        // Check guest count
        const guestsElement = await page.locator('.stats-item:has-text("expert guests")').first()
        const guestsText = await guestsElement.textContent()
        const guestsCount = parseInt(guestsText?.match(/\d+/)?.[0] || '0')
        expect(guestsCount).toBeGreaterThanOrEqual(MIN_LANG_STATS[code].guests)
        expect(guestsCount).toBeGreaterThan(0)
        
        // Check hours of content
        const hoursElement = await page.locator('.stats-item:has-text("hours of content")').first()
        const hoursText = await hoursElement.textContent()
        const hoursMatch = hoursText?.match(/[\d.]+/)
        const hoursCount = parseFloat(hoursMatch?.[0] || '0')
        expect(hoursCount).toBeGreaterThanOrEqual(MIN_LANG_STATS[code].hours)
        expect(hoursCount).toBeGreaterThan(0)
      })
    })
  })

  test.describe('Host Landing Pages', () => {
    const hosts = [
      { slug: 'gxjansen', name: 'Guido X Jansen' },
      { slug: 'michaelwitzenleiter', name: 'Michael Witzenleiter' },
      { slug: 'ricardotayar', name: 'Ricardo Tayar' },
      { slug: 'yvonneteufel', name: 'Yvonne Teufel' }
    ]

    hosts.forEach(({ slug, name }) => {
      test(`should display valid statistics for host ${name}`, async ({ page }) => {
        await page.goto(`/hosts/${slug}/`)
        await page.waitForSelector('.host-stats', { timeout: 10000 })
        
        // Check episodes count
        const episodesElement = await page.locator('.stat-value:has-text("Episodes")').locator('..')
        const episodesText = await episodesElement.locator('.stat-number').textContent()
        const episodesCount = parseInt(episodesText || '0')
        expect(episodesCount).toBeGreaterThanOrEqual(MIN_HOST_STATS[slug].episodes)
        expect(episodesCount).toBeGreaterThan(0)
        
        // Check guests interviewed count
        const guestsElement = await page.locator('.stat-value:has-text("Guests Interviewed")').locator('..')
        const guestsText = await guestsElement.locator('.stat-number').textContent()
        const guestsCount = parseInt(guestsText || '0')
        expect(guestsCount).toBeGreaterThanOrEqual(MIN_HOST_STATS[slug].guests)
        expect(guestsCount).toBeGreaterThan(0)
      })

      test(`should not display zero statistics for host ${name}`, async ({ page }) => {
        await page.goto(`/hosts/${slug}/`)
        await page.waitForSelector('.host-stats', { timeout: 10000 })
        
        // Check that no stat shows 0
        const statNumbers = await page.locator('.stat-number').all()
        for (const statNumber of statNumbers) {
          const text = await statNumber.textContent()
          const value = parseInt(text || '0')
          expect(value).toBeGreaterThan(0)
        }
      })
    })
  })

  test.describe('Navigation Dropdown Statistics', () => {
    test('should display valid episode counts in language dropdown', async ({ page }) => {
      await page.goto('/')
      
      // Open language dropdown
      await page.click('[aria-label="Language selector"]')
      await page.waitForSelector('.language-dropdown', { timeout: 5000 })
      
      // Check each language option shows valid counts
      const languages = ['en', 'nl', 'de', 'es']
      
      for (const lang of languages) {
        const langOption = await page.locator(`.language-option[data-lang="${lang}"]`)
        const countText = await langOption.locator('.episode-count').textContent()
        const count = parseInt(countText?.match(/\d+/)?.[0] || '0')
        
        expect(count).toBeGreaterThanOrEqual(MIN_LANG_STATS[lang].episodes)
        expect(count).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Critical Failure Detection', () => {
    test('should never show "0" for main statistics', async ({ page }) => {
      // Check homepage
      await page.goto('/')
      await page.waitForSelector('[data-counter-target]', { timeout: 10000 })
      
      const heroStats = await page.locator('.hero-section [data-counter-target]').all()
      for (const stat of heroStats) {
        const text = await stat.textContent()
        expect(text).not.toBe('0')
        expect(text).not.toMatch(/^0[^0-9]/)
      }
      
      // Check a language page
      await page.goto('/en/')
      await page.waitForSelector('.stats-section', { timeout: 10000 })
      
      const langStats = await page.locator('.stats-item').all()
      for (const stat of langStats) {
        const text = await stat.textContent()
        expect(text).not.toContain(' 0 ')
        expect(text).not.toMatch(/:\s*0\s/)
      }
    })

    test('should show reasonable values for calculations', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('[data-counter-target]', { timeout: 10000 })
      
      // Get hours and episodes
      const hoursElement = await page.locator('text=Hours of Content').locator('..').locator('[data-counter-target]')
      const hoursText = await hoursElement.textContent()
      const hours = parseInt(hoursText?.replace(/[^0-9]/g, '') || '0')
      
      const episodesElement = await page.locator('text=Episodes').locator('..').locator('[data-counter-target]')
      const episodesText = await episodesElement.textContent()
      const episodes = parseInt(episodesText?.replace(/[^0-9]/g, '') || '0')
      
      // Average should be between 0.3 and 2 hours per episode
      const avgHoursPerEpisode = hours / episodes
      expect(avgHoursPerEpisode).toBeGreaterThan(0.3)
      expect(avgHoursPerEpisode).toBeLessThan(2)
    })
  })
})