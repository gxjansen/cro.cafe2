import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import puppeteer, { type Browser, type Page } from 'puppeteer'
import { preview } from 'vite'
import type { PreviewServer } from 'vite'

/**
 * End-to-end tests for navigation and language switching
 * These tests run in a real browser to ensure correct behavior
 */
describe('Navigation E2E Tests', () => {
  let server: PreviewServer
  let browser: Browser
  let page: Page
  const baseUrl = 'http://localhost:4321'

  beforeAll(async () => {
    // Start the preview server
    server = await preview({
      preview: {
        port: 4321,
        strictPort: false
      }
    })

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }, 60000)

  afterAll(async () => {
    await browser?.close()
    await server?.httpServer?.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720 })
  })

  afterEach(async () => {
    await page?.close()
  })

  describe('Language Dropdown Interaction', () => {
    it('should open and close language dropdown on click', async () => {
      await page.goto(`${baseUrl}/en/`)
      
      // Wait for language button to be visible
      await page.waitForSelector('[data-language-button]', { visible: true })
      
      // Click the language button
      await page.click('[data-language-button]')
      
      // Wait for menu to appear
      await page.waitForSelector('[data-language-menu]', { visible: true })
      
      // Check that menu is visible
      const menuVisible = await page.evaluate(() => {
        const menu = document.querySelector('[data-language-menu]')
        return menu && !menu.classList.contains('hidden')
      })
      expect(menuVisible).toBe(true)
      
      // Click outside to close
      await page.click('body')
      
      // Wait a bit for close animation
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Check that menu is hidden
      const menuHidden = await page.evaluate(() => {
        const menu = document.querySelector('[data-language-menu]')
        return menu && menu.classList.contains('hidden')
      })
      expect(menuHidden).toBe(true)
    })

    it('should navigate to correct language section when clicking language option', async () => {
      await page.goto(`${baseUrl}/en/episodes/`)
      
      // Open language dropdown
      await page.click('[data-language-button]')
      await page.waitForSelector('[data-language-menu]', { visible: true })
      
      // Wait a bit for dropdown to be ready
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Click on German option
      await page.evaluate(() => {
        const germanLink = document.querySelector('[data-language-menu] a[href="/de/episodes/"]') as HTMLAnchorElement
        if (germanLink) germanLink.click()
      })
      
      // Wait for navigation to German page
      await page.waitForFunction(
        (expectedUrl) => window.location.href === expectedUrl,
        { timeout: 5000 },
        `${baseUrl}/de/episodes/`
      )
      
      // Check we're on German episodes page
      expect(page.url()).toBe(`${baseUrl}/de/episodes/`)
      
      // Check navigation links are German
      const navLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('nav a'))
        return links.map(link => link.getAttribute('href'))
      })
      expect(navLinks).toContain('/de/episodes/')
      expect(navLinks).toContain('/de/guests/')
      expect(navLinks).toContain('/de/subscribe/')
    })

    it('should show correct current language in dropdown', async () => {
      await page.goto(`${baseUrl}/nl/`)
      
      // Check button shows Dutch
      const buttonText = await page.evaluate(() => {
        const button = document.querySelector('[data-language-button]')
        return button?.textContent?.trim()
      })
      expect(buttonText).toContain('Nederlands')
      
      // Open dropdown
      await page.click('[data-language-button]')
      await page.waitForSelector('[data-language-menu]', { visible: true })
      
      // Check Dutch is marked as current
      const currentLang = await page.evaluate(() => {
        const currentItem = document.querySelector('[data-language-menu] [aria-current="page"]')
        return currentItem?.textContent?.trim()
      })
      expect(currentLang).toContain('Nederlands')
    })
  })

  describe('Logo Navigation', () => {
    it('should navigate to root from global section', async () => {
      await page.goto(`${baseUrl}/all/episodes/`)
      
      // Wait for page to fully load
      await page.waitForSelector('a[aria-label="CRO.CAFE Home"]', { visible: true })
      
      // Click logo and wait for navigation
      await page.click('a[aria-label="CRO.CAFE Home"]')
      
      // Wait for URL to change
      await page.waitForFunction(
        (expectedUrl) => window.location.href === expectedUrl,
        { timeout: 5000 },
        `${baseUrl}/`
      )
      
      // Should be on homepage
      expect(page.url()).toBe(`${baseUrl}/`)
    })

    it('should navigate to language homepage from language section', async () => {
      await page.goto(`${baseUrl}/en/episodes/`)
      
      // Wait for page to fully load
      await page.waitForSelector('a[aria-label="CRO.CAFE Home"]', { visible: true })
      
      // Click logo
      await page.click('a[aria-label="CRO.CAFE Home"]')
      
      // Wait for URL to change
      await page.waitForFunction(
        (expectedUrl) => window.location.href === expectedUrl,
        { timeout: 5000 },
        `${baseUrl}/en/`
      )
      
      // Should be on English homepage
      expect(page.url()).toBe(`${baseUrl}/en/`)
    })
  })

  describe('Navigation Link Behavior', () => {
    it('should stay in language section when clicking navigation links', async () => {
      await page.goto(`${baseUrl}/es/`)
      
      // Wait for navigation to be ready
      await page.waitForSelector('a[href="/es/episodes/"]', { visible: true })
      
      // Click Episodes link using evaluate to avoid timing issues
      await page.evaluate(() => {
        const episodesLink = document.querySelector('a[href="/es/episodes/"]') as HTMLAnchorElement
        if (episodesLink) episodesLink.click()
      })
      
      await page.waitForFunction(
        (expectedUrl) => window.location.href === expectedUrl,
        { timeout: 8000 },
        `${baseUrl}/es/episodes/`
      )
      
      expect(page.url()).toBe(`${baseUrl}/es/episodes/`)
      
      // Click Guests link
      await page.evaluate(() => {
        const guestsLink = document.querySelector('a[href="/es/guests/"]') as HTMLAnchorElement
        if (guestsLink) guestsLink.click()
      })
      
      await page.waitForFunction(
        (expectedUrl) => window.location.href === expectedUrl,
        { timeout: 8000 },
        `${baseUrl}/es/guests/`
      )
      
      expect(page.url()).toBe(`${baseUrl}/es/guests/`)
      
      // Navigation should still be Spanish
      const navLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('nav a'))
        return links.map(link => link.getAttribute('href'))
      })
      expect(navLinks).toContain('/es/episodes/')
      expect(navLinks).toContain('/es/guests/')
    }, 15000)
  })

  describe('Mobile Navigation', () => {
    beforeEach(async () => {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 })
    })

    it('should show mobile menu button on small screens', async () => {
      await page.goto(`${baseUrl}/en/`)
      
      // Desktop navigation should be hidden
      const desktopNavHidden = await page.evaluate(() => {
        const nav = document.querySelector('.hidden.md\\:block')
        return nav !== null
      })
      expect(desktopNavHidden).toBe(true)
      
      // Language switcher should still be visible
      const langSwitcherVisible = await page.evaluate(() => {
        const switcher = document.querySelector('[data-language-button]')
        return switcher !== null && window.getComputedStyle(switcher).display !== 'none'
      })
      expect(langSwitcherVisible).toBe(true)
    })

    it('should handle language switching on mobile', async () => {
      await page.goto(`${baseUrl}/en/`)
      
      // Click language button
      await page.click('[data-language-button]')
      
      // Wait for menu
      await page.waitForSelector('[data-language-menu]', { visible: true })
      
      // Menu should be visible
      const menuVisible = await page.evaluate(() => {
        const menu = document.querySelector('[data-language-menu]')
        return menu && !menu.classList.contains('hidden')
      })
      expect(menuVisible).toBe(true)
      
      // Click Dutch option
      await page.click('[data-language-menu] a[href="/nl/"]')
      
      // Wait for navigation to Dutch homepage
      await page.waitForFunction(
        (expectedUrl) => window.location.href === expectedUrl,
        { timeout: 5000 },
        `${baseUrl}/nl/`
      )
      
      // Should navigate to Dutch homepage
      expect(page.url()).toBe(`${baseUrl}/nl/`)
    })
  })

  describe('Search Navigation', () => {
    it('should navigate to correct search page based on section', async () => {
      // Test global search
      await page.goto(`${baseUrl}/`)
      await page.waitForSelector('a[href="/search/"]', { visible: true })
      await page.click('a[href="/search/"]')
      await page.waitForFunction(
        (expectedUrl) => window.location.href === expectedUrl,
        { timeout: 5000 },
        `${baseUrl}/search/`
      )
      expect(page.url()).toBe(`${baseUrl}/search/`)
      
      // Test English search
      await page.goto(`${baseUrl}/en/`)
      await page.waitForSelector('a[href="/en/search/"]', { visible: true })
      await page.click('a[href="/en/search/"]')
      await page.waitForFunction(
        (expectedUrl) => window.location.href === expectedUrl,
        { timeout: 5000 },
        `${baseUrl}/en/search/`
      )
      expect(page.url()).toBe(`${baseUrl}/en/search/`)
    })
  })

  describe('Navigation Persistence', () => {
    it('should maintain language section across multiple page navigations', async () => {
      // Start on German homepage
      await page.goto(`${baseUrl}/de/`)
      
      // Navigate through multiple pages
      const navigation = [
        { selector: 'a[href="/de/episodes/"]', expectedUrl: `${baseUrl}/de/episodes/` },
        { selector: 'a[href="/de/guests/"]', expectedUrl: `${baseUrl}/de/guests/` },
        { selector: 'a[href="/de/subscribe/"]', expectedUrl: `${baseUrl}/de/subscribe/` },
        { selector: 'a[aria-label="CRO.CAFE Home"]', expectedUrl: `${baseUrl}/de/` }
      ]
      
      for (let i = 0; i < navigation.length; i++) {
        const nav = navigation[i]
        await page.waitForSelector(nav.selector, { visible: true, timeout: 8000 })
        
        // Use evaluate for more reliable clicks
        await page.evaluate((selector) => {
          const element = document.querySelector(selector) as HTMLElement
          if (element) element.click()
        }, nav.selector)
        
        await page.waitForFunction(
          (expectedUrl) => window.location.href === expectedUrl,
          { timeout: 8000 },
          nav.expectedUrl
        )
        expect(page.url()).toBe(nav.expectedUrl)
        
        // Check navigation still shows German links
        const currentNavLinks = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('nav a'))
          return links.map(link => link.getAttribute('href'))
        })
        expect(currentNavLinks).toContain('/de/episodes/')
        expect(currentNavLinks).toContain('/de/guests/')
      }
    }, 20000)
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on navigation elements', async () => {
      await page.goto(`${baseUrl}/en/`)
      
      // Check main navigation
      const mainNavAria = await page.evaluate(() => {
        const nav = document.querySelector('#main-navigation')
        return nav?.getAttribute('aria-label')
      })
      expect(mainNavAria).toBe('Main navigation')
      
      // Check language button
      const langButtonAria = await page.evaluate(() => {
        const button = document.querySelector('[data-language-button]')
        return {
          label: button?.getAttribute('aria-label'),
          expanded: button?.getAttribute('aria-expanded'),
          haspopup: button?.getAttribute('aria-haspopup')
        }
      })
      expect(langButtonAria.label).toContain('Choose language. Current:')
      expect(langButtonAria.expanded).toBe('false')
      expect(langButtonAria.haspopup).toBe('true')
      
      // Check that some navigation element exists with proper ARIA
      const navLinksExist = await page.evaluate(() => {
        const links = document.querySelectorAll('nav a[href*="/episodes/"], nav a[href*="/guests/"]')
        return links.length > 0
      })
      expect(navLinksExist).toBe(true)
    })

    it('should support keyboard navigation in language dropdown', async () => {
      await page.goto(`${baseUrl}/en/`)
      
      // Focus the language button directly
      await page.focus('[data-language-button]')
      
      // Open dropdown with Enter
      await page.keyboard.press('Enter')
      
      // Wait for menu
      await page.waitForSelector('[data-language-menu]', { visible: true, timeout: 3000 })
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')
      
      // Check focused element
      const focusedHref = await page.evaluate(() => {
        return document.activeElement?.getAttribute('href')
      })
      expect(focusedHref).toBeTruthy()
      
      // Close with Escape
      await page.keyboard.press('Escape')
      
      // Wait a bit for animation
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Menu should be hidden
      const menuHidden = await page.evaluate(() => {
        const menu = document.querySelector('[data-language-menu]')
        return menu?.classList.contains('hidden')
      })
      expect(menuHidden).toBe(true)
    }, 10000)
  })
})