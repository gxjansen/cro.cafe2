import { describe, it, expect } from 'vitest'
import { parseMarkdownLinks, renderEpisodeDescription } from '../../src/utils/markdown'

describe('parseMarkdownLinks', () => {
  it('returns empty string for empty input', () => {
    expect(parseMarkdownLinks('')).toBe('')
  })

  it('converts [text](url) to anchor tags', () => {
    const out = parseMarkdownLinks('See [example](https://example.com).')
    expect(out).toContain('<a href="https://example.com"')
    expect(out).toContain('>example</a>')
    expect(out.endsWith('.')).toBe(true)
  })

  it('leaves plain text unchanged', () => {
    expect(parseMarkdownLinks('plain text only')).toBe('plain text only')
  })
})

describe('renderEpisodeDescription', () => {
  it('returns empty string for empty input', () => {
    expect(renderEpisodeDescription('')).toBe('')
  })

  it('auto-links bare URLs', () => {
    const out = renderEpisodeDescription('Tickets: https://example.com/')
    expect(out).toContain('<a href="https://example.com/"')
    expect(out).toContain('target="_blank"')
    expect(out).toContain('rel="noopener noreferrer"')
  })

  it('does not double-wrap URLs already inside anchor tags', () => {
    const input = '<a href="https://example.com">https://example.com</a>'
    const out = renderEpisodeDescription(input)
    expect(out).toBe(input)
    expect(out).not.toContain('<a href="https://example.com"><a')
  })

  it('passes inline HTML lists through unchanged', () => {
    const input = '<ul>\n<li>foo</li>\n<li>https://x.com</li>\n</ul>'
    const out = renderEpisodeDescription(input)
    expect(out).toContain('<ul>')
    expect(out).toContain('<li>foo</li>')
    expect(out).toContain('<a href="https://x.com"')
  })

  it('converts markdown-style [text](url) links', () => {
    const out = renderEpisodeDescription('See [example](https://example.com)')
    expect(out).toContain('<a href="https://example.com"')
    expect(out).toContain('>example</a>')
  })

  it('strips trailing punctuation outside the URL', () => {
    const out = renderEpisodeDescription('See https://example.com.')
    expect(out).toContain('<a href="https://example.com"')
    expect(out).toContain('>https://example.com</a>.')
  })

  it('handles a mix of bare URLs and bullet lines', () => {
    const input = 'Tickets: https://example.com/\n\nLinks:\n* https://a.com/\n* https://b.com/'
    const out = renderEpisodeDescription(input)
    expect(out).toContain('<a href="https://example.com/"')
    expect(out).toContain('<a href="https://a.com/"')
    expect(out).toContain('<a href="https://b.com/"')
  })

  it('handles HTML lists with nested anchors', () => {
    const input = 'Links:\n<ul>\n<li><a href="https://x.com">https://x.com</a></li>\n</ul>'
    const out = renderEpisodeDescription(input)
    expect(out).toContain('<ul>')
    expect(out).toContain('<a href="https://x.com">https://x.com</a>')
    expect(out).not.toContain('<a href="https://x.com"><a')
  })
})
