import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import GuestCard from '@components/GuestCard.astro'
import { renderComponent, mockData } from '../utils/astro-test-utils'

describe('GuestCard Accessibility', () => {
  const mockGuest = mockData.guest({
    data: {
      name: 'Jane Smith',
      role: 'Senior CRO Specialist',
      company: 'Optimization Corp',
      bio: 'Jane is a seasoned CRO expert with over 10 years of experience in conversion optimization.',
      expertise: ['A/B Testing', 'Analytics', 'User Research']
    }
  })

  describe('WCAG 2.2 Compliance', () => {
    it('should have no accessibility violations - small size', async () => {
      const { container } = await renderComponent(GuestCard, {
        props: {
          guest: mockGuest,
          size: 'small',
          language: 'en'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - medium size', async () => {
      const { container } = await renderComponent(GuestCard, {
        props: {
          guest: mockGuest,
          size: 'medium',
          language: 'en'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - large size', async () => {
      const { container } = await renderComponent(GuestCard, {
        props: {
          guest: mockGuest,
          size: 'large',
          language: 'en'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Interactive Elements', () => {
    it('should have accessible links with meaningful text', async () => {
      const { document } = await renderComponent(GuestCard, {
        props: {
          guest: mockGuest,
          size: 'medium',
          language: 'en'
        }
      })

      const links = document.querySelectorAll('a')
      expect(links.length).toBeGreaterThan(0)

      // Main guest link
      const guestLink = Array.from(links).find(link =>
        link.textContent?.includes(mockGuest.data.name)
      )
      expect(guestLink).toBeTruthy()
      expect(guestLink).toHaveAttribute('href', `/guests/${mockGuest.data.slug}/`)

      // Check for meaningful link text
      links.forEach(link => {
        const text = link.textContent?.trim()
        expect(text).toBeTruthy()
        expect(text?.length).toBeGreaterThan(0)
      })
    })

    it('should have proper touch target sizes', async () => {
      const { document } = await renderComponent(GuestCard, {
        props: {
          guest: mockGuest,
          size: 'medium',
          language: 'en'
        }
      })

      const links = document.querySelectorAll('a')

      links.forEach(link => {
        const classes = link.getAttribute('class') || ''
        // Should have padding for adequate touch targets
        expect(classes).toMatch(/p-|py-|px-/)
      })
    })
  })

  describe('Image Accessibility', () => {
    it('should have alt text for guest profile pictures', async () => {
      const { document } = await renderComponent(GuestCard, {
        props: {
          guest: mockGuest,
          size: 'medium',
          language: 'en'
        }
      })

      const images = document.querySelectorAll('img')

      images.forEach(img => {
        expect(img).toHaveAttribute('alt')
        const alt = img.getAttribute('alt')
        expect(alt).toBeTruthy()
        // Alt text should be meaningful
        expect(alt).toContain(mockGuest.data.name)
      })
    })

    it('should handle missing images gracefully', async () => {
      const guestWithoutImage = mockData.guest({
        data: {
          ...mockGuest.data,
          imageUrl: undefined
        }
      })

      const { container } = await renderComponent(GuestCard, {
        props: {
          guest: guestWithoutImage,
          size: 'medium',
          language: 'en'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Content Structure', () => {
    it('should display guest information hierarchically', async () => {
      const { document } = await renderComponent(GuestCard, {
        props: {
          guest: mockGuest,
          size: 'medium',
          language: 'en'
        }
      })

      // Check for guest name
      const nameElement = document.querySelector('h3, h4')
      expect(nameElement).toBeTruthy()
      expect(nameElement?.textContent).toContain(mockGuest.data.name)

      // Check for role/company info
      const content = document.textContent || ''
      expect(content).toContain(mockGuest.data.role)
      expect(content).toContain(mockGuest.data.company)
    })

    it('should display expertise tags when available', async () => {
      const { document } = await renderComponent(GuestCard, {
        props: {
          guest: mockGuest,
          size: 'large',
          language: 'en'
        }
      })

      // Look for expertise tags
      const tags = document.querySelectorAll('[class*="badge"], [class*="tag"]')

      if (tags.length > 0) {
        // If tags exist, they should be accessible
        tags.forEach(tag => {
          const text = tag.textContent?.trim()
          expect(text).toBeTruthy()
        })
      }
    })
  })

  describe('Social Links', () => {
    it('should have accessible social media links', async () => {
      const { document } = await renderComponent(GuestCard, {
        props: {
          guest: mockGuest,
          size: 'large',
          language: 'en'
        }
      })

      // Look for LinkedIn link
      const linkedinLink = document.querySelector('a[href*="linkedin.com"]')

      if (linkedinLink) {
        // Should have proper aria-label or visible text
        const hasAriaLabel = linkedinLink.hasAttribute('aria-label')
        const hasVisibleText = linkedinLink.textContent?.trim().length! > 0

        expect(hasAriaLabel || hasVisibleText).toBe(true)
      }
    })
  })

  describe('Language Support', () => {
    const languages = ['en', 'nl', 'de', 'es'] as const

    languages.forEach(lang => {
      it(`should be accessible in ${lang}`, async () => {
        const { container } = await renderComponent(GuestCard, {
          props: {
            guest: mockGuest,
            size: 'medium',
            language: lang
          }
        })

        const results = await axe(container)
        expect(results).toHaveNoViolations()
      })
    })
  })

  describe('Color Contrast', () => {
    it('should use accessible text colors', async () => {
      const { document } = await renderComponent(GuestCard, {
        props: {
          guest: mockGuest,
          size: 'medium',
          language: 'en'
        }
      })

      // Check heading text
      const headings = document.querySelectorAll('h3, h4')
      headings.forEach(heading => {
        const classes = heading.getAttribute('class') || ''
        expect(classes).toMatch(/text-(gray-900|gray-800)|dark:text-(white|gray-100)/)
      })

      // Check body text
      const paragraphs = document.querySelectorAll('p')
      paragraphs.forEach(p => {
        const classes = p.getAttribute('class') || ''
        if (classes.includes('text-')) {
          expect(classes).toMatch(/text-(gray-700|gray-600)|dark:text-(gray-300|gray-200)/)
        }
      })
    })
  })

  describe('Focus Management', () => {
    it('should have visible focus indicators', async () => {
      const { document } = await renderComponent(GuestCard, {
        props: {
          guest: mockGuest,
          size: 'medium',
          language: 'en'
        }
      })

      const focusableElements = document.querySelectorAll('a, button')

      focusableElements.forEach(element => {
        const classes = element.getAttribute('class') || ''
        // Should have focus styles
        expect(classes).toMatch(/focus:|focus-visible:/)
      })
    })
  })

  describe('LinkedIn Badge', () => {
    it('should handle LinkedIn badge accessibly when present', async () => {
      const guestWithLinkedIn = mockData.guest({
        data: {
          ...mockGuest.data,
          linkedin: 'https://linkedin.com/in/janesmith',
          hasLinkedInData: true
        }
      })

      const { container } = await renderComponent(GuestCard, {
        props: {
          guest: guestWithLinkedIn,
          size: 'medium',
          language: 'en'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Card Variations', () => {
    it('should be accessible without company information', async () => {
      const freelancer = mockData.guest({
        data: {
          ...mockGuest.data,
          company: undefined,
          role: 'Freelance CRO Consultant'
        }
      })

      const { container } = await renderComponent(GuestCard, {
        props: {
          guest: freelancer,
          size: 'medium',
          language: 'en'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be accessible with long names and titles', async () => {
      const longNameGuest = mockData.guest({
        data: {
          ...mockGuest.data,
          name: 'Dr. Alexandra Catherine Elizabeth Montgomery-Richardson III',
          role: 'Chief Conversion Optimization Officer & Digital Transformation Strategist'
        }
      })

      const { container } = await renderComponent(GuestCard, {
        props: {
          guest: longNameGuest,
          size: 'medium',
          language: 'en'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})