import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import type { Language } from '../../types/index'
import { NocoDBAPIClient } from '../services/nocodb-api-client'

/**
 * Simple Content Generation Engine for GitHub Actions
 * Uses direct NocoDB API calls instead of MCP
 */

interface ContentGenerationConfig {
  outputDir: string
  overwriteExisting: boolean
  languages: Language[]
  defaultLanguage: Language
}

interface GenerationStats {
  episodesGenerated: number
  guestsGenerated: number
  hostsGenerated: number
  platformsGenerated: number
  errors: string[]
  startTime: Date
  endTime?: Date
}

export class SimpleContentGenerator {
  private client: NocoDBAPIClient
  private config: ContentGenerationConfig
  private stats: GenerationStats

  constructor(
    client: NocoDBAPIClient,
    config: Partial<ContentGenerationConfig> = {}
  ) {
    this.client = client
    this.config = {
      outputDir: 'src/content',
      overwriteExisting: false,
      languages: ['en', 'nl', 'de', 'es'],
      defaultLanguage: 'en',
      ...config
    }
    
    this.stats = {
      episodesGenerated: 0,
      guestsGenerated: 0,
      hostsGenerated: 0,
      platformsGenerated: 0,
      errors: [],
      startTime: new Date()
    }
  }

  async generateAll(): Promise<GenerationStats> {
    console.log('🚀 Starting simple content generation...')
    
    try {
      // Test connection first
      const connected = await this.client.testConnection()
      if (!connected) {
        throw new Error('Failed to connect to NocoDB')
      }

      // Create output directories
      await this.ensureDirectories()

      // Generate content by type
      await this.generateEpisodes()
      await this.generateGuests()
      await this.generateHosts()
      await this.generatePlatforms()

      this.stats.endTime = new Date()
      const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime()
      
      console.log(`✅ Content generation complete in ${duration}ms`)
      console.log(`📊 Generated: ${this.stats.episodesGenerated} episodes, ${this.stats.guestsGenerated} guests, ${this.stats.hostsGenerated} hosts, ${this.stats.platformsGenerated} platforms`)
      
      if (this.stats.errors.length > 0) {
        console.log(`⚠️ ${this.stats.errors.length} errors occurred:`)
        this.stats.errors.forEach(error => console.log(`  - ${error}`))
      }

    } catch (error) {
      this.stats.errors.push(`Generation failed: ${error instanceof Error ? error.message : String(error)}`)
      console.error('❌ Content generation failed:', error)
    }

    return this.stats
  }

  private async generateEpisodes(): Promise<void> {
    console.log('📝 Generating episodes...')
    
    const episodes = await this.client.getEpisodes({ limit: 1000 })

    for (const episode of episodes) {
      try {
        await this.generateEpisodeMDX(episode)
        this.stats.episodesGenerated++
      } catch (error) {
        const errorMsg = `Failed to generate episode ${episode.id}: ${error instanceof Error ? error.message : String(error)}`
        this.stats.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }
  }

  private async generateEpisodeMDX(episode: any): Promise<void> {
    const language = episode.language as Language || this.config.defaultLanguage
    const seasonDir = `season-${episode.season || 1}`
    const episodePath = join(
      this.config.outputDir,
      'episodes',
      language,
      seasonDir,
      `episode-${String(episode.episodeNumber || episode.id).padStart(3, '0')}-${episode.slug}.mdx`
    )

    // Check if file exists and shouldn't overwrite
    if (!this.config.overwriteExisting && await this.fileExists(episodePath)) {
      return
    }

    const frontmatter = this.generateEpisodeFrontmatter(episode)
    const content = this.generateEpisodeContent(episode)
    const mdxContent = `---\n${frontmatter}\n---\n\n${content}`

    await this.ensureDirectoryExists(dirname(episodePath))
    await fs.writeFile(episodePath, mdxContent, 'utf8')
  }

  private generateEpisodeFrontmatter(episode: any): string {
    const hosts = Array.isArray(episode.hosts) ? episode.hosts.map((h: any) => h.slug || h.name) : []
    const guests = Array.isArray(episode.guests) ? episode.guests.map((g: any) => g.slug || g.name) : []
    const platforms = Array.isArray(episode.platforms) ? episode.platforms.map((p: any) => p.slug || p.name) : []

    return [
      `title: "${this.escapeYaml(episode.title || '')}"`,
      `slug: "${episode.slug || ''}"`,
      `description: "${this.escapeYaml(episode.description || '')}"`,
      `summary: "${this.escapeYaml(episode.summary || '')}"`,
      `episodeNumber: ${episode.episodeNumber || 0}`,
      `season: ${episode.season || 1}`,
      `language: "${episode.language || this.config.defaultLanguage}"`,
      `duration: ${episode.duration || 0}`,
      `mediaUrl: "${episode.mediaUrl || ''}"`,
      `publishedAt: ${episode.publishedAt ? new Date(episode.publishedAt).toISOString() : 'null'}`,
      `status: "${episode.status || 'draft'}"`,
      `transistorId: "${episode.transistorId || ''}"`,
      `hosts: [${hosts.map(h => `"${h}"`).join(', ')}]`,
      `guests: [${guests.map(g => `"${g}"`).join(', ')}]`,
      `platforms: [${platforms.map(p => `"${p}"`).join(', ')}]`,
      episode.aiKeywords ? `keywords: "${this.escapeYaml(episode.aiKeywords)}"` : '',
      episode.aiSummary ? `aiSummary: "${this.escapeYaml(episode.aiSummary)}"` : '',
      `createdAt: ${new Date(episode.createdAt || Date.now()).toISOString()}`,
      `updatedAt: ${new Date(episode.updatedAt || Date.now()).toISOString()}`
    ].filter(Boolean).join('\n')
  }

  private generateEpisodeContent(episode: any): string {
    const content = []

    if (episode.description) {
      content.push(episode.description)
      content.push('')
    }

    if (episode.aiTranscriptText) {
      content.push('## Transcript')
      content.push('')
      content.push(episode.aiTranscriptText)
      content.push('')
    }

    if (episode.showNotes) {
      content.push('## Show Notes')
      content.push('')
      content.push(episode.showNotes)
      content.push('')
    }

    return content.join('\n')
  }

  private async generateGuests(): Promise<void> {
    console.log('👥 Generating guests...')
    
    const guests = await this.client.getGuests({ limit: 1000 })

    for (const guest of guests) {
      try {
        await this.generateGuestMDX(guest)
        this.stats.guestsGenerated++
      } catch (error) {
        const errorMsg = `Failed to generate guest ${guest.id}: ${error instanceof Error ? error.message : String(error)}`
        this.stats.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }
  }

  private async generateGuestMDX(guest: any): Promise<void> {
    const guestPath = join(this.config.outputDir, 'guests', `${guest.slug}.mdx`)

    if (!this.config.overwriteExisting && await this.fileExists(guestPath)) {
      return
    }

    const frontmatter = this.generateGuestFrontmatter(guest)
    const content = this.generateGuestContent(guest)
    const mdxContent = `---\n${frontmatter}\n---\n\n${content}`

    await this.ensureDirectoryExists(dirname(guestPath))
    await fs.writeFile(guestPath, mdxContent, 'utf8')
  }

  private generateGuestFrontmatter(guest: any): string {
    const episodes = Array.isArray(guest.episodes) ? guest.episodes.map((e: any) => e.slug || e.id) : []
    const languages = Array.isArray(guest.languages) ? guest.languages : [this.config.defaultLanguage]

    return [
      `name: "${this.escapeYaml(guest.name || '')}"`,
      `slug: "${guest.slug || ''}"`,
      `bio: "${this.escapeYaml(guest.bio || '')}"`,
      guest.company ? `company: "${this.escapeYaml(guest.company)}"` : '',
      guest.role ? `role: "${this.escapeYaml(guest.role)}"` : '',
      `episodeCount: ${guest.episodeCount || 0}`,
      `episodes: [${episodes.map(e => `"${e}"`).join(', ')}]`,
      `languages: [${languages.map(l => `"${l}"`).join(', ')}]`,
      `socialLinks: ${JSON.stringify(guest.socialLinks || [])}`,
      `createdAt: ${new Date(guest.createdAt || Date.now()).toISOString()}`,
      `updatedAt: ${new Date(guest.updatedAt || Date.now()).toISOString()}`
    ].filter(Boolean).join('\n')
  }

  private generateGuestContent(guest: any): string {
    const content = []

    if (guest.bio) {
      content.push(guest.bio)
      content.push('')
    }

    if (guest.company || guest.role) {
      content.push('## Professional Background')
      content.push('')
      if (guest.company) content.push(`**Company**: ${guest.company}`)
      if (guest.role) content.push(`**Role**: ${guest.role}`)
      content.push('')
    }

    return content.join('\n')
  }

  private async generateHosts(): Promise<void> {
    console.log('🎙️ Generating hosts...')
    
    const hosts = await this.client.getHosts({ limit: 100 })

    for (const host of hosts) {
      try {
        await this.generateHostMDX(host)
        this.stats.hostsGenerated++
      } catch (error) {
        const errorMsg = `Failed to generate host ${host.id}: ${error instanceof Error ? error.message : String(error)}`
        this.stats.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }
  }

  private async generateHostMDX(host: any): Promise<void> {
    const hostPath = join(this.config.outputDir, 'hosts', `${host.slug}.mdx`)

    if (!this.config.overwriteExisting && await this.fileExists(hostPath)) {
      return
    }

    const frontmatter = this.generateHostFrontmatter(host)
    const content = host.bio || ''
    const mdxContent = `---\n${frontmatter}\n---\n\n${content}`

    await this.ensureDirectoryExists(dirname(hostPath))
    await fs.writeFile(hostPath, mdxContent, 'utf8')
  }

  private generateHostFrontmatter(host: any): string {
    const episodes = Array.isArray(host.episodes) ? host.episodes.map((e: any) => e.slug || e.id) : []

    return [
      `name: "${this.escapeYaml(host.name || '')}"`,
      `slug: "${host.slug || ''}"`,
      `bio: "${this.escapeYaml(host.bio || '')}"`,
      `episodes: [${episodes.map(e => `"${e}"`).join(', ')}]`,
      `socialLinks: ${JSON.stringify(host.socialLinks || [])}`,
      `createdAt: ${new Date(host.createdAt || Date.now()).toISOString()}`,
      `updatedAt: ${new Date(host.updatedAt || Date.now()).toISOString()}`
    ].filter(Boolean).join('\n')
  }

  private async generatePlatforms(): Promise<void> {
    console.log('🎵 Generating platforms...')
    
    const platforms = await this.client.getPlatforms({ limit: 100 })

    for (const platform of platforms) {
      try {
        await this.generatePlatformJSON(platform)
        this.stats.platformsGenerated++
      } catch (error) {
        const errorMsg = `Failed to generate platform ${platform.id}: ${error instanceof Error ? error.message : String(error)}`
        this.stats.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }
  }

  private async generatePlatformJSON(platform: any): Promise<void> {
    const platformPath = join(this.config.outputDir, 'platforms', `${platform.slug}.json`)

    if (!this.config.overwriteExisting && await this.fileExists(platformPath)) {
      return
    }

    const platformData = {
      name: platform.name,
      slug: platform.slug,
      displayOrder: platform.displayOrder,
      isActive: platform.isActive,
      urls: platform.urls,
      createdAt: new Date(platform.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(platform.updatedAt || Date.now()).toISOString()
    }

    await this.ensureDirectoryExists(dirname(platformPath))
    await fs.writeFile(platformPath, JSON.stringify(platformData, null, 2), 'utf8')
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      join(this.config.outputDir, 'episodes'),
      join(this.config.outputDir, 'guests'),
      join(this.config.outputDir, 'hosts'),
      join(this.config.outputDir, 'platforms')
    ]

    // Create language-specific episode directories
    for (const lang of this.config.languages) {
      dirs.push(join(this.config.outputDir, 'episodes', lang))
    }

    for (const dir of dirs) {
      await this.ensureDirectoryExists(dir)
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

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  private escapeYaml(str: string): string {
    if (!str) return ''
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n')
  }

  getStats(): GenerationStats {
    return { ...this.stats }
  }
}