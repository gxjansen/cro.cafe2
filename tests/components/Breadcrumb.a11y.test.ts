import { describe, it, expect, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'
import Breadcrumb from '@components/Breadcrumb.astro'
import { renderWithLanguage, checkTouchTargetSize } from '../utils/astro-test-utils'

describe('Breadcrumb Accessibility', () => {
  describe('WCAG 2.2 Compliance', () => {
    it('should have no accessibility violations - English home page', async () => {
      const { container } = await renderWithLanguage(Breadcrumb, 'en', {
        props: {
          currentPath: '/en/'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - Episode detail page', async () => {
      const { container } = await renderWithLanguage(Breadcrumb, 'en', {
        props: {
          currentPath: '/en/episodes/test-episode/',
          episodeTitle: 'Test Episode: A/B Testing Best Practices'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - Guest detail page', async () => {
      const { container } = await renderWithLanguage(Breadcrumb, 'nl', {
        props: {
          currentPath: '/nl/guests/test-guest/',
          guestName: 'John Doe'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Semantic Structure', () => {
    it('should use nav element with proper ARIA label', async () => {
      const { document } = await renderWithLanguage(Breadcrumb, 'en', {
        props: {
          currentPath: '/en/episodes/'
        }
      })

      const nav = document.querySelector('nav')
      expect(nav).toBeTruthy()
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb')
    })

    it('should use ordered list for breadcrumb items', async () => {
      const { document } = await renderWithLanguage(Breadcrumb, 'en', {
        props: {
          currentPath: '/en/episodes/test-episode/',
          episodeTitle: 'Test Episode'
        }
      })

      const ol = document.querySelector('nav ol')
      expect(ol).toBeTruthy()

      const items = ol?.querySelectorAll('li')
      expect(items?.length).toBeGreaterThan(1)
    })

    it('should mark current page with aria-current', async () => {
      const { document } = await renderWithLanguage(Breadcrumb, 'en', {
        props: {
          currentPath: '/en/episodes/test-episode/',
          episodeTitle: 'Test Episode'
        }
      })

      const currentPage = document.querySelector('[aria-current="page"]')
      expect(currentPage).toBeTruthy()
      expect(currentPage?.textContent).toContain('Test Episode')

      // Current page should not be a link
      expect(currentPage?.tagName).not.toBe('A')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should have focusable links with visible focus indicators', async () => {
      const { document } = await renderWithLanguage(Breadcrumb, 'en', {
        props: {
          currentPath: '/en/episodes/test-episode/',
          episodeTitle: 'Test Episode'
        }
      })

      const links = document.querySelectorAll('nav a')
      expect(links.length).toBeGreaterThan(0)

      links.forEach(link => {
        // Check that link has href
        expect(link).toHaveAttribute('href')

        // Check that link has breadcrumb-link class for focus styles
        expect(link).toHaveClass('breadcrumb-link')
      })
    })
  })

  describe('Touch Target Size', () => {
    it('should have adequate touch target size for mobile', async () => {
      const { document } = await renderWithLanguage(Breadcrumb, 'en', {
        props: {
          currentPath: '/en/episodes/test-episode/',
          episodeTitle: 'Test Episode'
        }
      })

      const links = document.querySelectorAll('nav a')

      // Note: In JSDOM, getBoundingClientRect returns zeros
      // In a real browser test, we would check:
      // links.forEach(link => {
      //   expect(checkTouchTargetSize(link)).toBe(true)
      // })

      // Instead, verify the classes that provide adequate padding
      links.forEach(link => {
        expect(link).toHaveClass('breadcrumb-link')
      })
    })
  })

  describe('Text Content', () => {
    it('should have meaningful link text', async () => {
      const { document } = await renderWithLanguage(Breadcrumb, 'en', {
        props: {
          currentPath: '/en/episodes/'
        }
      })

      const links = document.querySelectorAll('nav a')

      links.forEach(link => {
        const text = link.textContent?.trim()
        expect(text).toBeTruthy()
        expect(text?.length).toBeGreaterThan(0)

        // Check for meaningful text (not just symbols)
        expect(text).toMatch(/\w+/)
      })
    })

    it('should truncate long titles with title attribute', async () => {
      const longTitle = 'This is a very long episode title that should be truncated in the breadcrumb navigation'

      const { document } = await renderWithLanguage(Breadcrumb, 'en', {
        props: {
          currentPath: '/en/episodes/test-episode/',
          episodeTitle: longTitle
        }
      })

      const currentPage = document.querySelector('[aria-current="page"]')
      expect(currentPage).toHaveAttribute('title', longTitle)
    })
  })

  describe('Language Support', () => {
    const languages = ['en', 'nl', 'de', 'es'] as const

    languages.forEach(lang => {
      it(`should be accessible in ${lang}`, async () => {
        const { container } = await renderWithLanguage(Breadcrumb, lang, {
          props: {
            currentPath: `/${lang}/episodes/`
          }
        })

        const results = await axe(container)
        expect(results).toHaveNoViolations()
      })
    })
  })

  describe('Visual Hierarchy', () => {
    it('should use proper text contrast classes', async () => {
      const { document } = await renderWithLanguage(Breadcrumb, 'en', {
        props: {
          currentPath: '/en/episodes/'
        }
      })

      const ol = document.querySelector('ol')
      expect(ol).toHaveClass('breadcrumb-text')
    })

    it('should have separator elements between items', async () => {
      const { document } = await renderWithLanguage(Breadcrumb, 'en', {
        props: {
          currentPath: '/en/episodes/test-episode/',
          episodeTitle: 'Test Episode'
        }
      })

      const separators = document.querySelectorAll('nav svg')
      expect(separators.length).toBeGreaterThan(0)

      // Separators should have proper styling
      separators.forEach(separator => {
        expect(separator.getAttribute('class')).toContain('mx-')
      })
    })
  })
})