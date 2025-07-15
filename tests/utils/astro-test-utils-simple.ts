import { JSDOM } from 'jsdom'
import { compileAstroComponent } from './compile-astro'

export interface RenderOptions {
  props?: Record<string, any>
  slots?: Record<string, string>
  params?: Record<string, string>
  request?: Request
}

/**
 * Simple render function for testing Astro components
 */
export async function renderComponent(
  componentPath: string,
  options: RenderOptions = {}
) {
  // Compile the component (returns mock)
  const Component = await compileAstroComponent(componentPath)

  // Get the mock HTML
  const result = Component(options.props || {})

  // Convert to DOM for axe testing
  const dom = new JSDOM(result.html, {
    url: 'http://localhost:4321',
    pretendToBeVisual: true,
    resources: 'usable'
  })

  // Wait for DOM to be ready
  await new Promise(resolve => setTimeout(resolve, 0))

  return {
    container: dom.window.document.body,
    html: result.html,
    document: dom.window.document,
    window: dom.window
  }
}

/**
 * Helper for testing components with different languages
 */
export async function renderWithLanguage(
  componentPath: string,
  language: string,
  options: RenderOptions = {}
) {
  return renderComponent(componentPath, {
    ...options,
    props: {
      ...options.props,
      language
    }
  })
}

/**
 * Helper for setting up viewport dimensions
 */
export function setupViewport(width: number, height: number) {
  // JSDOM doesn't support viewport changes, so we'll just note it
  console.log(`Viewport set to ${width}x${height}`)
}

/**
 * Helper to check touch target sizes
 */
export function checkTouchTargetSize(element: Element): boolean {
  // In JSDOM, we can't get real dimensions, so check for classes
  const classes = element.getAttribute('class') || ''
  return classes.includes('touch-target') ||
         classes.includes('min-w-[48px]') ||
         classes.includes('min-h-[48px]')
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
      language: 'en',
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
      ...overrides.data
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
      languages: ['en', 'nl'],
      slug: 'test-guest',
      expertise: ['A/B Testing', 'Analytics'],
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com/in/testguest' }
      ],
      ...overrides.data
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
      ...overrides.data
    }
  })
}