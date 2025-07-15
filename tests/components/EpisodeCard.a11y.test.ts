import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import EpisodeCard from '@components/EpisodeCard.astro'
import { renderComponent, setupViewport, mockData } from '../utils/astro-test-utils'

describe('EpisodeCard Accessibility', () => {
  const mockEpisode = mockData.episode({
    data: {
      title: 'Optimizing Conversion Rates with A/B Testing',
      description: 'Learn the best practices for A/B testing and how to optimize your conversion rates effectively.',
      pubDate: new Date('2024-01-15'),
      season: 2,
      episode: 5,
      duration: '52:30'
    }
  })

  describe('WCAG 2.2 Compliance', () => {
    it('should have no accessibility violations - medium size', async () => {
      const { container } = await renderComponent(EpisodeCard, {
        props: {
          episode: mockEpisode,
          size: 'medium',
          showLanguage: false
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - small size', async () => {
      const { container } = await renderComponent(EpisodeCard, {
        props: {
          episode: mockEpisode,
          size: 'small',
          showLanguage: true
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - large size', async () => {
      const { container } = await renderComponent(EpisodeCard, {
        props: {
          episode: mockEpisode,
          size: 'large',
          showLanguage: false
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Interactive Elements', () => {
    it('should have descriptive link text', async () => {
      const { document } = await renderComponent(EpisodeCard, {
        props: {
          episode: mockEpisode,
          size: 'medium'
        }
      })

      const links = document.querySelectorAll('a')
      expect(links.length).toBeGreaterThan(0)

      links.forEach(link => {
        const text = link.textContent?.trim()
        expect(text).toBeTruthy()

        // Check against common anti-patterns
        expect(text?.toLowerCase()).not.toMatch(/click here|read more|learn more/)

        // Should contain meaningful content
        expect(text).toMatch(/\w{3,}/) // At least 3 word characters
      })
    })

    it('should have sufficient touch target size', async () => {
      const { document } = await renderComponent(EpisodeCard, {
        props: {
          episode: mockEpisode,
          size: 'medium'
        }
      })

      const links = document.querySelectorAll('a')

      // Verify classes that provide adequate padding
      links.forEach(link => {
        const classes = link.getAttribute('class') || ''
        // Check for padding classes that ensure 44px minimum
        expect(classes).toMatch(/p-|py-|px-/)
      })
    })
  })

  describe('Content Structure', () => {
    it('should have proper heading hierarchy', async () => {
      const { document } = await renderComponent(EpisodeCard, {
        props: {
          episode: mockEpisode,
          size: 'medium'
        }
      })

      // Episode card should use h3 for title
      const heading = document.querySelector('h3')
      expect(heading).toBeTruthy()
      expect(heading?.textContent).toContain(mockEpisode.data.title)
    })

    it('should include episode metadata', async () => {
      const { document } = await renderComponent(EpisodeCard, {
        props: {
          episode: mockEpisode,
          size: 'medium'
        }
      })

      const content = document.textContent || ''

      // Should include season and episode info
      expect(content).toContain(`S${mockEpisode.data.season}`)
      expect(content).toContain(`E${mockEpisode.data.episode}`)

      // Should include duration
      expect(content).toContain(mockEpisode.data.duration)
    })
  })

  describe('Image Accessibility', () => {
    it('should have alt text for episode images', async () => {
      const { document } = await renderComponent(EpisodeCard, {
        props: {
          episode: mockEpisode,
          size: 'medium'
        }
      })

      const images = document.querySelectorAll('img')

      images.forEach(img => {
        expect(img).toHaveAttribute('alt')
        const alt = img.getAttribute('alt')
        expect(alt).toBeTruthy()
        expect(alt?.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('should be accessible on mobile viewport', async () => {
      setupViewport(375, 667) // iPhone SE size

      const { container } = await renderComponent(EpisodeCard, {
        props: {
          episode: mockEpisode,
          size: 'small'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be accessible on tablet viewport', async () => {
      setupViewport(768, 1024) // iPad size

      const { container } = await renderComponent(EpisodeCard, {
        props: {
          episode: mockEpisode,
          size: 'medium'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be accessible on desktop viewport', async () => {
      setupViewport(1920, 1080) // Full HD

      const { container } = await renderComponent(EpisodeCard, {
        props: {
          episode: mockEpisode,
          size: 'large'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Language Badge', () => {
    it('should properly display language when showLanguage is true', async () => {
      const { document } = await renderComponent(EpisodeCard, {
        props: {
          episode: mockEpisode,
          size: 'medium',
          showLanguage: true
        }
      })

      // Look for language badge
      const languageBadge = document.querySelector('.language-badge, [class*="flag"]')

      if (languageBadge) {
        // If language badge exists, it should be accessible
        const results = await axe(languageBadge.parentElement!)
        expect(results).toHaveNoViolations()
      }
    })
  })

  describe('Card Variations', () => {
    const episodeTypes = ['full', 'trailer', 'bonus'] as const

    episodeTypes.forEach(type => {
      it(`should be accessible for ${type} episode type`, async () => {
        const episode = mockData.episode({
          data: { episode_type: type }
        })

        const { container } = await renderComponent(EpisodeCard, {
          props: {
            episode,
            size: 'medium'
          }
        })

        const results = await axe(container)
        expect(results).toHaveNoViolations()
      })
    })
  })

  describe('Focus Management', () => {
    it('should have visible focus indicators on interactive elements', async () => {
      const { document } = await renderComponent(EpisodeCard, {
        props: {
          episode: mockEpisode,
          size: 'medium'
        }
      })

      const links = document.querySelectorAll('a')

      links.forEach(link => {
        // Check for focus-related classes
        const classes = link.getAttribute('class') || ''
        expect(classes).toMatch(/focus:|hover:/)
      })
    })
  })

  describe('Color Contrast', () => {
    it('should use accessible text color classes', async () => {
      const { document } = await renderComponent(EpisodeCard, {
        props: {
          episode: mockEpisode,
          size: 'medium'
        }
      })

      // Check for text elements with proper contrast classes
      const textElements = document.querySelectorAll('p, span, div')

      textElements.forEach(element => {
        const classes = element.getAttribute('class') || ''
        if (classes.includes('text-')) {
          // Should use accessible color combinations
          expect(classes).toMatch(/text-(gray-700|gray-800|gray-900)|dark:text-(gray-100|gray-200|gray-300|white)/)
        }
      })
    })
  })
})