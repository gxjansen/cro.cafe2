import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { preview } from 'vite'
import type { PreviewServer } from 'vite'

/**
 * Integration test for the audio player with real episode data
 * This ensures the audio player works correctly in production
 */
describe('Audio Player Integration with Real Data', () => {
  let server: PreviewServer
  const baseUrl = 'http://localhost:4321'
  
  beforeAll(async () => {
    // Use the built site from dist folder
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

  describe('Real Episode Audio Player', () => {
    it('should render audio player with correct data on real episode page', async () => {
      const response = await fetch(`${baseUrl}/en/episodes/unleash-your-primal-brain-with-tim-ash/`)
      expect(response.ok).toBe(true)
      
      const html = await response.text()
      
      // Check that the page loaded successfully
      expect(html).toContain('Unleash Your Primal Brain')
      expect(html).toContain('Tim Ash')
      
      // Check audio player is present
      expect(html).toContain('simple-audio-player')
      expect(html).toContain('data-episode-id=')
      
      // Check audio source
      expect(html).toContain('<source src="https://media.transistor.fm/282f1c22/5144faa6.mp3"')
      expect(html).toContain('type="audio/mpeg"')
      
      // Check duration display
      expect(html).toContain('<span class="duration"')
      expect(html).toContain('55:03') // Episode duration
      
      // Check all controls are present
      expect(html).toContain('class="play-pause')
      expect(html).toContain('class="skip-backward')
      expect(html).toContain('class="skip-forward')
      expect(html).toContain('class="progress-bar')
      expect(html).toContain('class="speed-control')
      
      // Check accessibility attributes
      expect(html).toContain('role="slider"')
      expect(html).toContain('aria-label="Audio progress"')
      expect(html).toContain('aria-valuemin="0"')
      expect(html).toContain('aria-valuemax="100"')
      expect(html).toContain('title="Play/Pause"')
      expect(html).toContain('title="Skip backward 15 seconds"')
      expect(html).toContain('title="Skip forward 30 seconds"')
      expect(html).toContain('title="Playback speed"')
      
      // Check touch targets
      expect(html).toContain('touch-target')
      expect(html).toContain('min-w-[48px]')
      expect(html).toContain('min-h-[48px]')
    })

    it('should have valid audio URLs for multiple episodes', async () => {
      // Test a few different episodes to ensure consistency
      const episodes = [
        '/en/episodes/unleash-your-primal-brain-with-tim-ash/',
        '/en/episodes/why-humanizing-data-is-so-important-with-eltine-van-der-veer/',
        '/en/episodes/optimizing-the-user-experience-for-an-art-shop-marketplace/'
      ]
      
      for (const episodeUrl of episodes) {
        const response = await fetch(`${baseUrl}${episodeUrl}`)
        expect(response.ok).toBe(true)
        
        const html = await response.text()
        
        // Check audio player exists
        expect(html).toContain('simple-audio-player')
        
        // Check audio source is a valid transistor.fm URL
        const sourceMatch = html.match(/<source src="(https:\/\/media\.transistor\.fm\/[^"]+)"/)
        expect(sourceMatch).toBeTruthy()
        expect(sourceMatch?.[1]).toMatch(/^https:\/\/media\.transistor\.fm\//)
        
        // Check duration is present (format: MM:SS or M:SS)
        expect(html).toMatch(/<span class="duration"[^>]*>\d{1,2}:\d{2}<\/span>/)
      }
    })

    it('should include audio player JavaScript', async () => {
      const response = await fetch(`${baseUrl}/en/episodes/unleash-your-primal-brain-with-tim-ash/`)
      const html = await response.text()
      
      // Check that the audio player script is included
      expect(html).toContain('SimpleAudioPlayer.astro_astro_type_script_index_0_lang')
      expect(html).toContain('<script type="module" src="/_astro/SimpleAudioPlayer')
    })

    it('should have proper HTML structure for player controls', async () => {
      const response = await fetch(`${baseUrl}/en/episodes/unleash-your-primal-brain-with-tim-ash/`)
      const html = await response.text()
      
      // Extract the audio player section
      const playerMatch = html.match(/<div class="simple-audio-player"[^>]*>([\s\S]*?)<script type="module"/)
      expect(playerMatch).toBeTruthy()
      
      const playerHtml = playerMatch?.[1] || ''
      
      // Check nested structure
      expect(playerHtml).toContain('<audio')
      expect(playerHtml).toContain('</audio>')
      expect(playerHtml).toContain('<div class="player-controls')
      expect(playerHtml).toContain('<div class="progress-bar')
      expect(playerHtml).toContain('<button class="play-pause')
      expect(playerHtml).toContain('<select class="speed-control')
      
      // Check SVG icons are present
      expect(playerHtml).toContain('<svg class="play-icon')
      expect(playerHtml).toContain('<svg class="pause-icon')
      expect(playerHtml).toContain('</svg>')
    })
  })

  describe('Audio Player Fallback', () => {
    it('should handle episodes without audio gracefully', async () => {
      // Test with the 404 page which shouldn't have an audio player
      const response = await fetch(`${baseUrl}/404`)
      expect(response.ok).toBe(true)
      
      const html = await response.text()
      
      // Should not contain audio player
      expect(html).not.toContain('simple-audio-player')
      expect(html).not.toContain('<audio')
    })
  })

  describe('Language Support', () => {
    it('should render audio player correctly for different language episodes', async () => {
      // Test Dutch episode if it exists
      const response = await fetch(`${baseUrl}/nl/episodes/`)
      
      if (response.ok) {
        const html = await response.text()
        
        // If there are Dutch episodes, they should also have proper audio players
        if (html.includes('data-episode-id')) {
          expect(html).toContain('simple-audio-player')
          expect(html).toContain('class="play-pause')
        }
      }
    })
  })
})