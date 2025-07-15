import 'vitest-axe/extend-expect'
import { configureAxe } from 'vitest-axe'

// Configure axe for WCAG 2.2 Level AA compliance
export const axeConfig = {
  rules: {
    // WCAG 2.2 Level AA rules
    'wcag2aa': { enabled: true },
    'wcag2aaa': { enabled: false }, // Level AAA not required

    // Focus appearance (WCAG 2.2 - 2.4.13)
    'focus-visible': { enabled: true },

    // Target size (WCAG 2.2 - 2.5.8)
    'target-size': { enabled: true },

    // Focus not obscured (WCAG 2.2 - 2.4.11)
    'focus-not-obscured': { enabled: true },

    // Dragging movements (WCAG 2.2 - 2.5.7)
    'dragging': { enabled: true },

    // Consistent help (WCAG 2.2 - 3.2.6)
    'consistent-help': { enabled: true },

    // Color contrast - disabled in JSDOM environment
    // Will be tested separately with Playwright in Phase 3
    'color-contrast': { enabled: false },

    // Additional important rules
    'aria-allowed-attr': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'button-name': { enabled: true },
    'duplicate-id': { enabled: true },
    'empty-heading': { enabled: true },
    'heading-order': { enabled: true },
    'html-has-lang': { enabled: true },
    'image-alt': { enabled: true },
    'label': { enabled: true },
    'link-name': { enabled: true },
    'list': { enabled: true },
    'listitem': { enabled: true },
    'meta-viewport': { enabled: true },
    'region': { enabled: true },
    'skip-link': { enabled: true }
  }
}

// Apply configuration globally
configureAxe(axeConfig)

// Export for use in individual tests if needed
export { configureAxe }