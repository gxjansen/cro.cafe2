import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getHostStatistics } from '../../src/utils/content'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'

describe('Production Host Statistics - Critical Tests', () => {
  beforeEach(() => {
    // Clear any existing mocks for this test suite
    vi.clearAllMocks()
  })

  // This test ensures that all production hosts have episodes
  // If this test fails, the build should fail
  it('CRITICAL: All production hosts must have episodes and guests', async () => {
    // Mock getCollection to return real episode data
    const { getCollection } = await import('astro:content')
    const mockGetCollection = vi.mocked(getCollection)
    
    // Read real episode data from filesystem
    const episodes: any[] = []
    const episodesDir = join(process.cwd(), 'src/content/episodes')
    const languages = ['en', 'nl', 'de', 'es']
    
    for (const lang of languages) {
      const langDir = join(episodesDir, lang)
      const seasons = await readdir(langDir)
      
      for (const season of seasons) {
        if (!season.startsWith('season-')) continue
        
        const seasonDir = join(langDir, season)
        const files = await readdir(seasonDir)
        
        for (const file of files) {
          if (!file.endsWith('.mdx')) continue
          
          const filePath = join(seasonDir, file)
          const content = await readFile(filePath, 'utf-8')
          const { data } = matter(content)
          
          // Add episode in the format expected by getHostStatistics
          episodes.push({
            data: {
              ...data,
              pubDate: new Date(data.pubDate),
              language: data.language || lang
            }
          })
        }
      }
    }
    
    // Mock getCollection to return real episodes
    mockGetCollection.mockResolvedValue(episodes)
    
    const productionHosts = [
      { slug: 'gxjansen', name: 'Guido X Jansen', minEpisodes: 50, minGuests: 30 },
      { slug: 'ricardotayar', name: 'Ricardo Tayar', minEpisodes: 20, minGuests: 10 },
      { slug: 'michaelwitzenleiter', name: 'Michael Witzenleiter', minEpisodes: 10, minGuests: 5 },
      { slug: 'yvonneteufel', name: 'Yvonne Teufel', minEpisodes: 10, minGuests: 5 }
    ]
    
    const errors: string[] = []
    
    for (const host of productionHosts) {
      const stats = await getHostStatistics(host.slug)
      
      // Check if episodes are zero
      if (stats.totalEpisodes === 0) {
        errors.push(`❌ CRITICAL: ${host.name} (${host.slug}) has 0 episodes! This should never happen.`)
      } else if (stats.totalEpisodes < host.minEpisodes) {
        errors.push(`⚠️  WARNING: ${host.name} (${host.slug}) has only ${stats.totalEpisodes} episodes (expected at least ${host.minEpisodes})`)
      }
      
      // Check if guests are zero
      if (stats.totalGuests === 0) {
        errors.push(`❌ CRITICAL: ${host.name} (${host.slug}) has 0 guests! This should never happen.`)
      } else if (stats.totalGuests < host.minGuests) {
        errors.push(`⚠️  WARNING: ${host.name} (${host.slug}) has only ${stats.totalGuests} guests (expected at least ${host.minGuests})`)
      }
      
      // Log the actual stats for debugging
      console.log(`📊 ${host.name}: ${stats.totalEpisodes} episodes, ${stats.totalGuests} guests`)
      console.log(`   By language: EN=${stats.episodesByLanguage.en}, NL=${stats.episodesByLanguage.nl}, DE=${stats.episodesByLanguage.de}, ES=${stats.episodesByLanguage.es}`)
    }
    
    // If there are any errors, fail the test with a detailed message
    if (errors.length > 0) {
      throw new Error(`\n\nHost Statistics Validation Failed:\n${errors.join('\n')}\n\nThis is a critical error that must be fixed before deployment!`)
    }
  })
  
  // Test specific language requirements
  it('Each host should have episodes in their expected languages', async () => {
    // Mock getCollection to return real episode data
    const { getCollection } = await import('astro:content')
    const mockGetCollection = vi.mocked(getCollection)
    
    // Read real episode data from filesystem
    const episodes: any[] = []
    const episodesDir = join(process.cwd(), 'src/content/episodes')
    const languages = ['en', 'nl', 'de', 'es']
    
    for (const lang of languages) {
      const langDir = join(episodesDir, lang)
      const seasons = await readdir(langDir)
      
      for (const season of seasons) {
        if (!season.startsWith('season-')) continue
        
        const seasonDir = join(langDir, season)
        const files = await readdir(seasonDir)
        
        for (const file of files) {
          if (!file.endsWith('.mdx')) continue
          
          const filePath = join(seasonDir, file)
          const content = await readFile(filePath, 'utf-8')
          const { data } = matter(content)
          
          // Add episode in the format expected by getHostStatistics
          episodes.push({
            data: {
              ...data,
              pubDate: new Date(data.pubDate),
              language: data.language || lang
            }
          })
        }
      }
    }
    
    // Mock getCollection to return real episodes
    mockGetCollection.mockResolvedValue(episodes)
    
    const hostLanguageExpectations = [
      { slug: 'gxjansen', expectedLanguages: ['en', 'nl'] },
      { slug: 'ricardotayar', expectedLanguages: ['es'] },
      { slug: 'michaelwitzenleiter', expectedLanguages: ['de'] },
      { slug: 'yvonneteufel', expectedLanguages: ['de'] }
    ]
    
    const errors: string[] = []
    
    for (const expectation of hostLanguageExpectations) {
      const stats = await getHostStatistics(expectation.slug)
      
      for (const lang of expectation.expectedLanguages) {
        if (stats.episodesByLanguage[lang] === 0) {
          errors.push(`❌ ${expectation.slug} has no episodes in expected language: ${lang}`)
        }
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`\n\nLanguage validation failed:\n${errors.join('\n')}`)
    }
  })
})