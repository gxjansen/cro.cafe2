import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import LanguageSwitcher from '@components/LanguageSwitcher.astro'
import { renderComponent } from '../utils/astro-test-utils'

describe('LanguageSwitcher Accessibility', () => {
  describe('WCAG 2.2 Compliance', () => {
    it('should have no accessibility violations - language mode', async () => {
      const { container } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - global mode', async () => {
      const { container } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: undefined,
          currentPath: '/'
        }
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations on different pages', async () => {
      const paths = ['/en/episodes/', '/all/guests/', '/subscribe/', '/search/']

      for (const path of paths) {
        const { container } = await renderComponent(LanguageSwitcher, {
          props: {
            currentLanguage: path.startsWith('/en/') ? 'en' : undefined,
            currentPath: path
          }
        })

        const results = await axe(container)
        expect(results).toHaveNoViolations()
      }
    })
  })

  describe('Button Accessibility', () => {
    it('should have accessible button with proper attributes', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      const button = document.querySelector('[data-language-button]')
      expect(button).toBeTruthy()
      expect(button).toHaveAttribute('type', 'button')
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(button).toHaveAttribute('aria-haspopup', 'true')
      expect(button).toHaveAttribute('aria-label')

      // Check aria-label includes current language
      const ariaLabel = button?.getAttribute('aria-label')
      expect(ariaLabel).toContain('Choose language')
      expect(ariaLabel).toContain('Current: English')
    })

    it('should have proper aria-label for each language', async () => {
      const languages = [
        { code: 'en', name: 'English' },
        { code: 'nl', name: 'Nederlands' },
        { code: 'de', name: 'Deutsch' },
        { code: 'es', name: 'Español' }
      ]

      for (const lang of languages) {
        const { document } = await renderComponent(LanguageSwitcher, {
          props: {
            currentLanguage: lang.code as any,
            currentPath: `/${lang.code}/`
          }
        })

        const button = document.querySelector('[data-language-button]')
        const ariaLabel = button?.getAttribute('aria-label')
        expect(ariaLabel).toContain(`Current: ${lang.name}`)
      }
    })

    it('should show global option when on global pages', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: undefined,
          currentPath: '/'
        }
      })

      const button = document.querySelector('[data-language-button]')
      const ariaLabel = button?.getAttribute('aria-label')
      expect(ariaLabel).toContain('Current: All Languages')
    })
  })

  describe('Dropdown Menu', () => {
    it('should have proper menu structure and attributes', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      const menu = document.querySelector('[data-language-menu]')
      expect(menu).toBeTruthy()
      expect(menu).toHaveAttribute('role', 'menu')
      expect(menu).toHaveAttribute('aria-orientation', 'vertical')
      expect(menu).toHaveClass('hidden') // Initially hidden
    })

    it('should have accessible menu items', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      const menuItems = document.querySelectorAll('[role="menuitem"]')
      expect(menuItems.length).toBe(5) // Global + 4 languages

      menuItems.forEach(item => {
        expect(item.tagName).toBe('A')
        expect(item).toHaveAttribute('href')

        // Should have meaningful text content
        const text = item.textContent?.trim()
        expect(text).toBeTruthy()
        expect(text).toMatch(/All Languages|English|Nederlands|Deutsch|Español/)
      })
    })

    it('should mark current language with aria-current', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      const currentItem = document.querySelector('[aria-current="page"]')
      expect(currentItem).toBeTruthy()
      expect(currentItem?.textContent).toContain('English')

      // Should have visual indicator
      const checkmark = currentItem?.querySelector('svg[aria-label="Currently selected"]')
      expect(checkmark).toBeTruthy()
    })

    it('should display episode and guest counts', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      const menuItems = document.querySelectorAll('[role="menuitem"]')

      menuItems.forEach(item => {
        const content = item.textContent || ''
        expect(content).toMatch(/\d+ episodes · \d+ guests/)
      })
    })
  })

  describe('Touch Target Size', () => {
    it('should have adequate touch target size for button', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      const button = document.querySelector('[data-language-button]')
      expect(button).toHaveClass('px-2', 'sm:px-3', 'py-2')

      // Button should have minimum height for touch targets
      const classes = button?.getAttribute('class') || ''
      expect(classes).toContain('py-2')
    })

    it('should have adequate touch target size for menu items', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      const menuItems = document.querySelectorAll('[role="menuitem"]')

      menuItems.forEach(item => {
        expect(item).toHaveClass('px-4', 'py-2')
      })
    })
  })

  describe('Color Contrast', () => {
    it('should use accessible text colors', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      // Button text
      const button = document.querySelector('[data-language-button]')
      expect(button).toHaveClass('text-gray-700', 'dark:text-gray-200')

      // Menu items
      const menuItems = document.querySelectorAll('[role="menuitem"]:not([aria-current])')
      menuItems.forEach(item => {
        expect(item).toHaveClass('text-gray-700', 'dark:text-gray-200')
      })

      // Current menu item
      const currentItem = document.querySelector('[aria-current="page"]')
      expect(currentItem).toHaveClass('text-primary-700', 'dark:text-primary-200')

      // Count text
      const countText = document.querySelectorAll('.text-xs.text-gray-500')
      expect(countText.length).toBeGreaterThan(0)
    })
  })

  describe('Focus Management', () => {
    it('should have visible focus indicators', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      const button = document.querySelector('[data-language-button]')
      const classes = button?.getAttribute('class') || ''

      // Should have focus ring styles
      expect(classes).toContain('focus:outline-none')
      expect(classes).toContain('focus:ring-2')
      expect(classes).toContain('focus:ring-primary-600')
      expect(classes).toContain('focus:ring-offset-2')
    })

    it('should have hover states for interactive elements', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      // Button hover
      const button = document.querySelector('[data-language-button]')
      expect(button).toHaveClass('hover:bg-primary-50', 'dark:hover:bg-gray-700')

      // Menu items hover
      const menuItems = document.querySelectorAll('[role="menuitem"]:not([aria-current])')
      menuItems.forEach(item => {
        expect(item).toHaveClass('hover:bg-primary-50', 'dark:hover:bg-gray-700')
      })
    })
  })

  describe('Icon Accessibility', () => {
    it('should mark decorative icons as aria-hidden', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      // Flag emoji should be hidden
      const flagSpan = document.querySelector('.mr-1.sm\\:mr-2')
      expect(flagSpan).toHaveAttribute('aria-hidden', 'true')

      // Chevron icon should be hidden
      const chevron = document.querySelector('svg[viewBox="0 0 24 24"]')
      expect(chevron).toHaveAttribute('aria-hidden', 'true')

      // Flag emojis in menu
      const menuFlags = document.querySelectorAll('.mr-3.text-lg')
      menuFlags.forEach(flag => {
        expect(flag).toHaveAttribute('aria-hidden', 'true')
      })
    })

    it('should have proper label for checkmark icon', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      const checkmark = document.querySelector('svg[aria-label="Currently selected"]')
      expect(checkmark).toBeTruthy()
    })
  })

  describe('Responsive Design', () => {
    it('should show appropriate text based on viewport', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      // Full language name on desktop
      const fullName = document.querySelector('.hidden.sm\\:inline')
      expect(fullName).toBeTruthy()
      expect(fullName?.textContent).toBe('English')

      // Short code on mobile
      const shortCode = document.querySelector('.sm\\:hidden.text-xs')
      expect(shortCode).toBeTruthy()
      expect(shortCode?.textContent).toBe('EN')
    })

    it('should have responsive width constraints', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      const button = document.querySelector('[data-language-button]')
      expect(button).toHaveClass('max-w-[120px]', 'sm:max-w-none')

      const menu = document.querySelector('[data-language-menu]')
      expect(menu).toHaveClass('w-60', 'sm:w-64', 'max-w-[calc(100vw-2rem)]')
    })
  })

  describe('Z-Index Management', () => {
    it('should have proper z-index for layering', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/'
        }
      })

      const container = document.querySelector('.language-switcher-container')
      expect(container).toHaveAttribute('style')
      const style = container?.getAttribute('style') || ''
      expect(style).toContain('z-index: 60')

      const menu = document.querySelector('[data-language-menu]')
      expect(menu).toHaveAttribute('style')
      const menuStyle = menu?.getAttribute('style') || ''
      expect(menuStyle).toContain('isolation: isolate')
    })
  })

  describe('Language URLs', () => {
    it('should generate correct URLs for language switching', async () => {
      const { document } = await renderComponent(LanguageSwitcher, {
        props: {
          currentLanguage: 'en',
          currentPath: '/en/episodes/'
        }
      })

      const menuItems = document.querySelectorAll('[role="menuitem"]')
      const urls = Array.from(menuItems).map(item => item.getAttribute('href'))

      expect(urls).toContain('/all/episodes/') // Global
      expect(urls).toContain('/en/episodes/')  // English
      expect(urls).toContain('/nl/episodes/')  // Dutch
      expect(urls).toContain('/de/episodes/')  // German
      expect(urls).toContain('/es/episodes/')  // Spanish
    })
  })
})