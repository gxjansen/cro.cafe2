#!/usr/bin/env tsx
/**
 * Episode-specific content generator for NocoDB sync
 * Handles only episode content to prevent cross-contamination
 */

import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { NocoDBAPIClient as NocdbClient } from '../src/lib/services/nocodb-api-client'
import type { Language } from '../src/types'

interface EpisodeGenerationStats {
  episodesGenerated: number
  filesDeleted: number
  errors: string[]
  startTime: Date
  endTime?: Date
}

interface EpisodeGenerationConfig {
  languages?: Language[]
}

class EpisodeGenerator {
  private client: NocdbClient
  private outputDir: string
  private stats: EpisodeGenerationStats
  private languages: Language[]

  constructor(client: NocdbClient, config: EpisodeGenerationConfig = {}) {
    this.client = client
    this.outputDir = 'src/content/episodes'
    this.languages = config.languages || ['en', 'nl', 'de', 'es']
    this.stats = {
      episodesGenerated: 0,
      filesDeleted: 0,
      errors: [],
      startTime: new Date()
    }
  }

  async generate(): Promise<EpisodeGenerationStats> {
    console.log('📝 Starting episode generation...')
    console.log(`🌍 Languages: ${this.languages.join(', ')}`)
    
    try {
      // Test connection
      const connected = await this.client.testConnection()
      if (!connected) {
        throw new Error('Failed to connect to NocoDB')
      }

      // Create output directories
      await this.ensureDirectories()

      // Get existing episode files
      const existingFiles = await this.getExistingFiles()
      console.log(`📁 Found ${existingFiles.size} existing episode files`)

      // Fetch episodes from NocoDB
      console.log('📥 Fetching episodes from NocoDB...')
      const episodes = await this.client.getEpisodes({ limit: 1000 })
      console.log(`📊 Found ${episodes.length} episodes in NocoDB`)

      // Filter episodes by language if specified
      const filteredEpisodes = this.languages.includes('en' as Language) && 
                               this.languages.includes('nl' as Language) && 
                               this.languages.includes('de' as Language) && 
                               this.languages.includes('es' as Language)
        ? episodes
        : episodes.filter(ep => this.languages.includes(ep.language as Language))
      
      console.log(`🔍 Processing ${filteredEpisodes.length} episodes for selected languages`)

      // Generate episode files
      const generatedFiles = new Set<string>()
      for (const episode of filteredEpisodes) {
        try {
          const filePath = await this.generateEpisodeMDX(episode)
          if (filePath) {
            generatedFiles.add(filePath)
            this.stats.episodesGenerated++
          }
        } catch (error) {
          const errorMsg = `Failed to generate episode ${episode.Id}: ${error instanceof Error ? error.message : String(error)}`
          this.stats.errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      // Delete orphaned files (only for the languages we're processing)
      const filesToDelete = Array.from(existingFiles).filter(file => {
        // Only delete files for languages we're processing
        const isRelevantLanguage = this.languages.some(lang => file.includes(`/episodes/${lang}/`))
        return isRelevantLanguage && !generatedFiles.has(file)
      })
      
      if (filesToDelete.length > 0) {
        console.log(`🗑️ Found ${filesToDelete.length} orphaned episode files to delete`)
        for (const file of filesToDelete) {
          try {
            await fs.unlink(file)
            this.stats.filesDeleted++
            console.log(`  - Deleted: ${file}`)
          } catch (error) {
            console.error(`Failed to delete ${file}:`, error)
          }
        }
      }

      this.stats.endTime = new Date()
      const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime()
      
      console.log(`✅ Episode generation complete in ${duration}ms`)
      console.log(`✅ Generated ${this.stats.episodesGenerated} episodes`)
      
      if (this.stats.filesDeleted > 0) {
        console.log(`🗑️ Deleted ${this.stats.filesDeleted} orphaned files`)
      }
      
      if (this.stats.errors.length > 0) {
        console.log(`⚠️ ${this.stats.errors.length} errors occurred`)
      }

    } catch (error) {
      this.stats.errors.push(`Generation failed: ${error instanceof Error ? error.message : String(error)}`)
      console.error('❌ Episode generation failed:', error)
    }

    return this.stats
  }

  private async generateEpisodeMDX(episode: any): Promise<string> {
    if (!episode.slug && !episode.Id) {
      throw new Error('Episode missing both slug and ID - cannot generate file')
    }
    
    if (!episode.title) {
      console.warn(`Warning: Episode ${episode.Id} missing title`)
    }
    
    const language = episode.language as Language || 'en'
    const seasonDir = `season-${episode.season || 1}`
    const episodePath = join(
      this.outputDir,
      language,
      seasonDir,
      `episode-${String(episode.episode_number || episode.Id).padStart(3, '0')}-${episode.slug || `episode-${episode.Id}`}.mdx`
    )

    const frontmatter = this.generateEpisodeFrontmatter(episode)
    const content = this.generateEpisodeContent(episode)
    const mdxContent = `---\n${frontmatter}\n---\n\n${content}`

    await this.ensureDirectoryExists(dirname(episodePath))
    await fs.writeFile(episodePath, mdxContent, 'utf8')
    
    console.log(`📝 Created episode: ${language}/${seasonDir}/${episode.slug || episode.Id}`)
    
    return episodePath
  }

  private generateEpisodeFrontmatter(episode: any): string {
    // Extract hosts from relationship data and deduplicate
    const hostData: Array<{slug?: string, name?: string}> = []
    
    if (episode.host && Array.isArray(episode.host)) {
      episode.host.forEach((h: any) => {
        hostData.push({ slug: h.slug, name: h.name })
      })
    }
    
    if (episode._nc_m2m_Episodes_Hosts && Array.isArray(episode._nc_m2m_Episodes_Hosts)) {
      episode._nc_m2m_Episodes_Hosts.forEach((rel: any) => {
        if (rel.Hosts) {
          hostData.push({ slug: rel.Hosts.slug, name: rel.Hosts.name })
        }
      })
    }
    
    // Deduplicate hosts
    const nameToSlugMap = new Map<string, string>()
    const finalHostsSet = new Set<string>()
    
    hostData.forEach(h => {
      if (h.slug && h.name) {
        nameToSlugMap.set(h.name, h.slug)
      }
    })
    
    hostData.forEach(h => {
      if (h.slug) {
        finalHostsSet.add(h.slug)
      } else if (h.name) {
        const slug = nameToSlugMap.get(h.name)
        finalHostsSet.add(slug || h.name)
      }
    })
    
    const hosts = Array.from(finalHostsSet)

    // Extract guests similarly
    const guestData: Array<{slug?: string, name?: string}> = []
    
    if (episode.guest && Array.isArray(episode.guest)) {
      episode.guest.forEach((g: any) => {
        guestData.push({ slug: g.slug, name: g.name })
      })
    }
    
    if (episode._nc_m2m_Episodes_Guests && Array.isArray(episode._nc_m2m_Episodes_Guests)) {
      episode._nc_m2m_Episodes_Guests.forEach((rel: any) => {
        if (rel.Guests) {
          guestData.push({ slug: rel.Guests.slug, name: rel.Guests.name })
        }
      })
    }
    
    // Deduplicate guests
    const guestNameToSlugMap = new Map<string, string>()
    const finalGuestsSet = new Set<string>()
    
    guestData.forEach(g => {
      if (g.slug && g.name) {
        guestNameToSlugMap.set(g.name, g.slug)
      }
    })
    
    guestData.forEach(g => {
      if (g.slug) {
        finalGuestsSet.add(g.slug)
      } else if (g.name) {
        const slug = guestNameToSlugMap.get(g.name)
        finalGuestsSet.add(slug || g.name)
      }
    })
    
    const guests = Array.from(finalGuestsSet)

    // Clean description and summary
    const cleanDescription = this.cleanHtmlForYaml(episode.formatted_description || episode.description || '')
    const cleanSummary = this.cleanHtmlForYaml(episode.formatted_summary || episode.summary || '')
    
    // Get duration in seconds
    let durationInSeconds = '0'
    
    if (episode.duration_seconds && !episode.duration_seconds.toString().includes(':')) {
      durationInSeconds = episode.duration_seconds.toString()
    } else if (episode.Duration && !episode.Duration.toString().includes(':')) {
      durationInSeconds = episode.Duration.toString()
    } else if (episode.duration && !episode.duration.toString().includes(':')) {
      durationInSeconds = episode.duration.toString()
    } else {
      // Convert MM:SS to seconds as fallback
      const formatted = episode.duration || episode.Duration || episode.duration_formatted || '0'
      if (formatted.toString().includes(':')) {
        const parts = formatted.toString().split(':')
        if (parts.length === 2) {
          const minutes = parseInt(parts[0], 10) || 0
          const seconds = parseInt(parts[1], 10) || 0
          durationInSeconds = (minutes * 60 + seconds).toString()
        }
      }
    }

    return [
      `title: "${this.escapeYaml(episode.title || '')}"`,
      `slug: "${episode.slug || ''}"`,
      `description: "${cleanDescription}"`,
      `summary: "${cleanSummary}"`,
      `episode: ${episode.episode_number || 0}`,
      `season: ${episode.season || 1}`,
      `language: "${episode.language || 'en'}"`,
      `duration: "${durationInSeconds}"`,
      `audioUrl: "${episode.media_url || ''}"`,
      episode.image_url ? `imageUrl: "${episode.image_url}"` : '',
      `pubDate: ${episode.published_at ? new Date(episode.published_at).toISOString() : new Date().toISOString()}`,
      `transistorId: "${episode.transistor_id || ''}"`,
      episode.downloads_total ? `downloads_total: ${episode.downloads_total}` : '',
      `status: "${episode.status || 'published'}"`,
      `hosts: [${hosts.map(h => `"${h}"`).join(', ')}]`,
      `guests: [${guests.map(g => `"${g}"`).join(', ')}]`,
      episode.ai_keywords ? `keywords: "${this.escapeYaml(episode.ai_keywords)}"` : '',
      episode.ai_summary ? `aiSummary: "${this.escapeYaml(episode.ai_summary)}"` : '',
      `createdAt: ${new Date(episode.CreatedAt || Date.now()).toISOString()}`,
      `updatedAt: ${new Date(episode.UpdatedAt || Date.now()).toISOString()}`
    ].filter(Boolean).join('\n')
  }

  private generateEpisodeContent(episode: any): string {
    const content = []

    const description = episode.formatted_description || episode.description
    if (description) {
      content.push(this.cleanHtmlContent(description))
      content.push('')
    }

    if (episode.ai_transcript_text) {
      content.push('## Transcript')
      content.push('')
      content.push(episode.ai_transcript_text)
      content.push('')
    }

    if (episode.show_notes) {
      content.push('## Show Notes')
      content.push('')
      content.push(episode.show_notes)
      content.push('')
    }

    return content.join('\n')
  }

  private async getExistingFiles(): Promise<Set<string>> {
    const files = new Set<string>()
    
    for (const lang of this.languages) {
      const langDir = join(this.outputDir, lang)
      try {
        await this.scanDirectory(langDir, files)
      } catch (error) {
        // Language directory might not exist yet
      }
    }
    
    return files
  }

  private async scanDirectory(dir: string, files: Set<string>): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, files)
        } else if (entry.name.endsWith('.mdx')) {
          files.add(fullPath)
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  private async ensureDirectories(): Promise<void> {
    for (const lang of this.languages) {
      const langDir = join(this.outputDir, lang)
      await this.ensureDirectoryExists(langDir)
    }
  }

  private async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch (error) {
      if ((error as any).code !== 'EEXIST') {
        throw error
      }
    }
  }

  private cleanHtmlContent(html: string): string {
    if (!html) return ''
    return html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<ul>/g, '\n')
      .replace(/<\/ul>/g, '\n')
      .replace(/<ol>/g, '\n')
      .replace(/<\/ol>/g, '\n')
      .replace(/<li>/g, '- ')
      .replace(/<\/li>/g, '\n')
      .replace(/<div>/g, '')
      .replace(/<\/div>/g, '\n')
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<(\w+)([^>]*)>/g, '<$1>')
      .replace(/<strong>/g, '**')
      .replace(/<\/strong>/g, '**')
      .replace(/<b>/g, '**')
      .replace(/<\/b>/g, '**')
      .replace(/<em>/g, '*')
      .replace(/<\/em>/g, '*')
      .replace(/<i>/g, '*')
      .replace(/<\/i>/g, '*')
      .replace(/<[^>]+>/g, '')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  private cleanHtmlForYaml(html: string): string {
    if (!html) return ''
    const cleaned = this.cleanHtmlContent(html)
    return this.escapeYaml(cleaned)
  }

  private escapeYaml(str: string): string {
    if (!str) return ''
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
  }
}

// Parse command line arguments
function parseArgs(): EpisodeGenerationConfig {
  const args = process.argv.slice(2)
  const config: EpisodeGenerationConfig = {}
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--languages' && i + 1 < args.length) {
      const langs = args[i + 1].split(',').map(l => l.trim()) as Language[]
      config.languages = langs
      i++
    }
  }
  
  return config
}

// Main execution
async function main() {
  try {
    const apiKey = process.env.NOCODB_API_KEY
    const baseUrl = process.env.NOCODB_BASE_URL
    const baseId = process.env.NOCODB_BASE_ID

    if (!apiKey || !baseUrl || !baseId) {
      throw new Error('Missing required environment variables: NOCODB_API_KEY, NOCODB_BASE_URL, NOCODB_BASE_ID')
    }

    const config = parseArgs()

    const client = new NocdbClient({
      apiKey,
      baseUrl,
      baseId
    })

    const generator = new EpisodeGenerator(client, config)
    const stats = await generator.generate()

    // Exit with error if there were any errors
    if (stats.errors.length > 0) {
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}