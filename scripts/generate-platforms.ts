#!/usr/bin/env tsx
/**
 * Platform-specific content generator for NocoDB sync
 * Handles only platform content to prevent cross-contamination
 */

import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { config } from 'dotenv'
import { NocoDBWorkingClient } from '../src/lib/services/nocodb-working-client'
import { DeletionTracker } from '../src/lib/engines/deletion-tracker'

// Load environment variables
config()

interface PlatformGenerationStats {
  platformsGenerated: number
  filesDeleted: number
  errors: string[]
  startTime: Date
  endTime?: Date
}

class PlatformGenerator {
  private client: NocoDBWorkingClient
  private outputDir: string
  private stats: PlatformGenerationStats

  constructor(client: NocoDBWorkingClient) {
    this.client = client
    this.outputDir = 'src/content/platforms'
    this.stats = {
      platformsGenerated: 0,
      filesDeleted: 0,
      errors: [],
      startTime: new Date()
    }
  }

  async generate(): Promise<PlatformGenerationStats> {
    console.log('🎵 Starting platform generation...')
    
    try {
      // Test connection
      const connected = await this.client.testConnection()
      if (!connected) {
        throw new Error('Failed to connect to NocoDB')
      }

      // Create output directory
      await this.ensureDirectoryExists(this.outputDir)

      // Initialize deletion tracker
      const deletionTracker = new DeletionTracker('src/content')
      
      // Get existing platform files
      const existingFiles = await this.getExistingFiles()
      console.log(`📁 Found ${existingFiles.size} existing platform files`)

      // Fetch platforms from NocoDB
      console.log('📥 Fetching platforms from NocoDB...')
      const platforms = await this.client.getPlatforms({ limit: 100 })
      console.log(`📊 Found ${platforms.length} platforms in NocoDB`)

      // Generate platform files
      const generatedFiles = new Set<string>()
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

      // Delete orphaned files
      const filesToDelete = Array.from(existingFiles).filter(file => !generatedFiles.has(file))
      if (filesToDelete.length > 0) {
        console.log(`🗑️ Found ${filesToDelete.length} orphaned platform files to delete`)
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
      
      console.log(`✅ Platform generation complete in ${duration}ms`)
      console.log(`✅ Generated ${this.stats.platformsGenerated} platforms`)
      
      if (this.stats.filesDeleted > 0) {
        console.log(`🗑️ Deleted ${this.stats.filesDeleted} orphaned files`)
      }
      
      if (this.stats.errors.length > 0) {
        console.log(`⚠️ ${this.stats.errors.length} errors occurred`)
      }

    } catch (error) {
      this.stats.errors.push(`Generation failed: ${error instanceof Error ? error.message : String(error)}`)
      console.error('❌ Platform generation failed:', error)
    }

    return this.stats
  }

  private async generatePlatformJSON(platform: any): Promise<string> {
    const name = platform.Name || platform.name || `Platform ${platform.Id || platform.id}`
    const slug = platform.slug || platform.Slug || name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const platformPath = join(this.outputDir, `${slug}.json`)

    // Build URLs object
    const urls = {
      en: platform.url_en || '',
      nl: platform.url_nl || '',
      de: platform.url_de || '',
      es: platform.url_es || ''
    }

    // Get iconUrl
    const iconUrl = this.isValidUrl(platform.logo_url) ? platform.logo_url :
                   this.isValidUrl(platform.icon_url) ? platform.icon_url :
                   this.isValidUrl(platform.icon) ? platform.icon :
                   `/images/platforms/${slug}.png`
    
    const platformData = {
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

    console.log(`📝 Creating platform: ${slug}`)
    console.log(`   - URLs: EN: ${urls.en ? '✓' : '✗'}, NL: ${urls.nl ? '✓' : '✗'}, DE: ${urls.de ? '✓' : '✗'}, ES: ${urls.es ? '✓' : '✗'}`)
    if (slug === 'rss') {
      console.log(`   - RSS NL URL: ${urls.nl}`)
    }

    await fs.writeFile(platformPath, JSON.stringify(platformData, null, 2), 'utf8')
    
    return platformPath
  }

  private async getExistingFiles(): Promise<Set<string>> {
    const files = new Set<string>()
    try {
      const entries = await fs.readdir(this.outputDir)
      for (const entry of entries) {
        if (entry.endsWith('.json')) {
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

    const client = new NocoDBWorkingClient({
      apiKey,
      baseUrl,
      baseId
    })

    const generator = new PlatformGenerator(client)
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