#!/usr/bin/env tsx
/**
 * Guest-specific content generator for NocoDB sync
 * Handles only guest content to prevent cross-contamination
 */

import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { NocdbClient } from '../src/lib/services/nocodb-service'

interface GuestGenerationStats {
  guestsGenerated: number
  filesDeleted: number
  errors: string[]
  startTime: Date
  endTime?: Date
}

class GuestGenerator {
  private client: NocdbClient
  private outputDir: string
  private stats: GuestGenerationStats

  constructor(client: NocdbClient) {
    this.client = client
    this.outputDir = 'src/content/guests'
    this.stats = {
      guestsGenerated: 0,
      filesDeleted: 0,
      errors: [],
      startTime: new Date()
    }
  }

  async generate(): Promise<GuestGenerationStats> {
    console.log('👥 Starting guest generation...')
    
    try {
      // Test connection
      const connected = await this.client.testConnection()
      if (!connected) {
        throw new Error('Failed to connect to NocoDB')
      }

      // Create output directory
      await this.ensureDirectoryExists(this.outputDir)

      // Get existing guest files
      const existingFiles = await this.getExistingFiles()
      console.log(`📁 Found ${existingFiles.size} existing guest files`)

      // Fetch guests from NocoDB
      console.log('📥 Fetching guests from NocoDB...')
      const guests = await this.client.getGuests({ limit: 1000 })
      console.log(`📊 Found ${guests.length} guests in NocoDB`)

      // Generate guest files
      const generatedFiles = new Set<string>()
      
      // Debug: Log first guest to see field names
      if (guests.length > 0) {
        console.log('📋 Sample guest data structure:')
        console.log(JSON.stringify(guests[0], null, 2))
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

      // Delete orphaned files
      const filesToDelete = Array.from(existingFiles).filter(file => !generatedFiles.has(file))
      if (filesToDelete.length > 0) {
        console.log(`🗑️ Found ${filesToDelete.length} orphaned guest files to delete`)
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
      
      console.log(`✅ Guest generation complete in ${duration}ms`)
      console.log(`✅ Generated ${this.stats.guestsGenerated} guests`)
      
      if (this.stats.filesDeleted > 0) {
        console.log(`🗑️ Deleted ${this.stats.filesDeleted} orphaned files`)
      }
      
      if (this.stats.errors.length > 0) {
        console.log(`⚠️ ${this.stats.errors.length} errors occurred`)
      }

    } catch (error) {
      this.stats.errors.push(`Generation failed: ${error instanceof Error ? error.message : String(error)}`)
      console.error('❌ Guest generation failed:', error)
    }

    return this.stats
  }

  private async generateGuestMDX(guest: any): Promise<string> {
    if (!guest.slug && !guest.name) {
      throw new Error('Guest missing both slug and name - cannot generate file')
    }
    
    const slug = guest.slug || guest.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const guestPath = join(this.outputDir, `${slug}.mdx`)

    const frontmatter = this.generateGuestFrontmatter(guest, slug)
    const content = this.generateGuestContent(guest)
    const mdxContent = `---\n${frontmatter}\n---\n\n${content}`

    console.log(`📝 Creating guest: ${slug}`)

    await fs.writeFile(guestPath, mdxContent, 'utf8')
    
    return guestPath
  }

  private generateGuestFrontmatter(guest: any, slug: string): string {
    // Try different possible image field names
    const imageValue = guest.image_url || guest.imageUrl || guest.image || guest.Image || guest.photo_url || guest.picture
    
    // Filter episodes to only include published ones
    const allEpisodes = Array.isArray(guest.Episodes) ? guest.Episodes : []
    const publishedEpisodes = allEpisodes.filter((e: any) => e.status === 'published' || !e.status)
    const episodes = publishedEpisodes.map((e: any) => e.slug || e.Id)
    const episodeCount = publishedEpisodes.length
    
    const languages = Array.isArray(guest.Language) ? guest.Language : ['en']
    
    // Create social links array
    const socialLinks = []
    if (guest.LinkedIn) {
      socialLinks.push({ platform: 'linkedin', url: guest.LinkedIn })
    }

    // Check for isFeatured in different possible field names
    const isFeatured = guest.isFeatured ?? guest.is_featured ?? guest.IsFeatured ?? guest.Featured ?? false;
    
    // Debug log for first few guests
    if (this.stats.guestsGenerated < 3) {
      console.log(`Guest ${guest.name}: isFeatured=${isFeatured}, raw fields:`, {
        isFeatured: guest.isFeatured,
        is_featured: guest.is_featured,
        IsFeatured: guest.IsFeatured,
        Featured: guest.Featured
      });
    }
    
    return [
      `name: "${this.escapeYaml(guest.name || '')}"`,
      `slug: "${slug}"`,
      `isFeatured: ${isFeatured}`,
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
    ].filter(line => line !== null && line !== '').join('\n')
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

  private getGuestImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) {
      return ''
    }
    
    // If it's already a full URL, use it as-is
    if (this.isValidUrl(imageUrl)) {
      return `imageUrl: "${imageUrl}"`
    }
    
    // If it's a relative filename, construct the path
    if (imageUrl && typeof imageUrl === 'string') {
      if (imageUrl.startsWith('/images/guests/')) {
        return `imageUrl: "${imageUrl}"`
      } else {
        return `imageUrl: "/images/guests/${imageUrl}"`
      }
    }
    
    return ''
  }

  private async getExistingFiles(): Promise<Set<string>> {
    const files = new Set<string>()
    try {
      const entries = await fs.readdir(this.outputDir)
      for (const entry of entries) {
        if (entry.endsWith('.mdx')) {
          files.add(join(this.outputDir, entry))
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }
    return files
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

  private isValidUrl(url: string | null | undefined): boolean {
    if (!url) return false
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
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

// Main execution
async function main() {
  try {
    const apiKey = process.env.NOCODB_API_KEY
    const baseUrl = process.env.NOCODB_BASE_URL
    const baseId = process.env.NOCODB_BASE_ID

    if (!apiKey || !baseUrl || !baseId) {
      throw new Error('Missing required environment variables: NOCODB_API_KEY, NOCODB_BASE_URL, NOCODB_BASE_ID')
    }

    const client = new NocdbClient({
      apiKey,
      baseUrl,
      baseId
    })

    const generator = new GuestGenerator(client)
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
main()