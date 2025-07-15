import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { JSDOM } from 'jsdom'
import type { AstroComponentFactory } from 'astro/runtime/server/index.js'
import type { Language } from '@types/index'

export interface RenderOptions {
  props?: Record<string, any>
  slots?: Record<string, string>
  params?: Record<string, string>
  request?: Request
}

/**
 * Renders an Astro component for testing
 * Returns both the DOM container and the raw HTML
 */
export async function renderComponent(
  Component: AstroComponentFactory,
  options: RenderOptions = {}
) {
  const container = await AstroContainer.create()
  const result = await container.renderToString(Component, {
    props: options.props || {},
    slots: options.slots || {},
    params: options.params || {},
    request: options.request
  })

  // Convert to DOM for axe testing
  const dom = new JSDOM(result, {
    url: 'http://localhost:4321',
    resources: 'usable',
    runScripts: 'dangerously'
  })

  // Wait for DOM to be ready
  await new Promise(resolve => setTimeout(resolve, 0))

  return {
    container: dom.window.document.body,
    html: result,
    document: dom.window.document,
    window: dom.window
  }
}

/**
 * Helper for testing components with different languages
 */
export async function renderWithLanguage(
  Component: AstroComponentFactory,
  language: Language,
  options: RenderOptions = {}
) {
  return renderComponent(Component, {
    ...options,
    props: {
      ...options.props,
      language
    }
  })
}

/**
 * Helper for setting up viewport dimensions
 * Useful for testing responsive behavior and touch targets
 */
export function setupViewport(width: number, height: number) {
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height
    })
    Object.defineProperty(window.screen, 'width', {
      writable: true,
      configurable: true,
      value: width
    })
    Object.defineProperty(window.screen, 'height', {
      writable: true,
      configurable: true,
      value: height
    })
  }
}

/**
 * Helper to check touch target sizes
 * WCAG 2.2 requires minimum 44x44px touch targets
 */
export function checkTouchTargetSize(element: Element): boolean {
  const rect = element.getBoundingClientRect()
  return rect.width >= 44 && rect.height >= 44
}

/**
 * Helper to get computed styles with JSDOM
 */
export function getComputedStyles(element: Element) {
  const window = element.ownerDocument?.defaultView
  if (!window) {return null}
  return window.getComputedStyle(element)
}

/**
 * Mock data generators for testing
 */
export const mockData = {
  episode: (overrides = {}) => ({
    id: 'test-episode',
    collection: 'episodes',
    data: {
      title: 'Test Episode Title',
      pubDate: new Date('2024-01-01'),
      description: 'Test episode description',
      season: 1,
      episode: 1,
      language: 'en' as Language,
      imageUrl: '/test-image.jpg',
      duration: '45:00',
      audioUrl: '/test-audio.mp3',
      hosts: ['testhost'],
      guests: ['testguest'],
      keywords: ['testing', 'accessibility'],
      transcript: null,
      embedHtml: null,
      status: 'published',
      slug: 'test-episode',
      episode_type: 'full',
      summary: null,
      metaDescription: null,
      seoTitle: null,
      ...overrides
    }
  }),

  guest: (overrides = {}) => ({
    id: 'test-guest',
    collection: 'guests',
    data: {
      name: 'Test Guest',
      bio: 'Test guest bio',
      role: 'CRO Expert',
      company: 'Test Company',
      imageUrl: '/test-guest.jpg',
      linkedin: 'https://linkedin.com/in/testguest',
      twitter: 'testguest',
      website: 'https://example.com',
      languages: ['en', 'nl'] as Language[],
      slug: 'test-guest',
      expertise: ['A/B Testing', 'Analytics'],
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com/in/testguest' }
      ],
      ...overrides
    }
  }),

  host: (overrides = {}) => ({
    id: 'test-host',
    collection: 'hosts',
    data: {
      name: 'Test Host',
      bio: 'Test host bio',
      role: 'Podcast Host',
      imageUrl: '/test-host.jpg',
      linkedin: 'https://linkedin.com/in/testhost',
      episodes: ['test-episode'],
      slug: 'test-host',
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com/in/testhost' }
      ],
      ...overrides
    }
  })
}

/**
 * Wait for component hydration if needed
 */
export async function waitForHydration(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms))
}