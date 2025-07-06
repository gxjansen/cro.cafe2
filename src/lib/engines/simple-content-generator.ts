import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import type { Language } from '../../types/index'
import { DeletionTracker } from './deletion-tracker.js'
import { sanitizeImageFilename, needsSanitization } from '../utils/filename-sanitizer.js'

/**
 * Simple Content Generation Engine for GitHub Actions
 * Uses direct NocoDB API calls instead of MCP
 * Includes improved deduplication for hosts/guests and YAML escaping
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
  filesDeleted: number
  errors: string[]
  startTime: Date
  endTime?: Date
}

export class SimpleContentGenerator {
  private client: any // Accept any NocoDB client implementation
  private config: ContentGenerationConfig
  private stats: GenerationStats

  constructor(
    client: any, // Accept any NocoDB client implementation
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
      filesDeleted: 0,
      errors: [],
      startTime: new Date()
    }
  }

  async generateAll(): Promise<GenerationStats> {
    console.log('🚀 Starting simple content generation...')

    // Reset stats for this generation run
    this.stats = {
      episodesGenerated: 0,
      guestsGenerated: 0,
      hostsGenerated: 0,
      platformsGenerated: 0,
      filesDeleted: 0,
      errors: [],
      startTime: new Date()
    }

    try {
      // Test connection first
      const connected = await this.client.testConnection()
      if (!connected) {
        throw new Error('Failed to connect to NocoDB')
      }

      // Create output directories
      await this.ensureDirectories()

      // Initialize deletion tracker
      const deletionTracker = new DeletionTracker(this.config.outputDir)

      // Get existing content files mapped by ID/slug BEFORE generation
      const existingContentMap = await deletionTracker.getExistingContentMap()
      console.log(`📁 Found ${existingContentMap.size} existing content files`)

      // Fetch all records from NocoDB to track what should exist
      console.log('📥 Fetching all records from NocoDB...')
      const [episodes, guests, hosts, platforms] = await Promise.all([
        this.client.getEpisodes({ limit: 1000 }),
        this.client.getGuests({ limit: 1000 }),
        this.client.getHosts({ limit: 100 }),
        this.client.getPlatforms({ limit: 100 })
      ])

      console.log(`📊 NocoDB records: ${episodes.length} episodes, ${guests.length} guests, ${hosts.length} hosts, ${platforms.length} platforms`)

      // Generate content by type and collect generated files
      const generatedFiles = new Set<string>()
      await this.generateEpisodesWithTracking(episodes, generatedFiles)
      await this.generateGuestsWithTracking(guests, generatedFiles)
      await this.generateHostsWithTracking(hosts, generatedFiles)
      await this.generatePlatformsWithTracking(platforms, generatedFiles)

      console.log(`📝 Generated ${generatedFiles.size} files in this sync`)

      // Identify files to delete based on active records
      const filesToDelete = await deletionTracker.getFilesToDelete(existingContentMap, {
        episodes,
        guests,
        hosts,
        platforms
      })

      if (filesToDelete.length > 0) {
        console.log(`🗑️ Found ${filesToDelete.length} orphaned files to delete:`)
        filesToDelete.forEach(file => console.log(`  - ${file}`))

        // Delete orphaned files
        this.stats.filesDeleted = await deletionTracker.deleteOrphanedFiles(filesToDelete)
      } else {
        console.log('✅ No orphaned files to clean up')
      }

      this.stats.endTime = new Date()
      const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime()

      console.log(`✅ Content generation complete in ${duration}ms`)
      console.log(`📊 Generated: ${this.stats.episodesGenerated} episodes, ${this.stats.guestsGenerated} guests, ${this.stats.hostsGenerated} hosts, ${this.stats.platformsGenerated} platforms`)
      if (this.stats.filesDeleted > 0) {
        console.log(`🗑️ Deleted: ${this.stats.filesDeleted} orphaned files`)
      }

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

  private async generateEpisodesWithTracking(episodes: any[], generatedFiles: Set<string>): Promise<void> {
    console.log('📝 Generating episodes...')

    for (const episode of episodes) {
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
  }

  private async generateEpisodeMDX(episode: any): Promise<string> {
    // Validate required fields
    if (!episode.slug && !episode.Id) {
      throw new Error('Episode missing both slug and ID - cannot generate file')
    }

    if (!episode.title) {
      console.warn(`Warning: Episode ${episode.Id} missing title`)
    }

    const language = episode.language as Language || this.config.defaultLanguage
    const seasonDir = `season-${episode.season || 1}`
    const episodePath = join(
      this.config.outputDir,
      'episodes',
      language,
      seasonDir,
      `episode-${String(episode.episode_number || episode.Id).padStart(3, '0')}-${episode.slug || `episode-${episode.Id}`}.mdx`
    )

    // Always overwrite to ensure updates are synced
    // This ensures content changes in NocoDB are reflected in the files

    const frontmatter = this.generateEpisodeFrontmatter(episode)
    const content = this.generateEpisodeContent(episode)
    const mdxContent = `---\n${frontmatter}\n---\n\n${content}`

    await this.ensureDirectoryExists(dirname(episodePath))
    await fs.writeFile(episodePath, mdxContent, 'utf8')

    return episodePath
  }

  private generateEpisodeFrontmatter(episode: any): string {
    // Debug: Log episode structure for the first episode to check for status field
    if (episode.Id === 1 || episode.episode_number === 1) {
      console.log('📊 Sample episode data structure:', JSON.stringify(episode, null, 2))
    }

    // Debug duration fields to ensure we're using the right one (only for first few episodes)
    if (this.stats.episodesGenerated < 5) {
      console.log(`🔍 Episode ${episode.Id || episode.episode_number} duration fields:`, {
        duration: episode.duration,
        duration_formatted: episode.duration_formatted,
        Duration: episode.Duration,
        'Duration Formatted': episode['Duration Formatted'],
        duration_seconds: episode.duration_seconds,
        allKeys: Object.keys(episode).filter(k => k.toLowerCase().includes('duration'))
      })
    }

    // Extract hosts from relationship data and deduplicate
    // Collect all host data first to find slugs
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

    // Create a map of names to slugs for deduplication
    const nameToSlugMap = new Map<string, string>()
    const finalHostsSet = new Set<string>()

    // First pass: collect all name->slug mappings
    hostData.forEach(h => {
      if (h.slug && h.name) {
        nameToSlugMap.set(h.name, h.slug)
      }
    })

    // Second pass: add hosts, preferring slugs
    hostData.forEach(h => {
      if (h.slug) {
        finalHostsSet.add(h.slug)
      } else if (h.name) {
        // Check if we have a slug for this name
        const slug = nameToSlugMap.get(h.name)
        finalHostsSet.add(slug || h.name)
      }
    })

    const hosts = Array.from(finalHostsSet)

    // Extract guests from relationship data and deduplicate
    // Collect all guest data first to find slugs
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

    // Create a map of names to slugs for deduplication
    const guestNameToSlugMap = new Map<string, string>()
    const finalGuestsSet = new Set<string>()

    // First pass: collect all name->slug mappings
    guestData.forEach(g => {
      if (g.slug && g.name) {
        guestNameToSlugMap.set(g.name, g.slug)
      }
    })

    // Second pass: add guests, preferring slugs
    guestData.forEach(g => {
      if (g.slug) {
        finalGuestsSet.add(g.slug)
      } else if (g.name) {
        // Check if we have a slug for this name
        const slug = guestNameToSlugMap.get(g.name)
        finalGuestsSet.add(slug || g.name)
      }
    })

    const guests = Array.from(finalGuestsSet)

    // Clean description and summary by removing HTML first, then escaping for YAML
    const cleanDescription = this.cleanHtmlForYaml(episode.formatted_description || episode.description || '')
    const cleanSummary = this.cleanHtmlForYaml(episode.formatted_summary || episode.summary || '')

    // Try to find the duration in seconds from various possible field names
    // Check for duration_seconds, Duration (capitalized), or numeric duration
    let durationInSeconds = '0'

    // First try to find a numeric duration field
    if (episode.duration_seconds && !episode.duration_seconds.toString().includes(':')) {
      durationInSeconds = episode.duration_seconds.toString()
    } else if (episode.Duration && !episode.Duration.toString().includes(':')) {
      durationInSeconds = episode.Duration.toString()
    } else if (episode.duration && !episode.duration.toString().includes(':')) {
      durationInSeconds = episode.duration.toString()
    } else {
      // If all duration fields contain colons, we have a problem
      console.error(`❌ Episode ${episode.Id || episode.episode_number} has no valid duration in seconds. Available fields:`, {
        duration: episode.duration,
        Duration: episode.Duration,
        duration_seconds: episode.duration_seconds,
        duration_formatted: episode.duration_formatted
      })

      // As a fallback, try to convert MM:SS to seconds
      const formatted = episode.duration || episode.Duration || episode.duration_formatted || '0'
      if (formatted.toString().includes(':')) {
        const parts = formatted.toString().split(':')
        if (parts.length === 2) {
          const minutes = parseInt(parts[0], 10) || 0
          const seconds = parseInt(parts[1], 10) || 0
          durationInSeconds = (minutes * 60 + seconds).toString()
          console.warn(`⚠️ Converted formatted duration "${formatted}" to ${durationInSeconds} seconds for episode ${episode.Id}`)
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
      `language: "${episode.language || this.config.defaultLanguage}"`,
      `duration: "${durationInSeconds}"`,
      `audioUrl: "${episode.media_url || ''}"`,
      episode.image_url ? `imageUrl: "${episode.image_url}"` : '',
      `pubDate: ${episode.published_at ? new Date(episode.published_at).toISOString() : new Date().toISOString()}`,
      `transistorId: "${episode.transistor_id || ''}"`,
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

    // Use formatted description if available, fallback to description
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

  private cleanHtmlContent(html: string): string {
    if (!html) {return ''}
    // Basic HTML to markdown conversion
    return html
      // Remove HTML comments first
      .replace(/<!--[\s\S]*?-->/g, '')
      // Convert lists to markdown
      .replace(/<ul>/g, '\n')
      .replace(/<\/ul>/g, '\n')
      .replace(/<ol>/g, '\n')
      .replace(/<\/ol>/g, '\n')
      .replace(/<li>/g, '- ')
      .replace(/<\/li>/g, '\n')
      // Convert other HTML tags
      .replace(/<div>/g, '')
      .replace(/<\/div>/g, '\n')
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      // Handle inline styles and attributes
      .replace(/<(\w+)([^>]*)>/g, '<$1>') // Remove attributes from tags
      // Convert strong/bold
      .replace(/<strong>/g, '**')
      .replace(/<\/strong>/g, '**')
      .replace(/<b>/g, '**')
      .replace(/<\/b>/g, '**')
      // Convert emphasis/italic
      .replace(/<em>/g, '*')
      .replace(/<\/em>/g, '*')
      .replace(/<i>/g, '*')
      .replace(/<\/i>/g, '*')
      // Remove any remaining HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode HTML entities
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'")
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  private async generateGuestsWithTracking(guests: any[], generatedFiles: Set<string>): Promise<void> {
    console.log('👥 Generating guests...')
    console.log(`🔍 Processing ${guests.length} guests from NocoDB`)

    // Log first guest structure to understand data format
    if (guests.length > 0) {
      console.log('🔍 FIRST GUEST STRUCTURE:', JSON.stringify(guests[0], null, 2))
    }

    // Look specifically for Amber Taal to debug image URL issue
    const amberGuest = guests.find(g => g.name && g.name.toLowerCase().includes('amber'))
    if (amberGuest) {
      console.log('🔍 FOUND AMBER TAAL GUEST:', JSON.stringify(amberGuest, null, 2))
    }

    for (const guest of guests) {
      try {
        const filePath = await this.generateGuestMDX(guest)
        if (filePath) {
          generatedFiles.add(filePath)
          this.stats.guestsGenerated++
        }
      } catch (error) {
        const errorMsg = `Failed to generate guest ${guest.Id}: ${error instanceof Error ? error.message : String(error)}`
        this.stats.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }
  }

  private async generateGuestMDX(guest: any): Promise<string> {
    // Validate required fields
    if (!guest.slug && !guest.name) {
      throw new Error('Guest missing both slug and name - cannot generate file')
    }

    const slug = guest.slug || guest.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const guestPath = join(this.config.outputDir, 'guests', `${slug}.mdx`)

    // Always overwrite to ensure updates are synced

    const frontmatter = this.generateGuestFrontmatter(guest, slug)
    const content = this.generateGuestContent(guest)
    const mdxContent = `---\n${frontmatter}\n---\n\n${content}`

    await this.ensureDirectoryExists(dirname(guestPath))
    await fs.writeFile(guestPath, mdxContent, 'utf8')

    return guestPath
  }

  private generateGuestFrontmatter(guest: any, slug: string): string {
    // Debug logging for first few guests to understand data structure
    if (this.stats.guestsGenerated < 5) {
      console.log(`🔍 Debug guest #${this.stats.guestsGenerated + 1} data:`, JSON.stringify({
        name: guest.name,
        slug: guest.slug,
        image_url: guest.image_url,
        imageUrl: guest.imageUrl,
        image: guest.image,
        allFields: Object.keys(guest)
      }, null, 2))
    }

    // Also log if this is specifically the amber-taal guest
    if (guest.name && guest.name.toLowerCase().includes('amber')) {
      console.log('🔍 DEBUG AMBER TAAL guest data:', JSON.stringify(guest, null, 2))
    }

    // Try different possible image field names
    const imageValue = guest.image_url || guest.imageUrl || guest.image || guest.Image || guest.photo_url || guest.picture
    if (guest.name && guest.name.toLowerCase().includes('amber')) {
      console.log('🔍 AMBER IMAGE FIELD CHECK:', {
        image_url: guest.image_url,
        imageUrl: guest.imageUrl,
        image: guest.image,
        Image: guest.Image,
        photo_url: guest.photo_url,
        picture: guest.picture,
        finalValue: imageValue
      })
    }

    // Filter episodes to only include published ones
    const allEpisodes = Array.isArray(guest.Episodes) ? guest.Episodes : []
    const publishedEpisodes = allEpisodes.filter((e: any) => e.status === 'published' || !e.status) // Default to published if no status
    const episodes = publishedEpisodes.map((e: any) => e.slug || e.Id)
    const episodeCount = publishedEpisodes.length

    const languages = Array.isArray(guest.Language) ? guest.Language : [this.config.defaultLanguage]

    // Create social links array from individual fields
    const socialLinks = []
    if (guest.LinkedIn) {
      socialLinks.push({ platform: 'linkedin', url: guest.LinkedIn })
    }

    return [
      `name: "${this.escapeYaml(guest.name || '')}"`,
      `slug: "${slug}"`,
      `bio: "${this.escapeYaml(guest.ai_bio || guest.bio || '')}"`,
      guest.company ? `company: "${this.escapeYaml(guest.company)}"` : '',
      guest.role ? `role: "${this.escapeYaml(guest.role)}"` : '',
      `episodeCount: ${episodeCount}`,
      `episodes: [${episodes.map((e: string) => `"${e}"`).join(', ')}]`,
      `languages: [${languages.map((l: string) => `"${l}"`).join(', ')}]`,
      this.getGuestImageUrl(imageValue),
      `socialLinks: ${JSON.stringify(socialLinks)}`,
      `createdAt: ${new Date(guest.CreatedAt || Date.now()).toISOString()}`,
      `updatedAt: ${new Date(guest.UpdatedAt || Date.now()).toISOString()}`
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
      if (guest.company) {content.push(`**Company**: ${guest.company}`)}
      if (guest.role) {content.push(`**Role**: ${guest.role}`)}
      content.push('')
    }

    return content.join('\n')
  }

  private async generateHostsWithTracking(hosts: any[], generatedFiles: Set<string>): Promise<void> {
    console.log('🎙️ Generating hosts...')

    for (const host of hosts) {
      try {
        const filePath = await this.generateHostMDX(host)
        if (filePath) {
          generatedFiles.add(filePath)
          this.stats.hostsGenerated++
        }
      } catch (error) {
        const errorMsg = `Failed to generate host ${host.Id}: ${error instanceof Error ? error.message : String(error)}`
        this.stats.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }
  }

  private async generateHostMDX(host: any): Promise<string> {
    // Validate required fields
    if (!host.slug && !host.name) {
      throw new Error('Host missing both slug and name - cannot generate file')
    }

    const slug = host.slug || host.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const hostPath = join(this.config.outputDir, 'hosts', `${slug}.mdx`)

    // Always overwrite to ensure updates are synced

    const frontmatter = this.generateHostFrontmatter(host, slug)
    const content = host.bio || ''
    const mdxContent = `---\n${frontmatter}\n---\n\n${content}`

    await this.ensureDirectoryExists(dirname(hostPath))
    await fs.writeFile(hostPath, mdxContent, 'utf8')

    return hostPath
  }

  private generateHostFrontmatter(host: any, slug: string): string {
    const episodes = Array.isArray(host.Episodes) ? host.Episodes.map((e: any) => e.slug || e.Id) : []

    // Debug logging for first few hosts to see the data structure
    if (this.stats.hostsGenerated < 3) {
      console.log(`🔍 Debug host #${this.stats.hostsGenerated + 1} data:`, JSON.stringify({
        name: host.name,
        slug: host.slug,
        linkedin: host.linkedin,
        LinkedIn: host.LinkedIn,
        image_url: host.image_url,
        allFields: Object.keys(host)
      }, null, 2))
    }

    // Handle LinkedIn field - NocoDB only has 'linkedin' field now
    let linkedinValue = ''
    if (host.linkedin || host.LinkedIn) {
      const linkedin = host.linkedin || host.LinkedIn
      // Ensure it's a full URL
      const linkedinUrl = linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`
      linkedinValue = linkedinUrl
    }

    // Create social links array for backward compatibility
    const socialLinks = []
    if (host.website || host.Website) {
      socialLinks.push({ platform: 'website', url: host.website || host.Website })
    }
    if (host.twitter || host.Twitter) {
      const twitter = host.twitter || host.Twitter
      const twitterUrl = twitter.startsWith('http') ? twitter : `https://twitter.com/${twitter.replace('@', '')}`
      socialLinks.push({ platform: 'twitter', url: twitterUrl })
    }
    if (linkedinValue) {
      socialLinks.push({ platform: 'linkedin', url: linkedinValue })
    }

    // Handle image URL - allow both relative and absolute URLs
    let imageUrlField = ''
    if (host.image_url) {
      if (this.isValidUrl(host.image_url)) {
        imageUrlField = `imageUrl: "${host.image_url}"`
      } else if (host.image_url && typeof host.image_url === 'string') {
        // Check if it already contains the path
        if (host.image_url.startsWith('/images/hosts/')) {
          imageUrlField = `imageUrl: "${host.image_url}"`
        } else {
          // Assume it's just a filename and construct the path
          imageUrlField = `imageUrl: "/images/hosts/${host.image_url}"`
        }
      }
    }

    return [
      `name: "${this.escapeYaml(host.name || '')}"`,
      `slug: "${slug}"`,
      `bio: "${this.escapeYaml(host.bio || '')}"`,
      host.company ? `company: "${this.escapeYaml(host.company)}"` : '',
      host.title ? `title: "${this.escapeYaml(host.title)}"` : '',
      host.role ? `role: "${this.escapeYaml(host.role)}"` : '',
      imageUrlField,
      linkedinValue ? `linkedin: "${linkedinValue}"` : '',
      `episodes: [${episodes.map((e: string) => `"${e}"`).join(', ')}]`,
      `socialLinks: ${JSON.stringify(socialLinks)}`,
      `createdAt: ${new Date(host.CreatedAt || Date.now()).toISOString()}`,
      `updatedAt: ${new Date(host.UpdatedAt || Date.now()).toISOString()}`
    ].filter(Boolean).join('\n')
  }

  private async generatePlatformsWithTracking(platforms: any[], generatedFiles: Set<string>): Promise<void> {
    console.log('🎵 Generating platforms...')
    console.log(`🔍 Processing ${platforms.length} platforms from NocoDB`)

    // Debug: Log first platform structure
    if (platforms.length > 0) {
      console.log('📊 Sample platform data structure:', JSON.stringify(platforms[0], null, 2))
    }

    for (const platform of platforms) {
      try {
        const filePath = await this.generatePlatformJSON(platform)
        if (filePath) {
          generatedFiles.add(filePath)
          this.stats.platformsGenerated++
        }
      } catch (error) {
        const errorMsg = `Failed to generate platform ${platform.Id || platform.id}: ${error instanceof Error ? error.message : String(error)}`
        this.stats.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }
  }

  private async generatePlatformJSON(platform: any): Promise<string> {
    // Use the actual field names from NocoDB (case-sensitive - Name with capital N)
    const name = platform.Name || platform.name || `Platform ${platform.Id || platform.id}`
    const slug = platform.slug || platform.Slug || name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const platformPath = join(this.config.outputDir, 'platforms', `${slug}.json`)

    // Always overwrite to ensure updates are synced

    // Build URLs object with all required languages using actual field names
    const urls = {
      en: platform.url_en || '',
      nl: platform.url_nl || '',
      de: platform.url_de || '',
      es: platform.url_es || ''
    }

    // Get iconUrl - check for logo_url field or use default local icon path
    const iconUrl = this.isValidUrl(platform.logo_url) ? platform.logo_url :
      this.isValidUrl(platform.icon_url) ? platform.icon_url :
        this.isValidUrl(platform.icon) ? platform.icon :
          `/images/platforms/${slug}.png` // Use relative path for local icons

    // Use proper field mapping for actual NocoDB data structure
    const platformData: any = {
      id: platform.Id,
      name: name,
      slug: slug,
      iconUrl: iconUrl,
      urls: urls,
      displayOrder: platform.display_order || 0,
      isActive: platform.is_active !== undefined ? platform.is_active : true,
      createdAt: new Date(platform.CreatedAt || Date.now()).toISOString(),
      updatedAt: new Date(platform.UpdatedAt || Date.now()).toISOString()
    }

    console.log(`📝 Creating platform file: ${slug}.json for platform: ${name}`)

    await this.ensureDirectoryExists(dirname(platformPath))
    await fs.writeFile(platformPath, JSON.stringify(platformData, null, 2), 'utf8')

    return platformPath
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

  private cleanHtmlForYaml(html: string): string {
    if (!html) {return ''}

    // First clean HTML thoroughly
    const cleaned = this.cleanHtmlContent(html)

    // Then escape for YAML
    return this.escapeYaml(cleaned)
  }

  private escapeYaml(str: string): string {
    if (!str) {return ''}
    // Clean and escape for YAML safely
    return str
      .replace(/\\/g, '\\\\') // Escape backslashes first
      .replace(/"/g, '\\"') // Then escape quotes
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
  }

  private isValidUrl(url: string | null | undefined): boolean {
    if (!url) {return false}
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private getGuestImageUrl(imageUrl: string | null | undefined): string {
    // Log processing for debugging
    if (Math.random() < 0.02 || !imageUrl) { // Log 2% of guests or all empty cases
      console.log('🔍 PROCESSING imageUrl:', { imageUrl, type: typeof imageUrl })
    }

    // If no imageUrl, return empty
    if (!imageUrl) {
      return ''
    }

    // If it's already a full URL, use it as-is
    if (this.isValidUrl(imageUrl)) {
      console.log('🔍 Found valid URL imageUrl:', imageUrl)
      return `imageUrl: "${imageUrl}"`
    }

    // If it's a relative filename, construct the path to /images/guests/
    if (imageUrl && typeof imageUrl === 'string') {
      // Extract just the filename if it includes a path
      let filename = imageUrl
      if (imageUrl.includes('/')) {
        const parts = imageUrl.split('/')
        filename = parts[parts.length - 1]
      }
      
      // Sanitize the filename to handle special characters
      const sanitizedFilename = sanitizeImageFilename(filename)
      
      // Log if sanitization was needed
      if (needsSanitization(filename)) {
        console.log('🔄 Sanitized image filename:', {
          original: filename,
          sanitized: sanitizedFilename,
          guestImageUrl: imageUrl
        })
      }
      
      // Check if it already contains the path
      if (imageUrl.startsWith('/images/guests/')) {
        // Extract filename and sanitize
        const pathFilename = imageUrl.replace('/images/guests/', '')
        const sanitizedPath = sanitizeImageFilename(pathFilename)
        console.log('🔍 ImageUrl already has path, sanitizing:', imageUrl, `-> /images/guests/${sanitizedPath}`)
        return `imageUrl: "/images/guests/${sanitizedPath}"`
      } else {
        console.log('🔍 Converting relative imageUrl:', filename, `-> /images/guests/${sanitizedFilename}`)
        return `imageUrl: "/images/guests/${sanitizedFilename}"`
      }
    }

    return ''
  }

  getStats(): GenerationStats {
    return { ...this.stats }
  }
}