import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { preview } from 'vite'
import type { PreviewServer } from 'vite'

/**
 * Navigation and Language Switching Tests
 * 
 * These tests ensure that:
 * 1. Users stay within their current language section when navigating
 * 2. The logo links to the correct homepage based on current section
 * 3. Language dropdown correctly switches between sections
 * 4. Navigation persistence works across page changes
 */
describe('Navigation and Language Switching', () => {
  let server: PreviewServer
  const baseUrl = 'http://localhost:4321'
  
  beforeAll(async () => {
    server = await preview({
      preview: {
        port: 4321,
        strictPort: false
      }
    })
  }, 30000)

  afterAll(async () => {
    await server?.httpServer?.close()
  })

  describe('Global Section Navigation', () => {
    it('should stay in global section when navigating from homepage', async () => {
      const response = await fetch(`${baseUrl}/`)
      const html = await response.text()
      
      // Check navigation links point to global versions
      expect(html).toContain('href="/all/episodes/"')
      expect(html).toContain('href="/all/guests/"')
      expect(html).toContain('href="/subscribe/"')
      
      // Check logo links to root
      expect(html).toMatch(/<a[^>]*href="\/"[^>]*aria-label="CRO\.CAFE Home"/)
    })

    it('should stay in global section when on /all/episodes/', async () => {
      const response = await fetch(`${baseUrl}/all/episodes/`)
      const html = await response.text()
      
      // Navigation should remain global
      expect(html).toContain('href="/all/episodes/"')
      expect(html).toContain('href="/all/guests/"')
      expect(html).toContain('href="/subscribe/"')
      
      // Logo should link to homepage
      expect(html).toMatch(/<a[^>]*href="\/"[^>]*aria-label="CRO\.CAFE Home"/)
      
      // Language switcher should show "All Languages" as current
      expect(html).toContain('Choose language. Current: All Languages')
    })

    it('should stay in global section when on /all/guests/', async () => {
      const response = await fetch(`${baseUrl}/all/guests/`)
      const html = await response.text()
      
      // Navigation should remain global
      expect(html).toContain('href="/all/episodes/"')
      expect(html).toContain('href="/all/guests/"')
      expect(html).toContain('href="/subscribe/"')
      
      // Logo should link to homepage
      expect(html).toMatch(/<a[^>]*href="\/"[^>]*aria-label="CRO\.CAFE Home"/)
    })

    it('should stay in global section when on /subscribe/', async () => {
      const response = await fetch(`${baseUrl}/subscribe/`)
      const html = await response.text()
      
      // Navigation should remain global
      expect(html).toContain('href="/all/episodes/"')
      expect(html).toContain('href="/all/guests/"')
      expect(html).toContain('href="/subscribe/"')
      
      // Logo should link to homepage
      expect(html).toMatch(/<a[^>]*href="\/"[^>]*aria-label="CRO\.CAFE Home"/)
    })

    it('should NOT redirect /subscribe/ to /en/subscribe/', async () => {
      const response = await fetch(`${baseUrl}/subscribe/`, { redirect: 'manual' })
      
      // Should return 200 OK, not a redirect
      expect(response.status).toBe(200)
      
      // Check that we're not being redirected
      expect(response.headers.get('location')).toBeNull()
    })

    it('should keep subscribe link as /subscribe/ when on homepage', async () => {
      const response = await fetch(`${baseUrl}/`)
      const html = await response.text()
      
      // Check that subscribe link in navigation is /subscribe/, not /en/subscribe/
      expect(html).toContain('href="/subscribe/"')
      expect(html).not.toContain('href="/en/subscribe/"')
      
      // Use a more specific regex to ensure we're checking the navigation link
      const navLinkMatch = html.match(/<a[^>]*href="([^"]*)"[^>]*>\s*Subscribe\s*<\/a>/i)
      expect(navLinkMatch).toBeTruthy()
      expect(navLinkMatch![1]).toBe('/subscribe/')
    })
    
    it('should have correct Accept-Language handling', async () => {
      // Test with English Accept-Language header
      const responseEn = await fetch(`${baseUrl}/subscribe/`, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9'
        },
        redirect: 'manual'
      })
      
      // Should still return 200 OK and not redirect based on language
      expect(responseEn.status).toBe(200)
      expect(responseEn.headers.get('location')).toBeNull()
      
      // Test with other languages
      const responseNl = await fetch(`${baseUrl}/subscribe/`, {
        headers: {
          'Accept-Language': 'nl-NL,nl;q=0.9'
        },
        redirect: 'manual'
      })
      
      expect(responseNl.status).toBe(200)
      expect(responseNl.headers.get('location')).toBeNull()
    })
    
    it('should follow proper link behavior when clicking subscribe from homepage', async () => {
      // Simulate what happens when a user clicks the subscribe link
      const homepageResponse = await fetch(`${baseUrl}/`)
      const homepageHtml = await homepageResponse.text()
      
      // Extract the subscribe link href
      const subscribeLinkMatch = homepageHtml.match(/<a[^>]*href="([^"]*)"[^>]*>\s*Subscribe\s*<\/a>/i)
      expect(subscribeLinkMatch).toBeTruthy()
      const subscribeHref = subscribeLinkMatch![1]
      
      // The href should be /subscribe/
      expect(subscribeHref).toBe('/subscribe/')
      
      // Now follow that link
      const subscribeResponse = await fetch(`${baseUrl}${subscribeHref}`, {
        headers: {
          'Referer': `${baseUrl}/`
        },
        redirect: 'manual'
      })
      
      // Should return 200 OK with no redirect
      expect(subscribeResponse.status).toBe(200)
      expect(subscribeResponse.headers.get('location')).toBeNull()
      
      // Verify we're on the global subscribe page
      const subscribeHtml = await subscribeResponse.text()
      expect(subscribeHtml).toContain('Choose Your Language')
      expect(subscribeHtml).toContain('Subscribe to CRO.CAFE')
    })
  })

  describe('English Section Navigation', () => {
    it('should stay in English section when navigating from English homepage', async () => {
      const response = await fetch(`${baseUrl}/en/`)
      const html = await response.text()
      
      // Check navigation links point to English versions
      expect(html).toContain('href="/en/episodes/"')
      expect(html).toContain('href="/en/guests/"')
      expect(html).toContain('href="/en/subscribe/"')
      
      // Check logo links to English homepage
      expect(html).toMatch(/<a[^>]*href="\/en\/"[^>]*aria-label="CRO\.CAFE Home"/)
      
      // Language switcher should show "English" as current
      expect(html).toContain('Choose language. Current: English')
    })

    it('should stay in English section when on /en/episodes/', async () => {
      const response = await fetch(`${baseUrl}/en/episodes/`)
      const html = await response.text()
      
      // Navigation should remain English
      expect(html).toContain('href="/en/episodes/"')
      expect(html).toContain('href="/en/guests/"')
      expect(html).toContain('href="/en/subscribe/"')
      
      // Logo should link to English homepage
      expect(html).toMatch(/<a[^>]*href="\/en\/"[^>]*aria-label="CRO\.CAFE Home"/)
    })

    it('should stay in English section when on English episode detail page', async () => {
      const response = await fetch(`${baseUrl}/en/episodes/unleash-your-primal-brain-with-tim-ash/`)
      const html = await response.text()
      
      // Navigation should remain English
      expect(html).toContain('href="/en/episodes/"')
      expect(html).toContain('href="/en/guests/"')
      expect(html).toContain('href="/en/subscribe/"')
      
      // Logo should link to English homepage
      expect(html).toMatch(/<a[^>]*href="\/en\/"[^>]*aria-label="CRO\.CAFE Home"/)
    })
  })

  describe('German Section Navigation', () => {
    it('should stay in German section when navigating from German homepage', async () => {
      const response = await fetch(`${baseUrl}/de/`)
      const html = await response.text()
      
      // Check navigation links point to German versions
      expect(html).toContain('href="/de/episodes/"')
      expect(html).toContain('href="/de/guests/"')
      expect(html).toContain('href="/de/subscribe/"')
      
      // Check logo links to German homepage
      expect(html).toMatch(/<a[^>]*href="\/de\/"[^>]*aria-label="CRO\.CAFE Home"/)
      
      // Language switcher should show "Deutsch" as current
      expect(html).toContain('Choose language. Current: Deutsch')
      
      // Navigation labels should be in German
      expect(html).toContain('Folgen') // Episodes
      expect(html).toContain('Gäste') // Guests
      expect(html).toContain('Abonnieren') // Subscribe
    })

    it('should stay in German section when on /de/episodes/', async () => {
      const response = await fetch(`${baseUrl}/de/episodes/`)
      const html = await response.text()
      
      // Navigation should remain German
      expect(html).toContain('href="/de/episodes/"')
      expect(html).toContain('href="/de/guests/"')
      expect(html).toContain('href="/de/subscribe/"')
      
      // Logo should link to German homepage
      expect(html).toMatch(/<a[^>]*href="\/de\/"[^>]*aria-label="CRO\.CAFE Home"/)
    })
  })

  describe('Spanish Section Navigation', () => {
    it('should stay in Spanish section when navigating from Spanish homepage', async () => {
      const response = await fetch(`${baseUrl}/es/`)
      const html = await response.text()
      
      // Check navigation links point to Spanish versions
      expect(html).toContain('href="/es/episodes/"')
      expect(html).toContain('href="/es/guests/"')
      expect(html).toContain('href="/es/subscribe/"')
      
      // Check logo links to Spanish homepage
      expect(html).toMatch(/<a[^>]*href="\/es\/"[^>]*aria-label="CRO\.CAFE Home"/)
      
      // Language switcher should show "Español" as current
      expect(html).toContain('Choose language. Current: Español')
      
      // Navigation labels should be in Spanish
      expect(html).toContain('Episodios') // Episodes
      expect(html).toContain('Invitados') // Guests
      expect(html).toContain('Suscríbete') // Subscribe
    })
  })

  describe('Dutch Section Navigation', () => {
    it('should stay in Dutch section when navigating from Dutch homepage', async () => {
      const response = await fetch(`${baseUrl}/nl/`)
      const html = await response.text()
      
      // Check navigation links point to Dutch versions
      expect(html).toContain('href="/nl/episodes/"')
      expect(html).toContain('href="/nl/guests/"')
      expect(html).toContain('href="/nl/subscribe/"')
      
      // Check logo links to Dutch homepage
      expect(html).toMatch(/<a[^>]*href="\/nl\/"[^>]*aria-label="CRO\.CAFE Home"/)
      
      // Language switcher should show "Nederlands" as current
      expect(html).toContain('Choose language. Current: Nederlands')
      
      // Navigation labels should be in Dutch
      expect(html).toContain('Afleveringen') // Episodes
      expect(html).toContain('Gasten') // Guests
      expect(html).toContain('Abonneren') // Subscribe
    })
  })

  describe('Language Dropdown URLs', () => {
    it('should generate correct URLs in language dropdown from global section', async () => {
      const response = await fetch(`${baseUrl}/all/episodes/`)
      const html = await response.text()
      
      // Check language dropdown links
      expect(html).toContain('href="/all/episodes/"') // Global
      expect(html).toContain('href="/en/episodes/"') // English
      expect(html).toContain('href="/nl/episodes/"') // Dutch
      expect(html).toContain('href="/de/episodes/"') // German
      expect(html).toContain('href="/es/episodes/"') // Spanish
    })

    it('should generate correct URLs in language dropdown from English section', async () => {
      const response = await fetch(`${baseUrl}/en/episodes/`)
      const html = await response.text()
      
      // Check language dropdown links
      expect(html).toContain('href="/all/episodes/"') // Global
      expect(html).toContain('href="/en/episodes/"') // English (current)
      expect(html).toContain('href="/nl/episodes/"') // Dutch
      expect(html).toContain('href="/de/episodes/"') // German
      expect(html).toContain('href="/es/episodes/"') // Spanish
    })

    it('should redirect to listing pages when switching language from detail page', async () => {
      const response = await fetch(`${baseUrl}/en/episodes/unleash-your-primal-brain-with-tim-ash/`)
      const html = await response.text()
      
      // When on an episode detail page, language switcher should link to listing pages
      expect(html).toContain('href="/all/episodes/"') // Global episodes list
      expect(html).toContain('href="/de/episodes/"') // German episodes list
      expect(html).toContain('href="/nl/episodes/"') // Dutch episodes list
      expect(html).toContain('href="/es/episodes/"') // Spanish episodes list
    })
  })

  describe('Search Navigation', () => {
    it('should navigate to correct search page based on current section', async () => {
      // Global section
      const globalResponse = await fetch(`${baseUrl}/`)
      const globalHtml = await globalResponse.text()
      expect(globalHtml).toContain('href="/search/"')
      
      // English section
      const enResponse = await fetch(`${baseUrl}/en/`)
      const enHtml = await enResponse.text()
      expect(enHtml).toContain('href="/en/search/"')
    })
  })

  describe('Mobile Navigation', () => {
    it('should have same navigation rules for mobile menu', async () => {
      const response = await fetch(`${baseUrl}/en/`)
      const html = await response.text()
      
      // Mobile menu should have same English links
      const mobileMenuMatch = html.match(/<nav[^>]*id="mobile-menu"[^>]*>([\s\S]*?)<\/nav>/)
      if (mobileMenuMatch) {
        const mobileMenuHtml = mobileMenuMatch[1]
        expect(mobileMenuHtml).toContain('href="/en/episodes/"')
        expect(mobileMenuHtml).toContain('href="/en/guests/"')
        expect(mobileMenuHtml).toContain('href="/en/subscribe/"')
      }
    })
  })

  describe('Navigation Consistency', () => {
    it('should maintain section when navigating between pages', async () => {
      // Start on German homepage
      let response = await fetch(`${baseUrl}/de/`)
      let html = await response.text()
      expect(html).toContain('href="/de/episodes/"')
      
      // Navigate to German episodes
      response = await fetch(`${baseUrl}/de/episodes/`)
      html = await response.text()
      expect(html).toContain('href="/de/episodes/"')
      expect(html).toContain('href="/de/guests/"')
      expect(html).toMatch(/<a[^>]*href="\/de\/"[^>]*aria-label="CRO\.CAFE Home"/)
      
      // Navigate to German guests
      response = await fetch(`${baseUrl}/de/guests/`)
      html = await response.text()
      expect(html).toContain('href="/de/episodes/"')
      expect(html).toContain('href="/de/guests/"')
      expect(html).toMatch(/<a[^>]*href="\/de\/"[^>]*aria-label="CRO\.CAFE Home"/)
    })
  })
})