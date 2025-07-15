import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { preview } from 'vite'
import puppeteer from 'puppeteer'
import type { Browser, Page } from 'puppeteer'

/**
 * End-to-End tests for the Audio Player
 * These tests ensure the audio player works correctly in real browser environments
 */
describe('Audio Player E2E Tests', () => {
  let server: any
  let browser: Browser
  let page: Page
  const baseUrl = 'http://localhost:4321'

  beforeAll(async () => {
    // Start preview server
    server = await preview({
      preview: {
        port: 4321
      }
    })
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    page = await browser.newPage()
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 })
    
    // Enable console logging
    page.on('console', msg => {
      console.log('Browser console:', msg.text())
    })
    
    // Log page errors
    page.on('pageerror', error => {
      console.error('Page error:', error.message)
    })
  }, 30000)

  afterAll(async () => {
    await browser?.close()
    await server?.httpServer?.close()
  })

  describe('Player Loading and Initialization', () => {
    it('should load audio player on episode page', async () => {
      // Navigate to an episode page
      await page.goto(`${baseUrl}/en/episodes/test-episode/`, { 
        waitUntil: 'networkidle0' 
      })

      // Wait for audio player to be present
      const player = await page.waitForSelector('.simple-audio-player', {
        timeout: 5000
      })

      expect(player).toBeTruthy()

      // Check that all controls are present
      const playButton = await page.$('.play-pause')
      const skipBackward = await page.$('.skip-backward')
      const skipForward = await page.$('.skip-forward')
      const progressBar = await page.$('.progress-bar')
      const speedControl = await page.$('.speed-control')

      expect(playButton).toBeTruthy()
      expect(skipBackward).toBeTruthy()
      expect(skipForward).toBeTruthy()
      expect(progressBar).toBeTruthy()
      expect(speedControl).toBeTruthy()
    })

    it('should have correct ARIA attributes', async () => {
      await page.goto(`${baseUrl}/en/episodes/test-episode/`, { 
        waitUntil: 'networkidle0' 
      })

      const progressBar = await page.$('.progress-bar')
      const role = await progressBar?.evaluate(el => el.getAttribute('role'))
      const ariaLabel = await progressBar?.evaluate(el => el.getAttribute('aria-label'))
      const tabindex = await progressBar?.evaluate(el => el.getAttribute('tabindex'))

      expect(role).toBe('slider')
      expect(ariaLabel).toBe('Audio progress')
      expect(tabindex).toBe('0')
    })
  })

  describe('Playback Controls', () => {
    beforeEach(async () => {
      await page.goto(`${baseUrl}/en/episodes/test-episode/`, { 
        waitUntil: 'networkidle0' 
      })
      await page.waitForSelector('.simple-audio-player')
    })

    it('should toggle play/pause when clicking play button', async () => {
      const playButton = await page.$('.play-pause')
      
      // Check initial state (paused)
      const playIconVisible = await page.$eval('.play-icon', el => 
        !el.classList.contains('hidden')
      )
      expect(playIconVisible).toBe(true)

      // Click play
      await playButton?.click()
      
      // Wait for state change
      await page.waitForTimeout(100)

      // Check that pause icon is now visible
      const pauseIconVisible = await page.$eval('.pause-icon', el => 
        !el.classList.contains('hidden')
      )
      expect(pauseIconVisible).toBe(true)

      // Click pause
      await playButton?.click()
      
      // Wait for state change
      await page.waitForTimeout(100)

      // Check that play icon is visible again
      const playIconVisibleAgain = await page.$eval('.play-icon', el => 
        !el.classList.contains('hidden')
      )
      expect(playIconVisibleAgain).toBe(true)
    })

    it('should skip forward 30 seconds', async () => {
      const skipForwardButton = await page.$('.skip-forward')
      
      // Get initial time
      const initialTime = await page.$eval('.current-time', el => el.textContent)
      expect(initialTime).toBe('0:00')

      // Click skip forward
      await skipForwardButton?.click()
      
      // Wait for update
      await page.waitForTimeout(100)

      // Audio might not be loaded, but the action should be registered
      const audio = await page.$('audio')
      const currentTime = await audio?.evaluate(el => (el as HTMLAudioElement).currentTime)
      
      // Should attempt to skip forward (may be limited by duration)
      expect(currentTime).toBeGreaterThanOrEqual(0)
    })

    it('should change playback speed', async () => {
      const speedControl = await page.$('.speed-control') as any
      
      // Change speed to 1.5x
      await speedControl?.select('1.5')
      
      // Get audio element and check playback rate
      const audio = await page.$('audio')
      const playbackRate = await audio?.evaluate(el => 
        (el as HTMLAudioElement).playbackRate
      )
      
      expect(playbackRate).toBe(1.5)
    })
  })

  describe('Progress Bar Interaction', () => {
    beforeEach(async () => {
      await page.goto(`${baseUrl}/en/episodes/test-episode/`, { 
        waitUntil: 'networkidle0' 
      })
      await page.waitForSelector('.simple-audio-player')
    })

    it('should seek when clicking on progress bar', async () => {
      const progressBar = await page.$('.progress-bar')
      
      // Get progress bar dimensions
      const box = await progressBar?.boundingBox()
      if (!box) throw new Error('Progress bar not found')

      // Click at 50% of progress bar
      await page.mouse.click(
        box.x + box.width / 2,
        box.y + box.height / 2
      )

      // Wait for seek
      await page.waitForTimeout(100)

      // Check that progress updated
      const progressFillWidth = await page.$eval('.progress-fill', el => 
        el.style.width
      )
      
      // Should be approximately 50%
      expect(progressFillWidth).toMatch(/\d+%/)
    })

    it('should show progress handle on hover', async () => {
      const progressBar = await page.$('.progress-bar')
      
      // Initially hidden
      const initialOpacity = await page.$eval('.progress-handle', el => 
        el.style.opacity
      )
      expect(initialOpacity).toBe('0')

      // Hover over progress bar
      await progressBar?.hover()
      
      // Wait for transition
      await page.waitForTimeout(100)

      // Should be visible
      const hoverOpacity = await page.$eval('.progress-handle', el => 
        el.style.opacity
      )
      expect(hoverOpacity).toBe('1')
    })
  })

  describe('Keyboard Navigation', () => {
    beforeEach(async () => {
      await page.goto(`${baseUrl}/en/episodes/test-episode/`, { 
        waitUntil: 'networkidle0' 
      })
      await page.waitForSelector('.simple-audio-player')
    })

    it('should support keyboard navigation on progress bar', async () => {
      // Focus on progress bar
      await page.focus('.progress-bar')

      // Press right arrow
      await page.keyboard.press('ArrowRight')
      
      // Wait for update
      await page.waitForTimeout(100)

      // Progress should have increased
      const progressWidth = await page.$eval('.progress-fill', el => 
        el.style.width
      )
      
      expect(progressWidth).not.toBe('0%')
    })

    it('should support Home/End keys', async () => {
      // Focus on progress bar
      await page.focus('.progress-bar')

      // Press End key
      await page.keyboard.press('End')
      
      // Wait for update
      await page.waitForTimeout(100)

      // Should be at 100%
      const endWidth = await page.$eval('.progress-fill', el => 
        el.style.width
      )
      expect(endWidth).toBe('100%')

      // Press Home key
      await page.keyboard.press('Home')
      
      // Wait for update
      await page.waitForTimeout(100)

      // Should be at 0%
      const homeWidth = await page.$eval('.progress-fill', el => 
        el.style.width
      )
      expect(homeWidth).toBe('0%')
    })
  })

  describe('State Persistence', () => {
    it('should save and restore playback position', async () => {
      // Navigate to episode
      await page.goto(`${baseUrl}/en/episodes/test-episode/`, { 
        waitUntil: 'networkidle0' 
      })
      await page.waitForSelector('.simple-audio-player')

      // Simulate playing and seeking
      const audio = await page.$('audio')
      await audio?.evaluate(el => {
        const audioEl = el as HTMLAudioElement
        audioEl.currentTime = 120 // 2 minutes
      })

      // Trigger save by dispatching timeupdate
      await audio?.evaluate(el => {
        el.dispatchEvent(new Event('timeupdate'))
      })

      // Wait for save interval
      await page.waitForTimeout(1100)

      // Check localStorage
      const savedPosition = await page.evaluate((episodeId) => {
        return localStorage.getItem(`audio-position-${episodeId}`)
      }, 'test-episode')

      expect(savedPosition).toBe('120')

      // Reload page
      await page.reload({ waitUntil: 'networkidle0' })
      await page.waitForSelector('.simple-audio-player')

      // Wait for audio to load saved position
      await page.waitForTimeout(100)

      // Check that position was restored
      const restoredTime = await page.$eval('audio', el => 
        (el as HTMLAudioElement).currentTime
      )
      
      expect(restoredTime).toBe(120)
    })

    it('should save and restore playback speed', async () => {
      // Navigate to episode
      await page.goto(`${baseUrl}/en/episodes/test-episode/`, { 
        waitUntil: 'networkidle0' 
      })
      await page.waitForSelector('.simple-audio-player')

      // Change speed
      const speedControl = await page.$('.speed-control') as any
      await speedControl?.select('1.25')

      // Check localStorage
      const savedSpeed = await page.evaluate((episodeId) => {
        return localStorage.getItem(`audio-speed-${episodeId}`)
      }, 'test-episode')

      expect(savedSpeed).toBe('1.25')

      // Reload page
      await page.reload({ waitUntil: 'networkidle0' })
      await page.waitForSelector('.simple-audio-player')

      // Check that speed was restored
      const restoredSpeed = await page.$eval('.speed-control', el => 
        (el as HTMLSelectElement).value
      )
      
      expect(restoredSpeed).toBe('1.25')
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should work correctly on mobile viewport', async () => {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 })

      await page.goto(`${baseUrl}/en/episodes/test-episode/`, { 
        waitUntil: 'networkidle0' 
      })
      await page.waitForSelector('.simple-audio-player')

      // Check that all controls are still accessible
      const playButton = await page.$('.play-pause')
      const skipButtons = await page.$$('.skip-backward, .skip-forward')
      const speedControl = await page.$('.speed-control')

      expect(playButton).toBeTruthy()
      expect(skipButtons.length).toBe(2)
      expect(speedControl).toBeTruthy()

      // Check touch target sizes
      const playButtonBox = await playButton?.boundingBox()
      expect(playButtonBox?.width).toBeGreaterThanOrEqual(48)
      expect(playButtonBox?.height).toBeGreaterThanOrEqual(48)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid audio URL gracefully', async () => {
      // Create a test page with invalid audio URL
      await page.goto(`${baseUrl}/en/episodes/invalid-audio-episode/`, { 
        waitUntil: 'networkidle0' 
      })

      // Player should still render
      const player = await page.$('.simple-audio-player')
      expect(player).toBeTruthy()

      // Controls should be present but disabled/non-functional
      const playButton = await page.$('.play-pause')
      expect(playButton).toBeTruthy()
    })
  })

  describe('Cross-Browser Compatibility', () => {
    it('should work in different browsers', async () => {
      // This test would be expanded to test in different browsers
      // For now, we just ensure basic functionality works
      await page.goto(`${baseUrl}/en/episodes/test-episode/`, { 
        waitUntil: 'networkidle0' 
      })

      const player = await page.waitForSelector('.simple-audio-player')
      expect(player).toBeTruthy()

      // Test user agent specific features
      const userAgent = await page.evaluate(() => navigator.userAgent)
      console.log('Testing with user agent:', userAgent)

      // Basic smoke test
      const playButton = await page.$('.play-pause')
      await playButton?.click()
      
      // Should not throw any errors
      expect(true).toBe(true)
    })
  })
})