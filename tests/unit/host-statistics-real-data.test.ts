import { describe, it, expect, vi } from 'vitest'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'

// Test with real episode data from filesystem
describe('Host Statistics with Real Data', () => {
  it('should correctly count episodes for each host using real data', async () => {
    const episodesDir = join(process.cwd(), 'src/content/episodes')
    const languages = ['en', 'nl', 'de', 'es']
    
    const hostEpisodes: Record<string, number> = {
      'gxjansen': 0,
      'ricardotayar': 0,
      'michaelwitzenleiter': 0,
      'yvonneteufel': 0
    }
    
    const hostGuests: Record<string, Set<string>> = {
      'gxjansen': new Set(),
      'ricardotayar': new Set(),
      'michaelwitzenleiter': new Set(),
      'yvonneteufel': new Set()
    }
    
    // Read all episode files
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
          
          // Only count published episodes
          if (data.status !== 'published') continue
          
          // Count episodes for each host
          if (data.hosts && Array.isArray(data.hosts)) {
            for (const host of data.hosts) {
              if (hostEpisodes.hasOwnProperty(host)) {
                hostEpisodes[host]++
                
                // Add guests to the host's unique guests set
                if (data.guests && Array.isArray(data.guests)) {
                  data.guests.forEach((guest: string) => {
                    hostGuests[host].add(guest)
                  })
                }
              }
            }
          }
        }
      }
    }
    
    // Log results for debugging
    console.log('\nHost Episode Counts:')
    for (const [host, count] of Object.entries(hostEpisodes)) {
      const guestCount = hostGuests[host].size
      console.log(`  ${host}: ${count} episodes, ${guestCount} unique guests`)
    }
    
    // Assertions
    expect(hostEpisodes['gxjansen']).toBeGreaterThan(50)
    expect(hostEpisodes['ricardotayar']).toBeGreaterThan(10)
    expect(hostEpisodes['michaelwitzenleiter']).toBeGreaterThan(5)
    expect(hostEpisodes['yvonneteufel']).toBeGreaterThan(5)
    
    // Check guests
    expect(hostGuests['gxjansen'].size).toBeGreaterThan(30)
    expect(hostGuests['ricardotayar'].size).toBeGreaterThan(5)
    expect(hostGuests['michaelwitzenleiter'].size).toBeGreaterThan(3)
    expect(hostGuests['yvonneteufel'].size).toBeGreaterThan(3)
  })
})