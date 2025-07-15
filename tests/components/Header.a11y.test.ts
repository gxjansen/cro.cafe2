import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import Header from '@components/Header.astro'
import { renderComponent, renderWithLanguage } from '../utils/astro-test-utils'

describe('Header Accessibility', () => {
  describe('WCAG 2.2 Compliance', () => {
    it('should have no accessibility violations - language mode', async () => {
      const { container } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - global mode', async () => {
      const { container } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations with active navigation', async () => {
      const { container } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/episodes/'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Semantic Structure', () => {
    it('should use header element as the container', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      const header = document.querySelector('header')
      expect(header).toBeTruthy()
      expect(header).toHaveClass('sticky')
    })

    it('should have main navigation with proper ARIA label', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      const nav = document.querySelector('nav#main-navigation')
      expect(nav).toBeTruthy()
      expect(nav).toHaveAttribute('aria-label', 'Main navigation')
    })

    it('should mark current page with aria-current', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/episodes/'
        }
      })

      const activeLink = document.querySelector('[aria-current="page"]')
      expect(activeLink).toBeTruthy()
      expect(activeLink?.textContent).toContain('Episodes')
    })
  })

  describe('Logo Accessibility', () => {
    it('should have accessible logo link with proper label', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      const logoLink = document.querySelector('a[aria-label="CRO.CAFE Home"]')
      expect(logoLink).toBeTruthy()
      expect(logoLink).toHaveAttribute('href', '/en/')

      const logoImg = logoLink?.querySelector('img')
      expect(logoImg).toHaveAttribute('alt', 'CRO.CAFE Logo')
    })

    it('should link to correct home page in global mode', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/'
        }
      })

      const logoLink = document.querySelector('a[aria-label="CRO.CAFE Home"]')
      expect(logoLink).toHaveAttribute('href', '/')
    })
  })

  describe('Navigation Links', () => {
    it('should have accessible navigation links', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      // Desktop navigation
      const desktopNav = document.querySelector('.hidden.md\\:block')
      const navLinks = desktopNav?.querySelectorAll('a')

      expect(navLinks?.length).toBe(3) // Episodes, Guests, Subscribe

      navLinks?.forEach(link => {
        expect(link).toHaveAttribute('href')
        expect(link.textContent?.trim()).toBeTruthy()

        // Check for focus styles
        const classes = link.getAttribute('class') || ''
        expect(classes).toMatch(/hover:|focus:/)
      })
    })

    it('should use proper navigation text for each language', async () => {
      const languages = [
        { code: 'en', episodes: 'Episodes', guests: 'Guests', subscribe: 'Subscribe' },
        { code: 'nl', episodes: 'Afleveringen', guests: 'Gasten', subscribe: 'Abonneren' },
        { code: 'de', episodes: 'Folgen', guests: 'Gäste', subscribe: 'Abonnieren' },
        { code: 'es', episodes: 'Episodios', guests: 'Invitados', subscribe: 'Suscríbete' }
      ]

      for (const lang of languages) {
        const { document } = await renderComponent(Header, {
          props: {
            language: lang.code as any,
            currentPath: `/${lang.code}/`
          }
        })

        const content = document.textContent || ''
        expect(content).toContain(lang.episodes)
        expect(content).toContain(lang.guests)
        expect(content).toContain(lang.subscribe)
      }
    })
  })

  describe('Interactive Controls', () => {
    it('should have accessible search button/link', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      // Desktop search link
      const searchLink = document.querySelector('a[aria-label="Search episodes and guests"]')
      expect(searchLink).toBeTruthy()
      expect(searchLink).toHaveAttribute('href', '/en/search/')
      expect(searchLink).toHaveClass('touch-target')

      // Mobile search button
      const searchButton = document.querySelector('button[aria-label="Search episodes and guests"]')
      expect(searchButton).toBeTruthy()
      expect(searchButton).toHaveClass('touch-target')
    })

    it('should have minimum touch target size', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      // All interactive elements should have touch-target class or min dimensions
      const interactiveElements = document.querySelectorAll('a, button')

      interactiveElements.forEach(element => {
        const classes = element.getAttribute('class') || ''
        const hasMinDimensions = classes.includes('min-w-[48px]') && classes.includes('min-h-[48px]')
        const hasTouchTarget = classes.includes('touch-target')
        const isPaddedLink = classes.includes('px-3') && classes.includes('py-2')

        expect(hasMinDimensions || hasTouchTarget || isPaddedLink).toBe(true)
      })
    })
  })

  describe('Mobile Menu', () => {
    it('should have accessible mobile menu button', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      const mobileToggle = document.querySelector('#mobile-menu-toggle')
      expect(mobileToggle).toBeTruthy()
      expect(mobileToggle).toHaveAttribute('aria-label', 'Open main menu')
      expect(mobileToggle).toHaveAttribute('aria-expanded', 'false')
      expect(mobileToggle).toHaveClass('touch-target')
    })

    it('should have proper mobile navigation structure', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      const mobileNav = document.querySelector('#mobile-menu')
      expect(mobileNav).toBeTruthy()
      expect(mobileNav).toHaveAttribute('aria-label', 'Mobile navigation')

      // Mobile nav links should have touch-target class
      const mobileLinks = mobileNav?.querySelectorAll('a')
      mobileLinks?.forEach(link => {
        expect(link).toHaveClass('touch-target')
        expect(link).toHaveClass('min-h-[48px]')
      })
    })
  })

  describe('Color Contrast', () => {
    it('should use accessible text colors', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      // Check navigation links
      const navLinks = document.querySelectorAll('nav a')
      navLinks.forEach(link => {
        const classes = link.getAttribute('class') || ''
        if (!link.hasAttribute('aria-current')) {
          // Inactive links
          expect(classes).toMatch(/text-gray-700|dark:text-gray-300/)
        }
      })

      // Check buttons
      const buttons = document.querySelectorAll('button')
      buttons.forEach(button => {
        const classes = button.getAttribute('class') || ''
        expect(classes).toMatch(/text-gray-600|dark:text-gray-300/)
      })
    })
  })

  describe('Focus Management', () => {
    it('should have visible focus indicators on all interactive elements', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      const interactiveElements = document.querySelectorAll('a, button')

      interactiveElements.forEach(element => {
        const classes = element.getAttribute('class') || ''
        // Should have hover/focus styles or specific focus classes
        expect(classes).toMatch(/hover:|focus:|rounded/)
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('should hide/show appropriate elements for mobile', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      // Desktop nav should be hidden on mobile
      const desktopNav = document.querySelector('.hidden.md\\:block')
      expect(desktopNav).toBeTruthy()

      // Mobile search button should be visible on mobile only
      const mobileSearch = document.querySelector('.flex.lg\\:hidden')
      expect(mobileSearch).toBeTruthy()

      // Desktop search link should be hidden on mobile
      const desktopSearch = document.querySelector('.hidden.lg\\:flex')
      expect(desktopSearch).toBeTruthy()
    })
  })

  describe('Skip Navigation', () => {
    it('should provide navigation landmark', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      // Header should provide navigation landmark
      const navElements = document.querySelectorAll('nav')
      expect(navElements.length).toBeGreaterThan(0)

      // Main navigation should be identifiable
      const mainNav = document.querySelector('#main-navigation')
      expect(mainNav).toBeTruthy()
    })
  })

  describe('Theme and Language Controls', () => {
    it('should include accessible theme toggle', async () => {
      const { container } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      // Theme toggle component should be present
      // Note: We're testing the header includes it, not the component itself
      const themeArea = container.querySelector('.flex-shrink-0')
      expect(themeArea).toBeTruthy()
    })

    it('should include language switcher', async () => {
      const { container } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      // Language switcher area should be present
      const langArea = container.querySelector('.flex-shrink-0.min-w-0')
      expect(langArea).toBeTruthy()
    })
  })

  describe('Sticky Header', () => {
    it('should have proper sticky positioning classes', async () => {
      const { document } = await renderComponent(Header, {
        props: {
          language: 'en',
          currentPath: '/en/'
        }
      })

      const header = document.querySelector('header')
      expect(header).toHaveClass('sticky', 'top-0', 'z-50')
      expect(header).toHaveAttribute('style', 'isolation: isolate;')
    })
  })
})