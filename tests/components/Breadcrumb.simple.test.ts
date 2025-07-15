import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { renderComponent } from '../utils/astro-test-utils-simple'

describe('Breadcrumb Accessibility (Simple)', () => {
  it('should have no accessibility violations', async () => {
    const { container } = await renderComponent('Breadcrumb.astro', {
      props: {
        currentPath: '/en/episodes/test-episode/',
        episodeTitle: 'Test Episode: A/B Testing Best Practices'
      }
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have proper ARIA structure', async () => {
    const { document } = await renderComponent('Breadcrumb.astro', {
      props: {
        currentPath: '/en/episodes/test-episode/',
        episodeTitle: 'Test Episode'
      }
    })

    const nav = document.querySelector('nav')
    expect(nav).toBeTruthy()
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb')

    const currentPage = document.querySelector('[aria-current="page"]')
    expect(currentPage).toBeTruthy()
    expect(currentPage?.textContent).toContain('Test Episode')
  })
})