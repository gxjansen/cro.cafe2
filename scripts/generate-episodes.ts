#!/usr/bin/env tsx
/**
 * Episode-specific content generator for NocoDB sync
 * Handles only episode content to prevent cross-contamination
 * Updated to ensure transistorId is always output as quoted string
 * Version: 1.0.3 - Fixed: Force quotes on numeric strings in YAML
 */

import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import * as yaml from 'js-yaml'
import { NocoDBWorkingClient as NocdbClient } from '../src/lib/services/nocodb-working-client.js'
import type { Language } from '../src/types/index.js'

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
            console.log(`  Deleted: ${file}`)
          } catch (error) {
            console.error(`  Failed to delete ${file}:`, error)
          }
        }
      }

      this.stats.endTime = new Date()
      const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime()

      console.log(`✅ Generated ${this.stats.episodesGenerated} episodes in ${duration}ms`)
      if (this.stats.filesDeleted > 0) {
        console.log(`🗑️ Deleted ${this.stats.filesDeleted} orphaned files`)
      }

    } catch (error) {
      this.stats.errors.push(`Generation failed: ${error instanceof Error ? error.message : String(error)}`)
      console.error('❌ Episode generation failed:', error)
    }

    return this.stats
  }

  private async ensureDirectories(): Promise<void> {
    for (const lang of this.languages) {
      const langDir = join(this.outputDir, lang)
      await fs.mkdir(langDir, { recursive: true })
      
      // Create season directories
      for (let season = 1; season <= 5; season++) {
        const seasonDir = join(langDir, `season-${season}`)
        await fs.mkdir(seasonDir, { recursive: true })
      }
    }
  }

  private async getExistingFiles(): Promise<Set<string>> {
    const files = new Set<string>()
    
    for (const lang of this.languages) {
      const langDir = join(this.outputDir, lang)
      
      try {
        // Check each season directory
        for (let season = 1; season <= 5; season++) {
          const seasonDir = join(langDir, `season-${season}`)
          
          try {
            const entries = await fs.readdir(seasonDir)
            for (const entry of entries) {
              if (entry.endsWith('.mdx')) {
                files.add(join(seasonDir, entry))
              }
            }
          } catch {
            // Season directory doesn't exist yet
          }
        }
      } catch {
        // Language directory doesn't exist yet
      }
    }
    
    return files
  }

  private async generateEpisodeMDX(episode: any): Promise<string | null> {
    const language = episode.language as Language
    if (!this.languages.includes(language)) {
      return null
    }

    const seasonDir = `season-${episode.season || 1}`
    const fileName = `episode-${String(episode.episode_number).padStart(3, '0')}-${episode.slug}.mdx`
    const filePath = join(this.outputDir, language, seasonDir, fileName)

    // Ensure directory exists
    await fs.mkdir(dirname(filePath), { recursive: true })

    // Generate MDX content
    const content = this.generateMDXContent(episode)
    
    // Write file
    await fs.writeFile(filePath, content, 'utf8')
    
    return filePath
  }

  private generateMDXContent(episode: any): string {
    // Format dates
    const publishedAt = episode.published_at ? new Date(episode.published_at).toISOString() : new Date().toISOString()
    const createdAt = episode.CreatedAt ? new Date(episode.CreatedAt).toISOString() : publishedAt
    const updatedAt = episode.UpdatedAt ? new Date(episode.UpdatedAt).toISOString() : createdAt

    // Build frontmatter - using field names that match the schema
    const frontmatter: any = {
      title: this.escapeYaml(episode.title || ''),
      description: this.escapeYaml(episode.description || episode.ai_summary || episode.summary || episode.title || ''),
      pubDate: publishedAt, // Schema expects 'pubDate' not 'publishedAt'
      season: episode.season || 1, // Schema expects 'season' not 'seasonNumber'
      episode: episode.episode_number || 0, // Schema expects 'episode' not 'episodeNumber'
      duration: this.formatDuration(episode.duration_formatted || episode.duration || '00:00'),
      audioUrl: episode.media_url || '',
      language: episode.language || 'en',
      transistorId: String(episode.transistor_id || episode.Id || ''), // Schema expects 'transistorId' not 'guid'
      episodeType: episode.episode_type || 'full',
      // Additional fields not required by schema but useful
      slug: episode.slug || '',
      keywords: this.parseKeywords(episode.ai_keywords || episode.keywords), // Schema expects array
      summary: this.escapeYaml(episode.ai_summary || episode.summary || episode.description || ''), // For SEO
      featured: episode.featured || false,
      status: episode.status || 'published',
      createdAt: createdAt,
      updatedAt: updatedAt
    }

    // Add optional fields
    if (episode.image_url) {
      frontmatter.imageUrl = episode.image_url // Schema expects 'imageUrl' not 'episodeImage'
    }

    if (episode.share_url) {
      frontmatter.shareUrl = episode.share_url
    }

    // Always include hosts and guests arrays (even if empty)
    frontmatter.hosts = []
    if (episode.host && Array.isArray(episode.host)) {
      // NocoDB returns 'host' not 'hosts'
      frontmatter.hosts = episode.host.map((host: any) => String(host.slug || host.name || host))
    } else if (episode.hosts && Array.isArray(episode.hosts)) {
      frontmatter.hosts = episode.hosts.map((host: any) => String(host.slug || host.name || host))
    }

    frontmatter.guests = []
    if (episode.guest && Array.isArray(episode.guest)) {
      // NocoDB returns 'guest' not 'guests'
      frontmatter.guests = episode.guest.map((guest: any) => String(guest.slug || guest.name || guest))
    } else if (episode.guests && Array.isArray(episode.guests)) {
      frontmatter.guests = episode.guests.map((guest: any) => String(guest.slug || guest.name || guest))
    }

    if (episode.platforms && Array.isArray(episode.platforms)) {
      frontmatter.platforms = episode.platforms.map((platform: any) => platform.slug || platform.name || platform)
    }

    // Add optional SEO fields if available
    if (episode.seo_title) {
      frontmatter.seoTitle = episode.seo_title
    }
    
    if (episode.meta_description) {
      frontmatter.metaDescription = episode.meta_description
    }
    
    if (episode.transcript || episode.ai_transcript_text) {
      frontmatter.transcript = episode.transcript || episode.ai_transcript_text
    }
    
    // Always include downloads_total (0 if not available)
    frontmatter.downloads_total = episode.downloads_total || 0
    
    // Include episode_type with underscore format (for backward compatibility)
    if (episode.episode_type) {
      frontmatter.episode_type = episode.episode_type
    }
    
    if (episode.embed_html) {
      frontmatter.embedHtml = episode.embed_html
    }
    
    if (episode.explicit !== undefined) {
      frontmatter.isExplicit = episode.explicit
    }

    // Convert frontmatter to YAML with proper string handling
    let mdxContent = '---\n'
    
    // Fields that should always be quoted even if they look like numbers
    const fieldsToQuote = ['transistorId', 'slug', 'episodeType', 'language', 'status']
    
    // Use js-yaml to dump the frontmatter
    let yamlStr = yaml.dump(frontmatter, {
      lineWidth: -1, // Disable line wrapping
      noRefs: true,
      sortKeys: false,
      quotingType: '"',
      styles: {
        '!!str': 'literal' // Use literal style for multiline strings
      }
    })
    
    // Post-process to ensure specific fields are quoted
    // This regex approach ensures numeric-looking values are quoted for specific fields
    fieldsToQuote.forEach(field => {
      // Match the field at the beginning of a line, followed by colon and space, then capture the value
      const regex = new RegExp(`^(${field}:\\s+)(\\d+)$`, 'gm')
      yamlStr = yamlStr.replace(regex, '$1"$2"')
    })
    
    mdxContent += yamlStr
    mdxContent += '---\n\n'

    // Add show notes if available
    if (episode.show_notes) {
      mdxContent += '## Show Notes\n\n'
      mdxContent += episode.show_notes + '\n\n'
    }

    return mdxContent
  }

  private escapeYaml(value: string): string {
    if (!value || value === '') return '""'  // Return empty quoted string for empty values
    
    // For multiline content or content with special characters, use literal block scalar
    if (value.includes('\n') || value.includes('"') || value.includes("'") || 
        value.includes('<') || value.includes('>') || value.includes('&') ||
        value.includes('\\') || value.length > 80) {
      // Use literal block scalar (|) for complex content
      // This preserves the content exactly as-is without escaping
      return `|\n  ${value.replace(/\n/g, '\n  ')}`
    }
    
    // For simple strings with special YAML characters, quote them
    if (value.includes(':') || value.includes('#') || value.includes('|') || 
        value.includes('-') || value.includes('*') || value.includes('!') || 
        value.includes('%') || value.includes('@') || value.includes('`') ||
        value.startsWith(' ') || value.endsWith(' ')) {
      // Simple quoting without escaping for basic special characters
      return `"${value}"`
    }
    
    return value
  }

  private formatDuration(duration: string | number): string {
    if (typeof duration === 'string') {
      return duration
    }
    
    // Convert seconds to MM:SS
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  private parseKeywords(keywords: string | string[] | null | undefined): string[] {
    if (!keywords) return []
    
    // If it's already an array, return it
    if (Array.isArray(keywords)) return keywords
    
    // If it's a string, split by comma and clean up
    if (typeof keywords === 'string') {
      return keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
    }
    
    return []
  }

}

// CLI handling
async function main() {
  console.log('🚀 CROCAFE Episode Generator')
  console.log('===========================')

  try {
    // Get environment variables
    const baseUrl = process.env.NOCODB_BASE_URL
    const apiKey = process.env.NOCODB_API_KEY
    const baseId = process.env.NOCODB_BASE_ID

    if (!baseUrl || !apiKey || !baseId) {
      throw new Error('Missing required environment variables: NOCODB_BASE_URL, NOCODB_API_KEY, NOCODB_BASE_ID')
    }

    // Parse command line arguments
    const args = process.argv.slice(2)
    let languages: Language[] = ['en', 'nl', 'de', 'es']
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--languages' && args[i + 1]) {
        languages = args[i + 1].split(',') as Language[]
        i++
      }
    }

    console.log('🔗 Connecting to NocoDB...')
    console.log(`📍 Base URL: ${baseUrl}`)
    console.log(`🆔 Base ID: ${baseId}`)
    console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`)

    // Initialize NocoDB client
    const client = new NocdbClient({
      baseUrl,
      apiKey,
      baseId
    })

    // Initialize generator
    const generator = new EpisodeGenerator(client, { languages })

    // Generate episodes
    const stats = await generator.generate()

    // Output for GitHub Action
    console.log(`✅ Generated ${stats.episodesGenerated} episodes`)

    if (stats.errors.length > 0) {
      console.error(`\n⚠️ Errors (${stats.errors.length}):`)
      stats.errors.forEach((error, index) => {
        console.error(`${index + 1}. ${error}`)
      })
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Episode generation failed:')
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// Run the script
main().catch(console.error)